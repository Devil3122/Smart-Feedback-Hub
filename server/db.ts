/**
 * db.ts — Neon PostgreSQL connection layer
 *
 * Strategy (per Neon skill guidance):
 *   • Vercel Fluid Compute / long-running local dev → pg Pool at module scope.
 *   • DATABASE_URL must point to the Neon pooler endpoint (-pooler suffix).
 *   • ssl.rejectUnauthorized: false ensures Vercel serverless TLS handshakes
 *     succeed without raw-string crashes or connectivity timeouts.
 *
 * Previous dual-driver (@vercel/postgres + local pg) version is archived at:
 *   server/unused/db-pre-neon.ts
 */
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "../drizzle/schema";
import { randomBytes, scryptSync } from "crypto";

// ── Structured error classifier ───────────────────────────────────────────────
export function isDbConnectionError(err: any): boolean {
  if (!err) return false;
  // PostgreSQL connection-class error codes start with "08"
  if (err.code && typeof err.code === "string" && err.code.startsWith("08")) {
    return true;
  }
  const msg = (err.message || "").toLowerCase();
  return (
    msg.includes("timeout") ||
    msg.includes("connection") ||
    msg.includes("socket") ||
    msg.includes("pool") ||
    msg.includes("econnrefused") ||
    msg.includes("tls") ||
    msg.includes("ssl")
  );
}

// ── Password helpers ──────────────────────────────────────────────────────────
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derivedKey}`;
}

// ── Connection string resolution ──────────────────────────────────────────────
function resolveConnectionString(): string {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }
  // Fallback for local dev without .env
  const user = process.env.PGUSER || "postgres";
  const pass = process.env.PGPASSWORD || "";
  const host = process.env.PGHOST || "localhost";
  const port = process.env.PGPORT || "5432";
  const db   = process.env.PGDATABASE || "smart-feedback-hub";
  return `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(pass)}@${host}:${port}/${encodeURIComponent(db)}`;
}

// ── Module-scope Pool (created once, reused across Vercel function warm starts) ─
const pool = new Pool({
  connectionString: resolveConnectionString(),
  // Required for Neon TLS over serverless/Vercel — avoids raw-text server crashes
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
});

pool.on("error", (err) => {
  console.error("[DB] Idle pool client error:", err.message);
});

// ── Drizzle ORM instance ──────────────────────────────────────────────────────
const dbInstance = drizzle(pool, { schema });

// ── Auto-migration: create tables + seed super-admin if absent ────────────────
let migrationPromise: Promise<void> | null = null;

async function runAutoMigrations(): Promise<void> {
  console.log("[DB] Running pre-flight table verification...");
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

    // Seed Super Admin if not present
    const adminCheck = await pool.query(
      `SELECT id FROM admins WHERE username = $1`,
      ["Devil"]
    );
    if (adminCheck.rows.length === 0) {
      console.log("[DB] Seeding Super Admin 'Devil'...");
      await pool.query(
        `INSERT INTO admins (username, password_hash, role) VALUES ($1, $2, $3)`,
        ["Devil", hashPassword("Devil@2231"), "superadmin"]
      );
    }
    console.log("[DB] Pre-flight verification complete.");
  } catch (error) {
    console.error("[DB] Migration script failed:", error);
    throw error;
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

/** Ensure migrations have completed before the first query. */
export async function ensureDbReady(): Promise<void> {
  if (!migrationPromise) {
    migrationPromise = runAutoMigrations();
  }
  await migrationPromise;
}

/** Lazy-initialising Drizzle proxy — safe to import anywhere. */
export const db = new Proxy({} as typeof dbInstance, {
  get(_target, prop) {
    const value = dbInstance[prop as keyof typeof dbInstance];
    return typeof value === "function" ? (value as Function).bind(dbInstance) : value;
  },
});

/** Run a callback inside a Drizzle transaction with safe fallback. */
export async function withTransaction<T>(cb: (tx: any) => Promise<T>): Promise<T> {
  if (migrationPromise) await migrationPromise;
  if ((dbInstance as any).transaction) {
    return await (dbInstance as any).transaction(cb);
  }
  return await cb(dbInstance);
}

/** Expose the raw pg Pool for diagnostics (e.g. connection-check endpoint). */
export { pool as rawPool };

export { schema };
