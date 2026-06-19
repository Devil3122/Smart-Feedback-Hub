import { Pool as PgPool } from "pg";
import { createPool as createVercelPool } from "@vercel/postgres";
import { drizzle as drizzleNode } from "drizzle-orm/node-postgres";
import { drizzle as drizzleVercel } from "drizzle-orm/vercel-postgres";
import * as schema from "../drizzle/schema";
import { randomBytes, scryptSync } from "crypto";

const isVercel = !!process.env.VERCEL;

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

let activePool: any = null;
let activeDbInstance: any = null;
let initializationPromise: Promise<void> | null = null;

async function runAutoMigrations(pool: any) {
  console.log("[DB] Running pre-flight table verification and auto-seeding...");
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS notes (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        plain_password TEXT,
        status VARCHAR(50) DEFAULT 'Active' NOT NULL,
        is_verified BOOLEAN DEFAULT false NOT NULL,
        is_reset_approved BOOLEAN DEFAULT false NOT NULL,
        otp_code TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS admins (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        role VARCHAR(50) DEFAULT 'admin' NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS campaigns (
        id SERIAL PRIMARY KEY,
        campaign_name TEXT NOT NULL,
        qr_code_url TEXT NOT NULL,
        folder_path TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS forms (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        fields JSONB NOT NULL,
        is_global_push BOOLEAN DEFAULT false NOT NULL,
        qr_code_url TEXT,
        folder_path TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        published_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS feedbacks (
        id SERIAL PRIMARY KEY,
        full_name TEXT NOT NULL,
        contact TEXT NOT NULL,
        student_id TEXT,
        text_content TEXT NOT NULL,
        audio_url TEXT,
        category VARCHAR(50) NOT NULL,
        sentiment VARCHAR(50) NOT NULL,
        priority VARCHAR(50) NOT NULL,
        topics JSONB NOT NULL,
        campaign_id INTEGER,
        user_id INTEGER,
        form_id INTEGER,
        rating INTEGER,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        deleted_at TIMESTAMP WITH TIME ZONE
      );

      CREATE TABLE IF NOT EXISTS feedback_history (
        id SERIAL PRIMARY KEY,
        original_feedback_id INTEGER NOT NULL,
        previous_text TEXT NOT NULL,
        previous_audio_url TEXT,
        proposed_text TEXT,
        proposed_rating INTEGER,
        review_status VARCHAR(50) DEFAULT 'Pending' NOT NULL,
        modified_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );
    `);

    // Auto-seed Super Admin
    const adminCheck = await pool.query(`SELECT id FROM admins WHERE username = $1`, ['Devil']);
    if (adminCheck.rows.length === 0) {
      console.log("[DB] Seeding Super Admin...");
      await pool.query(
        `INSERT INTO admins (username, password_hash, role) VALUES ($1, $2, $3)`,
        ['Devil', hashPassword('Devil@2231'), 'superadmin']
      );
    }
    console.log("[DB] Pre-flight verification complete.");
  } catch (error) {
    console.error("[DB] Migration script failed:", error);
  }
}

function getLocalConnectionString(): string {
  let connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    const pgUser = process.env.PGUSER || "postgres";
    const pgPassword = process.env.PGPASSWORD || "";
    const pgHost = process.env.PGHOST || "localhost";
    const pgPort = process.env.PGPORT || "5432";
    const pgDb = process.env.PGDATABASE || "smart-feedback-hub";
    connectionString = `postgresql://${encodeURIComponent(pgUser)}:${encodeURIComponent(pgPassword)}@${pgHost}:${pgPort}/${encodeURIComponent(pgDb)}`;
  }
  return connectionString;
}

export function getDb() {
  if (!activePool) {
    if (isVercel) {
      // ── Vercel production: use @vercel/postgres pooling ──
      console.log("[DB] Initializing Vercel Postgres pool...");
      activePool = createVercelPool();
      activeDbInstance = drizzleVercel(activePool, { schema });
    } else {
      // ── Local development: use standard pg Pool ──
      const connectionString = getLocalConnectionString();
      console.log("[DB] Initializing local PostgreSQL pool...");
      activePool = new PgPool({
        connectionString,
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
      });
      activeDbInstance = drizzleNode(activePool, { schema });
    }
    initializationPromise = runAutoMigrations(activePool);
  }

  return activeDbInstance;
}
// Ensure migrations complete before any query runs
export async function ensureDbReady() {
  getDb();
  if (initializationPromise) {
    await initializationPromise;
    initializationPromise = null;
  }
}

// Initialization is lazy — handled by the Proxy on first DB access

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
}) as any;

export async function withTransaction<T>(cb: (tx: any) => Promise<T>): Promise<T> {
  const instance = getDb();
  if (initializationPromise) await initializationPromise;
  
  if (instance && (instance as any).transaction) {
    return await (instance as any).transaction(cb);
  }
  return await cb(instance);
}

export { schema };
