import "dotenv/config";
import { get } from '@vercel/edge-config';
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { submitFeedback, getDashboardStats, editFeedback, deleteFeedback, getUserFeedbacks, adminOverride } from "./routes/feedback";
import { loginAdmin, createAdmin, listAdmins, authenticateToken, requireAdmin } from "./routes/auth";
import { loginUser, registerUser, requestDeletion, getAllUsers, approveDeletion, rejectDeletion, sendOtp, verifyOtp, checkUsername, forgotPassword, approveReset, resetPassword } from "./routes/users";
import { getAuditLogs } from "./routes/audit";
import { createForm, listForms, generateFormQr } from "./routes/forms";
import { getCredentialsVault, verifyVault } from "./routes/superadmin";
import { createCampaign, listCampaigns } from "./routes/campaigns";
import { ensureDbReady, rawPool, isDbConnectionError } from "./db";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Ensure database tables are created and seeded before any request
  app.use(async (_req, _res, next) => {
    try {
      await ensureDbReady();
    } catch (err) {
      console.error("[DB] ensureDbReady failed:", err);
    }
    next();
  });

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  // Edge config welcome endpoint (Equivalent to Next.js middleware /welcome)
  app.get("/api/welcome", async (_req, res) => {
    try {
      const greeting = await get('greeting');
      res.json(greeting);
    } catch (e) {
      console.error("Failed to load Edge Config:", e);
      res.status(500).json({ error: "Edge Config unavailable" });
    }
  });

  app.get("/api/demo", handleDemo);

  // Admin & User Auth routes
  app.post("/api/auth/login", loginAdmin);
  app.post("/api/auth/register", authenticateToken, requireAdmin, createAdmin);
  app.get("/api/auth/admins", authenticateToken, requireAdmin, listAdmins);

  // Diagnostic: credential-validation pipeline connection check
  // Uses the module-scope rawPool — validates Neon DB connection + admins schema.
  app.get("/api/auth/connection-check", async (_req, res) => {
    try {
      await rawPool.query("SELECT 1 FROM admins LIMIT 1");
      res.json({
        success: true,
        status: "connected",
        pipeline: "credential-validation",
        dbReachable: true,
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      if (isDbConnectionError(err)) {
        res.status(503).json({
          success: false,
          error: "DATABASE_CONNECTIVITY_ERROR",
          details: err.message,
          pipeline: "credential-validation",
          dbReachable: false,
          timestamp: new Date().toISOString(),
        });
        return;
      }
      res.status(503).json({
        success: false,
        error: err?.message || "Unknown error",
        pipeline: "credential-validation",
        dbReachable: false,
        timestamp: new Date().toISOString(),
      });
    }
  });
  
  app.post("/api/users/login", loginUser);
  app.post("/api/users/register", registerUser);
  app.post("/api/users/check-username", checkUsername);
  app.post("/api/users/send-otp", sendOtp);
  app.post("/api/users/verify-otp", verifyOtp);
  app.post("/api/users/forgot-password", forgotPassword);
  app.post("/api/users/reset-password", resetPassword);
  app.post("/api/users/request-deletion", requestDeletion);
  app.get("/api/users", authenticateToken, requireAdmin, getAllUsers);
  app.post("/api/users/:id/approve-deletion", authenticateToken, requireAdmin, approveDeletion);
  app.post("/api/users/:id/reject-deletion", authenticateToken, requireAdmin, rejectDeletion);
  app.post("/api/users/:id/approve-reset", authenticateToken, requireAdmin, approveReset);

  // Campaigns routes
  app.post("/api/campaigns", authenticateToken, requireAdmin, createCampaign);
  app.get("/api/campaigns", authenticateToken, requireAdmin, listCampaigns);

  // Forms routes
  app.post("/api/forms", authenticateToken, requireAdmin, createForm);
  app.get("/api/forms", listForms);
  app.post("/api/forms/:id/generate-qr", authenticateToken, requireAdmin, generateFormQr);

  // Feedback API routes
  app.post("/api/feedback", submitFeedback);
  app.get("/api/feedback/stats", getDashboardStats);
  app.get("/api/feedback/user/:userId", getUserFeedbacks);
  app.put("/api/feedback/:id", editFeedback);
  app.delete("/api/feedback/:id", deleteFeedback);
  app.post("/api/feedback/override", authenticateToken, requireAdmin, adminOverride);

  // Audit
  app.get("/api/audit", authenticateToken, requireAdmin, getAuditLogs);

  // Superadmin Vault
  app.get("/api/superadmin/vault", authenticateToken, requireAdmin, getCredentialsVault);
  app.post("/api/superadmin/verify-vault", authenticateToken, requireAdmin, verifyVault);

  return app;
}
