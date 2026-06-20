import { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import jwksClient from "jwks-rsa";
import { db, hashPassword, withTransaction, isDbConnectionError } from "../db";
import { users } from "../../drizzle/schema";
import { scryptSync } from "crypto";
import { loginAuthSchema, registerSchema } from "../validation";
import { eq, and } from "drizzle-orm";

function verifyPassword(password: string, hash: string): boolean {
  const [salt, key] = hash.split(":");
  if (!salt || !key) return false;
  const derivedKey = scryptSync(password, salt, 64).toString("hex");
  return key === derivedKey;
}

export const checkUsername: RequestHandler = async (req, res) => {
  try {
    const { username } = req.body;
    const allUsers = await db.select().from(users).where(eq(users.username, username));
    res.json({ available: allUsers.length === 0 });
  } catch (error) {
    if (isDbConnectionError(error)) {
      return res.status(503).json({ success: false, error: "DATABASE_CONNECTIVITY_ERROR", details: "Database connectivity issue" });
    }
    res.status(500).json({ error: "Failed to check username" });
  }
};

export const registerUser: RequestHandler = async (req, res) => {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid input data", details: parsed.error.format() });
    }
    const { username, email, password, skipVerification } = parsed.data;
    
    const existingUser = await db.select().from(users);
    if (existingUser.find((u: any) => u.username === username || u.email === email)) {
      return res.status(400).json({ error: "Username or email already exists" });
    }

    const [inserted] = await db.insert(users).values({
      username,
      email,
      passwordHash: hashPassword(password),
      plainPassword: password,
      isVerified: !skipVerification,
      status: "Active"
    }).returning();

    const token = jwt.sign({ id: inserted.id, username: inserted.username }, process.env.JWT_SECRET || 'super-secret-key', { expiresIn: '7d' });

    res.json({
      token,
      user: {
        id: inserted.id,
        username: inserted.username,
        email: inserted.email,
        status: inserted.status,
        createdAt: inserted.createdAt,
        updatedAt: inserted.updatedAt
      }
    });
  } catch (error) {
    if (isDbConnectionError(error)) {
      return res.status(503).json({ success: false, error: "DATABASE_CONNECTIVITY_ERROR", details: "Database connectivity issue" });
    }
    res.status(500).json({ error: "Failed to register user" });
  }
};

export const loginUser: RequestHandler = async (req, res) => {
  try {
    const parsed = loginAuthSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid input data", details: parsed.error.format() });
    }
    const { username, password } = parsed.data;
    const allUsers = await db.select().from(users);
    const user = allUsers.find((u: any) => u.username === username || u.email === username);

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    if (!verifyPassword(password, user.passwordHash)) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    if (user.status === "Deleted") {
      return res.status(403).json({ error: "Account has been deleted" });
    }

    const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET || 'super-secret-key', { expiresIn: '7d' });
    
    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        status: user.status,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    if (isDbConnectionError(error)) {
      return res.status(503).json({ success: false, error: "DATABASE_CONNECTIVITY_ERROR", details: "Database connectivity issue" });
    }
    res.status(500).json({ error: "Login failed" });
  }
};

export const requestDeletion: RequestHandler = async (req, res) => {
  try {
    const { userId } = req.body;
    
    const [updated] = await db.update(users)
      .set({ status: "Deletion Pending", updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    
    if (!updated) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ message: "Deletion request submitted successfully", status: updated.status });
  } catch (error) {
    res.status(500).json({ error: "Failed to request deletion" });
  }
};

export const getAllUsers: RequestHandler = async (req, res) => {
  try {
    const allUsers = await db.select().from(users);
    res.json(allUsers.map((u: any) => ({
      id: u.id,
      username: u.username,
      email: u.email,
      status: u.status,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt
    })));
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
};

export const approveDeletion: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const [updated] = await db.update(users)
      .set({ status: "Deleted", updatedAt: new Date() })
      .where(eq(users.id, parseInt(id)))
      .returning();

    if (!updated) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ message: "User account deleted successfully", status: updated.status });
  } catch (error) {
    res.status(500).json({ error: "Failed to approve deletion" });
  }
};

export const rejectDeletion: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const [updated] = await db.update(users)
      .set({ status: "Active", updatedAt: new Date() })
      .where(eq(users.id, parseInt(id)))
      .returning();

    if (!updated) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ message: "User account deletion rejected", status: updated.status });
  } catch (error) {
    res.status(500).json({ error: "Failed to reject deletion" });
  }
};

export const sendOtp: RequestHandler = async (req, res) => {
  try {
    const { userId } = req.body;
    const allUsers = await db.select().from(users).where(eq(users.id, parseInt(userId)));
    const user = allUsers[0];

    if (!user) return res.status(404).json({ error: "User not found" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await db.update(users).set({ otpCode: otp }).where(eq(users.id, user.id));
    
    console.log(`[SIMULATION] Sending OTP ${otp} to email ${user.email}`);

    res.json({ message: "OTP sent successfully", simulatedOtp: otp });
  } catch (error) {
    res.status(500).json({ error: "Failed to send OTP" });
  }
};

export const verifyOtp: RequestHandler = async (req, res) => {
  try {
    const { userId, otp } = req.body;
    const allUsers = await db.select().from(users).where(eq(users.id, parseInt(userId)));
    const user = allUsers[0];

    if (!user) return res.status(404).json({ error: "User not found" });

    if (user.otpCode === otp) {
      const [updated] = await db.update(users)
        .set({ isVerified: true, otpCode: null, updatedAt: new Date() })
        .where(eq(users.id, user.id))
        .returning();
      return res.json({ message: "Account verified successfully", user: {
        id: updated.id, username: updated.username, email: updated.email, status: updated.status, isVerified: updated.isVerified
      }});
    }

    res.status(400).json({ error: "Invalid OTP" });
  } catch (error) {
    res.status(500).json({ error: "Failed to verify OTP" });
  }
};

export const forgotPassword: RequestHandler = async (req, res) => {
  try {
    await withTransaction(async (tx) => {
      const { username } = req.body;
      const allUsers = await tx.select().from(users).where(eq(users.username, username));
      const user = allUsers[0];

      if (!user) return res.status(404).json({ error: "User not found" });

      await tx.update(users)
        .set({ status: "Password Reset Pending", isResetApproved: false, updatedAt: new Date() })
        .where(eq(users.id, user.id));
      
      res.json({ message: "Password reset request submitted. Awaiting admin approval." });
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to process forgot password" });
  }
};

export const approveReset: RequestHandler = async (req, res) => {
  try {
    await withTransaction(async (tx) => {
      const { id } = req.params;
      const [updated] = await tx.update(users)
        .set({ isResetApproved: true, updatedAt: new Date() })
        .where(eq(users.id, parseInt(id)))
        .returning();

      if (!updated) return res.status(404).json({ error: "User not found" });

      res.json({ message: "Password reset approved", status: updated.status });
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to approve password reset" });
  }
};

export const resetPassword: RequestHandler = async (req, res) => {
  try {
    await withTransaction(async (tx) => {
      const { username, newPassword } = req.body;
      const allUsers = await tx.select().from(users).where(eq(users.username, username));
      const user = allUsers[0];

      if (!user) return res.status(404).json({ error: "User not found" });
      if (!user.isResetApproved || user.status !== "Password Reset Pending") {
        return res.status(403).json({ error: "Password reset not approved yet" });
      }

      await tx.update(users)
        .set({
          passwordHash: hashPassword(newPassword),
          plainPassword: newPassword,
          isResetApproved: false,
          status: "Active",
          updatedAt: new Date()
        })
        .where(eq(users.id, user.id));

      res.json({ message: "Password reset successful" });
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to reset password" });
  }
};

export const oauthVercelRedirect: RequestHandler = (req, res) => {
  const neonAuthBaseUrl = process.env.NEON_AUTH_BASE_URL || "https://ep-dark-tooth-aokp2c7r.neonauth.c-2.ap-southeast-1.aws.neon.tech/neondb/auth";
  // Redirect to Neon Auth server gateway route
  const loginUrl = `${neonAuthBaseUrl}/v1/providers/vercel/login?redirect_uri=${encodeURIComponent(req.protocol + '://' + req.get('host') + '/oauth/callback')}`;
  res.redirect(loginUrl);
};

export const oauthVercelCallback: RequestHandler = async (req, res) => {
  try {
    const { token, code } = req.method === "POST" ? req.body : req.query;
    
    if (!token) {
      return res.status(400).json({ error: "Missing authentication token" });
    }

    // Verify token with Neon Auth JWKS
    const client = jwksClient({
      jwksUri: process.env.NEON_AUTH_JWKS_URL || "https://ep-dark-tooth-aokp2c7r.neonauth.c-2.ap-southeast-1.aws.neon.tech/neondb/auth/.well-known/jwks.json"
    });

    const getKey = (header: jwt.JwtHeader, callback: jwt.SigningKeyCallback) => {
      client.getSigningKey(header.kid, (err, key) => {
        if (err) return callback(err);
        const signingKey = key?.getPublicKey();
        callback(null, signingKey);
      });
    };

    const decodedToken = await new Promise<any>((resolve, reject) => {
      jwt.verify(token as string, getKey, {}, (err, decoded) => {
        if (err) reject(err);
        else resolve(decoded);
      });
    });

    let decodedEmail = decodedToken.email;
    let decodedUsername = decodedToken.preferred_username || decodedToken.name || decodedToken.nickname || "vercel_user_" + Math.floor(Math.random() * 10000);

    const allUsers = await db.select().from(users);
    let user = allUsers.find((u: any) => u.email === decodedEmail);
    
    if (!user) {
      // Map the user's Vercel email and username into PostgreSQL profile tables
      const [inserted] = await db.insert(users).values({
        username: decodedUsername,
        email: decodedEmail,
        passwordHash: "OAUTH_VERCEL_USER_NO_PASSWORD",
        plainPassword: "",
        isVerified: true,
        status: "Active"
      }).returning();
      user = inserted;
    }
    
    const authToken = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET || 'super-secret-key', { expiresIn: '7d' });
    
    res.json({
      token: authToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        status: user.status,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    if (isDbConnectionError(error)) {
      return res.status(503).json({ success: false, error: "DATABASE_CONNECTIVITY_ERROR", details: "Database connectivity issue" });
    }
    res.status(500).json({ error: "Failed to map OAuth profile" });
  }
};
