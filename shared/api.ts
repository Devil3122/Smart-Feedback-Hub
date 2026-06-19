/**
 * Shared code between client and server
 * Useful to share types between client and server
 * and/or small pure JS functions that can be used on both client and server
 */

/**
 * Example response type for /api/demo
 */
export interface DemoResponse {
  message: string;
}

export interface FeedbackRequest {
  fullName: string;
  contact: string;
  studentId?: string;
  textContent: string;
  audioUrl?: string; // base64 or object URL for the demo
  campaignId?: number;
  userId?: number;
  formId?: number;
  rating?: number;
}

export interface FeedbackResponse {
  id: number;
  category: "Appreciation" | "Suggestion" | "Complaint" | "Urgent Issue";
  sentiment: "Positive" | "Neutral" | "Negative";
  priority: "Low" | "Medium" | "High";
  topics: string[];
  message: string;
}

export interface FeedbackRecord extends FeedbackRequest {
  id: number;
  category: "Appreciation" | "Suggestion" | "Complaint" | "Urgent Issue";
  sentiment: "Positive" | "Neutral" | "Negative";
  priority: "Low" | "Medium" | "High";
  topics: string[];
  createdAt: string;
  updatedAt?: string;
  deletedAt?: string;
  campaignId?: number;
  userId?: number;
  formId?: number;
  rating?: number;
}

export interface DashboardStats {
  totalFeedbacks: number;
  categories: {
    appreciation: number;
    suggestion: number;
    complaint: number;
    urgentIssue: number;
  };
  sentiment: {
    positive: number;
    neutral: number;
    negative: number;
  };
  trend: { date: string; count: number }[];
  recentFeedbacks: FeedbackRecord[];
  averageRating?: number;
}

export interface Admin {
  id: number;
  username: string;
  role: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  status: "Active" | "Deletion Pending" | "Deleted" | "Password Reset Pending";
  isVerified: boolean;
  plainPassword?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FeedbackHistory {
  id: number;
  originalFeedbackId: number;
  previousText: string;
  previousAudioUrl?: string;
  proposedText?: string;
  proposedRating?: number;
  reviewStatus: string;
  modifiedAt: string;
  currentText?: string;
  currentAudioUrl?: string;
  isDeleted?: boolean;
}

export interface Campaign {
  id: number;
  campaignName: string;
  qrCodeUrl: string;
  folderPath: string;
}

export interface Form {
  id: number;
  title: string;
  description: string;
  fields: any; // JSON
  isGlobalPush: boolean;
  qrCodeUrl?: string;
  folderPath?: string;
  createdAt: string;
  publishedAt: string;
  averageRating?: number | null;
}

export interface AuthResponse {
  token: string;
  admin: Admin;
}

export interface UserAuthResponse {
  token: string;
  user: User;
}
