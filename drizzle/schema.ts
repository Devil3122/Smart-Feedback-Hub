import { pgTable, serial, text, timestamp, varchar, jsonb, integer, boolean } from "drizzle-orm/pg-core";

export const notes = pgTable("notes", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const feedbacks = pgTable("feedbacks", {
  id: serial("id").primaryKey(),
  fullName: text("full_name").notNull(),
  contact: text("contact").notNull(),
  studentId: text("student_id"),
  textContent: text("text_content").notNull(),
  audioUrl: text("audio_url"),
  category: varchar("category", { length: 50 }).notNull(), // Appreciation, Suggestion, Complaint, Urgent Issue
  sentiment: varchar("sentiment", { length: 50 }).notNull(), // Positive, Neutral, Negative
  priority: varchar("priority", { length: 50 }).notNull(), // Low, Medium, High
  topics: jsonb("topics").$type<string[]>().notNull(),
  campaignId: integer("campaign_id"),
  userId: integer("user_id"),
  formId: integer("form_id"),
  rating: integer("rating"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

export const admins = pgTable("admins", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: varchar("role", { length: 50 }).notNull().default("admin"), // superadmin, admin
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const campaigns = pgTable("campaigns", {
  id: serial("id").primaryKey(),
  campaignName: text("campaign_name").notNull(),
  qrCodeUrl: text("qr_code_url").notNull(),
  folderPath: text("folder_path").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  plainPassword: text("plain_password"), // strictly for superadmin demo vault
  status: varchar("status", { length: 50 }).notNull().default("Active"), // Active, Deletion Pending, Deleted, Password Reset Pending
  isVerified: boolean("is_verified").notNull().default(false),
  isResetApproved: boolean("is_reset_approved").notNull().default(false),
  otpCode: text("otp_code"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const feedbackHistory = pgTable("feedback_history", {
  id: serial("id").primaryKey(),
  originalFeedbackId: integer("original_feedback_id").notNull(),
  previousText: text("previous_text").notNull(),
  previousAudioUrl: text("previous_audio_url"),
  proposedText: text("proposed_text"),
  proposedRating: integer("proposed_rating"),
  reviewStatus: varchar("review_status", { length: 50 }).notNull().default("Pending"), // Pending, Reverted, Accepted, Both Saved
  modifiedAt: timestamp("modified_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const forms = pgTable("forms", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  fields: jsonb("fields").$type<any>().notNull(),
  isGlobalPush: boolean("is_global_push").notNull().default(false),
  qrCodeUrl: text("qr_code_url"),
  folderPath: text("folder_path"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  publishedAt: timestamp("published_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});
