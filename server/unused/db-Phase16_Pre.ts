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

const databaseUrl = process.env.DATABASE_URL;

let dbInstance: any;

if (!databaseUrl) {
  console.warn("DATABASE_URL is not set. Using in-memory mock database client.");
  
  let nextUserId = 1;
  // In-memory stores for mock db
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
  
  dbInstance = {
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
              // Basic mock where clause - we'll implement full array filtering in routes if needed, 
              // but for basic select().from(table).where(...) returning all for now, 
              // actually we should just return the array to let routes filter it.
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
              // Mock update: in reality our routes just mutate objects directly since they hold references
              // We'll trust the direct mutation for this mock
              return [];
            }
          };
        }
      };
    },
    transaction: async (cb: (tx: any) => Promise<any>) => {
      // Mock transaction: snapshot state, run cb, restore if error
      const stateSnapshot = {
        feedbacks: JSON.stringify(mockFeedbacks),
        users: JSON.stringify(mockUsers),
        campaigns: JSON.stringify(mockCampaigns),
        history: JSON.stringify(mockFeedbackHistory),
        forms: JSON.stringify(mockForms),
      };
      try {
        return await cb(dbInstance);
      } catch (e) {
        // Restore
        mockFeedbacks.length = 0; mockFeedbacks.push(...JSON.parse(stateSnapshot.feedbacks));
        mockUsers.length = 0; mockUsers.push(...JSON.parse(stateSnapshot.users));
        mockCampaigns.length = 0; mockCampaigns.push(...JSON.parse(stateSnapshot.campaigns));
        mockFeedbackHistory.length = 0; mockFeedbackHistory.push(...JSON.parse(stateSnapshot.history));
        mockForms.length = 0; mockForms.push(...JSON.parse(stateSnapshot.forms));
        throw e;
      }
    }
  };
} else {
  const pool = new Pool({
    connectionString: databaseUrl,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
    allowExitOnIdle: true
  });
  dbInstance = drizzle(pool, { schema });
}

export const db = dbInstance;

export async function withTransaction<T>(cb: (tx: any) => Promise<T>): Promise<T> {
  if (dbInstance.transaction) {
    return await dbInstance.transaction(cb);
  }
  return await cb(dbInstance);
}

export { schema };
