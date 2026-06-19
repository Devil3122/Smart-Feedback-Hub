import { RequestHandler } from "express";
import { db, hashPassword, withTransaction } from "../db";
import { users } from "../../drizzle/schema";
import { scryptSync } from "crypto";

function verifyPassword(password: string, hash: string): boolean {
  const [salt, key] = hash.split(":");
  if (!salt || !key) return false;
  const derivedKey = scryptSync(password, salt, 64).toString("hex");
  return key === derivedKey;
}

export const checkUsername: RequestHandler = async (req, res) => {
  try {
    const { username } = req.body;
    const allUsers = await db.select().from(users);
    const exists = allUsers.some((u: any) => u.username === username);
    res.json({ available: !exists });
  } catch (error) {
    res.status(500).json({ error: "Failed to check username" });
  }
};

export const registerUser: RequestHandler = async (req, res) => {
  try {
    const { username, email, password, skipVerification } = req.body;
    
    const allUsers = await db.select().from(users);
    if (allUsers.find((u: any) => u.username === username || u.email === email)) {
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

    const token = Buffer.from(JSON.stringify({ id: inserted.id, username: inserted.username })).toString('base64');

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
    res.status(500).json({ error: "Failed to register user" });
  }
};

export const loginUser: RequestHandler = async (req, res) => {
  try {
    const { username, password } = req.body;
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

    const token = Buffer.from(JSON.stringify({ id: user.id, username: user.username })).toString('base64');
    
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
    res.status(500).json({ error: "Login failed" });
  }
};

export const requestDeletion: RequestHandler = async (req, res) => {
  try {
    const { userId } = req.body;
    
    // In our mock DB, we just update the in-memory object directly
    const allUsers = await db.select().from(users);
    const user = allUsers.find((u: any) => u.id === userId);
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    user.status = "Deletion Pending";
    user.updatedAt = new Date();

    res.json({ message: "Deletion request submitted successfully", status: user.status });
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
    const allUsers = await db.select().from(users);
    const user = allUsers.find((u: any) => u.id === parseInt(id));

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    user.status = "Deleted";
    user.updatedAt = new Date().toISOString();

    res.json({ message: "User account deleted successfully", status: user.status });
  } catch (error) {
    res.status(500).json({ error: "Failed to approve deletion" });
  }
};

export const rejectDeletion: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const allUsers = await db.select().from(users);
    const user = allUsers.find((u: any) => u.id === parseInt(id));

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    user.status = "Active";
    user.updatedAt = new Date().toISOString();

    res.json({ message: "User account deletion rejected", status: user.status });
  } catch (error) {
    res.status(500).json({ error: "Failed to reject deletion" });
  }
};

export const sendOtp: RequestHandler = async (req, res) => {
  try {
    const { userId } = req.body;
    const allUsers = await db.select().from(users);
    const user = allUsers.find((u: any) => u.id === parseInt(userId));

    if (!user) return res.status(404).json({ error: "User not found" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otpCode = otp;
    
    console.log(`[SIMULATION] Sending OTP ${otp} to email ${user.email}`);

    res.json({ message: "OTP sent successfully", simulatedOtp: otp });
  } catch (error) {
    res.status(500).json({ error: "Failed to send OTP" });
  }
};

export const verifyOtp: RequestHandler = async (req, res) => {
  try {
    const { userId, otp } = req.body;
    const allUsers = await db.select().from(users);
    const user = allUsers.find((u: any) => u.id === parseInt(userId));

    if (!user) return res.status(404).json({ error: "User not found" });

    if (user.otpCode === otp) {
      user.isVerified = true;
      user.otpCode = null;
      user.updatedAt = new Date().toISOString();
      return res.json({ message: "Account verified successfully", user: {
        id: user.id, username: user.username, email: user.email, status: user.status, isVerified: user.isVerified
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
      const allUsers = await tx.select().from(users);
      const user = allUsers.find((u: any) => u.username === username);

      if (!user) return res.status(404).json({ error: "User not found" });

      user.status = "Password Reset Pending";
      user.isResetApproved = false;
      user.updatedAt = new Date().toISOString();
      
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
      const allUsers = await tx.select().from(users);
      const user = allUsers.find((u: any) => u.id === parseInt(id));

      if (!user) return res.status(404).json({ error: "User not found" });

      user.isResetApproved = true;
      user.updatedAt = new Date().toISOString();

      res.json({ message: "Password reset approved", status: user.status });
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to approve password reset" });
  }
};

export const resetPassword: RequestHandler = async (req, res) => {
  try {
    await withTransaction(async (tx) => {
      const { username, newPassword } = req.body;
      const allUsers = await tx.select().from(users);
      const user = allUsers.find((u: any) => u.username === username);

      if (!user) return res.status(404).json({ error: "User not found" });
      if (!user.isResetApproved || user.status !== "Password Reset Pending") {
        return res.status(403).json({ error: "Password reset not approved yet" });
      }

      user.passwordHash = hashPassword(newPassword);
      user.plainPassword = newPassword;
      user.isResetApproved = false;
      user.status = "Active";
      user.updatedAt = new Date().toISOString();

      res.json({ message: "Password reset successful" });
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to reset password" });
  }
};
