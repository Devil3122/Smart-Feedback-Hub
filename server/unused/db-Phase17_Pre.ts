import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import * as schema from "../drizzle/schema";

import { randomBytes, scryptSync } from "crypto";

export function isDbConnectionError(err: any): boolean {
  if (!err) return false;
  if (err.code && typeof err.code === 'string' && err.code.startsWith('08')) {
    return true;
  }
  const msg = err.message?.toLowerCase() || '';
  if (msg.includes('timeout') || msg.includes('connection') || msg.includes('socket') || msg.includes('pool')) {
    return true;
  }
  return false;
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derivedKey}`;
}

let activePool: Pool | null = null;
let activeDbInstance: any = null;
let activeMockDbInstance: any = null;

function getPoolConfig() {
  const isVercel = !!process.env.VERCEL;
  
  let connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    const pgUser = process.env.PGUSER || "postgres";
    const pgPassword = process.env.PGPASSWORD || "";
    const pgHost = process.env.PGHOST || "localhost";
    const pgPort = process.env.PGPORT || "5432";
    const pgDb = process.env.PGDATABASE || "smart-feedback-hub";
    
    // Natively encoding special characters like `@`
    connectionString = `postgresql://${encodeURIComponent(pgUser)}:${encodeURIComponent(pgPassword)}@${pgHost}:${pgPort}/${encodeURIComponent(pgDb)}`;
  }

  const config: any = {
    connectionString,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
    allowExitOnIdle: true
  };

  if (isVercel) {
    config.ssl = { rejectUnauthorized: false };
  }

  return config;
}

function createMockDb() {
  console.warn("No database connection configured (PGHOST / DATABASE_URL). Using in-memory mock database client.");
  
  let nextUserId = 1;
  const mockFeedbacks: any[] = [];
  const mockAdmins: any[] = [{
    id: 1,
    username: 'Devil',
    passwordHash: hashPassword('Devil@2231'),
    role: 'superadmin',
    createdAt: new Date(),
  }];
  const mockCampaigns: any[] = [];
  const mockUsers: any[] = [];
  const mockFeedbackHistory: any[] = [];
  const mockForms: any[] = [];
  
  return {
    insert: (table: any) => {
      return {
        values: (value: any) => {
          return {
            returning: async () => {
              let store;
              if (table === schema.feedbacks) store = mockFeedbacks;
              else if (table === schema.admins) store = mockAdmins;
              else if (table === schema.campaigns) store = mockCampaigns;
              else if (table === schema.users) store = mockUsers;
              else if (table === schema.feedbackHistory) store = mockFeedbackHistory;
              else if (table === schema.forms) store = mockForms;
              else store = mockFeedbacks;

              if (table === schema.users) {
                const u = { ...value, id: nextUserId++, isVerified: value.isVerified ?? false, isResetApproved: value.isResetApproved ?? false, status: value.status || "Active", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
                mockUsers.push(u);
                return [u];
              }

              if (table === schema.forms) {
                const f = {
                  id: mockForms.length + 1,
                  ...value,
                  publishedAt: value.publishedAt || new Date().toISOString(),
                  createdAt: new Date().toISOString(),
                };
                mockForms.push(f);
                return [f];
              }

              const newRecord = {
                id: store.length + 1,
                ...value,
                createdAt: new Date(),
                updatedAt: new Date(),
              };
              store.push(newRecord);
              return [newRecord];
            }
          };
        }
      };
    },
    select: (fields?: any) => {
      return {
        from: (table: any) => {
          let store: any[];
          if (table === schema.feedbacks) store = mockFeedbacks;
          else if (table === schema.admins) store = mockAdmins;
          else if (table === schema.campaigns) store = mockCampaigns;
          else if (table === schema.users) store = mockUsers;
          else if (table === schema.feedbackHistory) store = mockFeedbackHistory;
          else if (table === schema.forms) store = mockForms;
          else store = mockFeedbacks;

          return {
            orderBy: async (orderCol: any) => {
              return [...store].reverse();
            },
            where: async (condition: any) => {
              return store;
            },
            execute: async () => {
              return store;
            },
            then: (resolve: any) => resolve(store)
          };
        }
      };
    },
    update: (table: any) => {
      return {
        set: (values: any) => {
          return {
            where: async (condition: any) => {
              return [];
            }
          };
        }
      };
    },
    transaction: async (cb: (tx: any) => Promise<any>) => {
      const stateSnapshot = {
        feedbacks: JSON.stringify(mockFeedbacks),
        users: JSON.stringify(mockUsers),
        campaigns: JSON.stringify(mockCampaigns),
        history: JSON.stringify(mockFeedbackHistory),
        forms: JSON.stringify(mockForms),
      };
      try {
        return await cb(activeMockDbInstance);
      } catch (e) {
        mockFeedbacks.length = 0; mockFeedbacks.push(...JSON.parse(stateSnapshot.feedbacks));
        mockUsers.length = 0; mockUsers.push(...JSON.parse(stateSnapshot.users));
        mockCampaigns.length = 0; mockCampaigns.push(...JSON.parse(stateSnapshot.campaigns));
        mockFeedbackHistory.length = 0; mockFeedbackHistory.push(...JSON.parse(stateSnapshot.history));
        mockForms.length = 0; mockForms.push(...JSON.parse(stateSnapshot.forms));
        throw e;
      }
    }
  };
}

export function getDb() {
  if (!process.env.DATABASE_URL && !process.env.PGHOST) {
    if (!activeMockDbInstance) {
      activeMockDbInstance = createMockDb();
    }
    return activeMockDbInstance;
  }

  // Neon 'Pool' object has 'ending' and 'ended' boolean properties depending on driver implementation.
  // Using an explicit check ensures that if Vercel reaps the socket context, we reconstruct it cleanly.
  if (!activePool || (activePool as any).ended || (activePool as any).ending) {
    console.log("[DB] Initializing new connection pool instance.");
    activePool = new Pool(getPoolConfig());
    activeDbInstance = drizzle(activePool, { schema });
  }

  return activeDbInstance;
}

export const db = new Proxy({}, {
  get(target, prop) {
    const instance = getDb();
    if (!instance) throw new Error("Database instance not initialized");
    const value = instance[prop as keyof typeof instance];
    if (typeof value === "function") {
      return value.bind(instance);
    }
    return value;
  }
}) as ReturnType<typeof drizzle>;

export async function withTransaction<T>(cb: (tx: any) => Promise<T>): Promise<T> {
  const instance = getDb();
  if (instance && instance.transaction) {
    return await instance.transaction(cb);
  }
  return await cb(instance);
}

export { schema };
