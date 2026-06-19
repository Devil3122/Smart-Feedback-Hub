import { RequestHandler, Request, Response, NextFunction } from "express";
import { db } from "../db";
import { admins } from "../../drizzle/schema";
import { scryptSync } from "crypto";
import { hashPassword } from "../db";

function verifyPassword(password: string, hash: string): boolean {
  const [salt, key] = hash.split(":");
  if (!salt || !key) return false;
  const derivedKey = scryptSync(password, salt, 64).toString("hex");
  return key === derivedKey;
}

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (token == null) return res.sendStatus(401);

  try {
    const userPayload = JSON.parse(Buffer.from(token, 'base64').toString('utf8'));
    (req as any).user = userPayload;
    next();
  } catch (err) {
    return res.sendStatus(403);
  }
};

export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;
  if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
};

export const loginAdmin: RequestHandler = async (req, res) => {
  try {
    const { username, password } = req.body;
    const envAdminUsername = (process.env.SUPERADMIN_USERNAME || "Devil").trim();
    const envAdminPasswordRaw = process.env.SUPERADMIN_PASSWORD_RAW?.trim();

    console.log(`[Admin Login Trace] Attempting login for username: ${username}`);

    let user: any = null;

    // First attempt authentication using stateless environment variables
    if (username === envAdminUsername && envAdminPasswordRaw && password === envAdminPasswordRaw) {
      console.log(`[Admin Login Trace] Env password verification SUCCESS`);
      user = { id: 1, username: envAdminUsername, role: "superadmin" };
    } else if (envAdminPasswordRaw && username === envAdminUsername) {
      console.log(`[Admin Login Trace] Env password verification FAILED`);
    }

    // Fall back to database query if not matched by env variables
    if (!user) {
      console.log(`[Admin Login Trace] Falling back to database query`);
      let allAdmins;
      try {
        allAdmins = await db.select().from(admins);
        console.log(`[Admin Login Trace] DB returned ${allAdmins.length} admin rows`);

        // Auto-Seeding Database Middleware for Serverless Execution
        if (allAdmins.length === 0) {
          console.log(`[Admin Login Trace] 0 admins found. Auto-seeding 'Devil' via serverless execution.`);
          const inserted = await db.insert(admins).values({
            username: "Devil",
            passwordHash: hashPassword("Devil@2231"),
            role: "superadmin"
          }).returning();
          allAdmins = inserted;
        }
      } catch (dbError) {
        console.error(`[Admin Login Trace] DB query failed! Possible connection timeout:`, dbError);
        return res.status(503).json({ error: "Database connectivity issue" });
      }

      const dbUser = allAdmins.find((u: any) => u.username === username);
      if (dbUser) {
        console.log(`[Admin Login Trace] User found in DB. Verifying password...`);
        try {
          if (verifyPassword(password, dbUser.passwordHash)) {
            console.log(`[Admin Login Trace] DB password verification SUCCESS`);
            user = { id: dbUser.id, username: dbUser.username, role: dbUser.role };
          } else {
            console.log(`[Admin Login Trace] DB password verification FAILED`);
          }
        } catch (e) {
          console.error(`[Admin Login Trace] Error verifying DB password:`, e);
        }
      } else {
        console.log(`[Admin Login Trace] User NOT found in DB`);
      }
    }

    if (!user) {
      console.log(`[Admin Login Trace] Final result: Invalid credentials`);
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Simple stateless token
    const token = Buffer.from(JSON.stringify({ id: user.id, username: user.username, role: user.role })).toString('base64');
    
    res.json({
      token,
      admin: { id: user.id, username: user.username, role: user.role }
    });
  } catch (error) {
    res.status(500).json({ error: "Login failed" });
  }
};

export const createAdmin: RequestHandler = async (req, res) => {
  try {
    const user = (req as any).user;
    if (!user || user.role !== 'superadmin') {
      return res.status(403).json({ error: "Only Super Admins can create new admin accounts" });
    }

    const { username, password } = req.body;
    
    const allAdmins = await db.select().from(admins);
    if (allAdmins.find((u: any) => u.username === username)) {
      return res.status(400).json({ error: "Username already exists" });
    }

    const [inserted] = await db.insert(admins).values({
      username,
      passwordHash: hashPassword(password),
      role: 'admin'
    }).returning();

    res.json({
      id: inserted.id,
      username: inserted.username,
      role: inserted.role
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to create admin" });
  }
};

export const listAdmins: RequestHandler = async (req, res) => {
  try {
    const allAdmins = await db.select().from(admins);
    res.json(allAdmins.map((u: any) => ({
      id: u.id,
      username: u.username,
      role: u.role,
      createdAt: u.createdAt
    })));
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch admins" });
  }
};
