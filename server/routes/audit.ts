import { RequestHandler } from "express";
import { db } from "../db";
import { feedbacks, feedbackHistory } from "../../drizzle/schema";

export const getAuditLogs: RequestHandler = async (req, res) => {
  try {
    const allHistory = await db.select().from(feedbackHistory);
    const allFeedbacks = await db.select().from(feedbacks);

    const logs = allHistory.map((h: any) => {
      const currentFeedback = allFeedbacks.find((f: any) => f.id === h.originalFeedbackId);
      return {
        id: h.id,
        originalFeedbackId: h.originalFeedbackId,
        previousText: h.previousText,
        previousAudioUrl: h.previousAudioUrl,
        proposedText: h.proposedText,
        proposedRating: h.proposedRating,
        reviewStatus: h.reviewStatus,
        modifiedAt: h.modifiedAt,
        currentText: currentFeedback?.textContent,
        currentAudioUrl: currentFeedback?.audioUrl,
        isDeleted: !!currentFeedback?.deletedAt,
        currentRating: currentFeedback?.rating,
        formId: currentFeedback?.formId,
        userId: currentFeedback?.userId,
      };
    });

    res.json(logs.sort((a: any, b: any) => new Date(b.modifiedAt).getTime() - new Date(a.modifiedAt).getTime()));
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch audit logs" });
  }
};
