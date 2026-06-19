import { z } from "zod";

export const loginAuthSchema = z.object({
  username: z.string().trim().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = loginAuthSchema.extend({
  email: z.string().trim().email("Invalid email format"),
  skipVerification: z.boolean().optional(),
});

export const feedbackSubmitSchema = z.object({
  fullName: z.string().trim().optional(),
  contact: z.string().trim().optional(),
  studentId: z.string().trim().optional(),
  textContent: z.string().trim().optional(),
  audioUrl: z.string().trim().url().or(z.string().regex(/\.mp3$/i)).optional().or(z.literal('')),
  campaignId: z.number().int().optional(),
  userId: z.number().int().optional(),
  formId: z.number().int().optional(),
  rating: z.number().int().min(1).max(5).optional().nullable(),
});

export const editFeedbackSchema = z.object({
  textContent: z.string().trim().min(1, "Text cannot be empty"),
  rating: z.number().int().min(1).max(5).optional().nullable(),
  userId: z.number().int(),
});
