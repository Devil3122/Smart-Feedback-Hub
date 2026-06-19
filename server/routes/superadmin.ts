import { RequestHandler } from "express";
import { db } from "../db";
import { users, admins } from "../../drizzle/schema";
import { scryptSync } from "crypto";

function verifyPassword(password: string, hash: string): boolean {
  const [salt, key] = hash.split(":");
  if (!salt || !key) return false;
  const derivedKey = scryptSync(password, salt, 64).toString("hex");
  return key === derivedKey;
}

export const getCredentialsVault: RequestHandler = async (req, res) => {
  try {
    const adminUser = (req as any).user;
    if (!adminUser || adminUser.role !== "superadmin") {
      return res.status(403).json({ error: "Access denied" });
    }

    const allUsers = await db.select().from(users);
    
    // Explicitly return plain credentials just for this vault demo
    const vaultData = allUsers.map((u: any) => ({
      id: u.id,
      username: u.username,
      email: u.email,
      plainPassword: u.plainPassword,
      status: u.status
    }));

    res.json(vaultData);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch credentials vault" });
  }
};

export const verifyVault: RequestHandler = async (req, res) => {
  try {
    const { password } = req.body;
    const adminUser = (req as any).user;
    if (!adminUser || adminUser.role !== "superadmin") {
      return res.status(403).json({ error: "Access denied" });
    }

    const envAdminPasswordHash = process.env.ADMIN_PASSWORD_HASH;
    let isPasswordValid = false;

    if (envAdminPasswordHash && adminUser.username === (process.env.ADMIN_USERNAME || "Devil")) {
      isPasswordValid = verifyPassword(password, envAdminPasswordHash);
    } else {
      const allAdmins = await db.select().from(admins);
      const superadmin = allAdmins.find((a: any) => a.username === adminUser.username);
      if (superadmin) {
        isPasswordValid = verifyPassword(password, superadmin.passwordHash);
      }
    }

    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid password" });
    }

    res.json({ message: "Vault unlocked" });
  } catch (error) {
    res.status(500).json({ error: "Verification failed" });
  }
};
