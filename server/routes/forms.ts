import { RequestHandler } from "express";
import { db, withTransaction } from "../db";
import { forms, campaigns, feedbacks } from "../../drizzle/schema";
import { eq, and, isNotNull, isNull, sql } from "drizzle-orm";

export const createForm: RequestHandler = async (req, res) => {
  try {
    await withTransaction(async (tx) => {
      const { title, description, fields, isGlobalPush, generateQr } = req.body;
      
      const mockFolderId = Math.random().toString(36).substring(7);
      const mockQrCodeUrl = generateQr ? `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=form-${mockFolderId}` : null;
      const cloudBucketUrl = process.env.VERCEL_BLOB_READ_WRITE_TOKEN
        ? `https://smart-feedback-hub.vercel-storage.com`
        : `https://smart-feedback-hub.s3.amazonaws.com`;
      const mockFolderPath = generateQr ? `${cloudBucketUrl}/forms/${mockFolderId}` : null;

      const newFormArray = await tx.insert(forms).values({
        title,
        description: description || "",
        fields: fields || [],
        isGlobalPush: isGlobalPush || false,
        qrCodeUrl: mockQrCodeUrl,
        folderPath: mockFolderPath,
        publishedAt: new Date()
      }).returning();

      // Also create a linked campaign
      await tx.insert(campaigns).values({
        campaignName: `Form Campaign: ${title}`,
        qrCodeUrl: mockQrCodeUrl,
        folderPath: mockFolderPath,
      });
      
      res.json(newFormArray[0]);
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to create form" });
  }
};

export const listForms: RequestHandler = async (req, res) => {
  try {
    const allForms = await db.select().from(forms);
    
    // Calculate average rating for each form
    const formsWithRatings = await Promise.all(allForms.map(async (form: any) => {
      let avgRating: number | null = null;
      
      // PostgreSQL query (Neon neon-http or in-memory fallback)
      if (process.env.DATABASE_URL) {
        // Real PostgreSQL query using Drizzle
        const ratingResult = await db.select({
          avgRating: sql<number>`avg(${feedbacks.rating})`
        })
        .from(feedbacks)
        .where(
          and(
            eq(feedbacks.formId, form.id),
            isNotNull(feedbacks.rating),
            isNull(feedbacks.deletedAt)
          )
        );
        if (ratingResult && ratingResult.length > 0 && ratingResult[0].avgRating !== null) {
          avgRating = parseFloat(Number(ratingResult[0].avgRating).toFixed(1));
        }
      } else {
        // Fallback for mock in-memory DB
        const fbs = await db.select().from(feedbacks);
        const formRatings = fbs.filter((fb: any) => fb.formId === form.id && fb.rating !== undefined && fb.rating !== null && !fb.deletedAt);
        if (formRatings.length > 0) {
          const sum = formRatings.reduce((acc: number, curr: any) => acc + curr.rating, 0);
          avgRating = parseFloat((sum / formRatings.length).toFixed(1));
        }
      }

      return {
        ...form,
        averageRating: avgRating
      };
    }));

    res.json(formsWithRatings);
  } catch (error) {
    console.error("Failed to fetch forms:", error);
    res.status(500).json({ error: "Failed to fetch forms" });
  }
};

export const generateFormQr: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const allForms = await db.select().from(forms);
    const form = allForms.find((f: any) => f.id === parseInt(id));

    if (!form) {
      return res.status(404).json({ error: "Form not found" });
    }

    const mockFolderId = Math.random().toString(36).substring(7);
    const appUrl = process.env.APP_URL || `${req.protocol}://${req.get("host")}`;
    const formUrl = `${appUrl}/feedback/entry?form=${form.id}`;
    const mockQrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(formUrl)}`;
    const cloudBucketUrl = process.env.VERCEL_BLOB_READ_WRITE_TOKEN
      ? `https://smart-feedback-hub.vercel-storage.com`
      : `https://smart-feedback-hub.s3.amazonaws.com`;
    const mockFolderPath = `${cloudBucketUrl}/forms/${mockFolderId}`;

    if (typeof db.update === "function") {
      try {
        await db.update(forms).set({ qrCodeUrl: mockQrCodeUrl, folderPath: mockFolderPath }).where(eq(forms.id, parseInt(id)));
      } catch (err) {
        console.warn("Drizzle update failed, falling back to direct mutation:", err);
      }
    }
    
    // Mutate the mock or active db object
    form.qrCodeUrl = mockQrCodeUrl;
    form.folderPath = mockFolderPath;

    // Create or update linked campaign
    const allCampaigns = await db.select().from(campaigns);
    const matchedCampaign = allCampaigns.find((c: any) => c.campaignName === `Form Campaign: ${form.title}`);
    if (matchedCampaign) {
      matchedCampaign.qrCodeUrl = mockQrCodeUrl;
      matchedCampaign.folderPath = mockFolderPath;
      if (typeof db.update === "function") {
        try {
          await db.update(campaigns).set({ qrCodeUrl: mockQrCodeUrl, folderPath: mockFolderPath }).where(eq(campaigns.id, matchedCampaign.id));
        } catch (err) {
          console.warn("Drizzle campaign update failed:", err);
        }
      }
    } else {
      await db.insert(campaigns).values({
        campaignName: `Form Campaign: ${form.title}`,
        qrCodeUrl: mockQrCodeUrl,
        folderPath: mockFolderPath,
      });
    }

    res.json({ message: "QR Code generated successfully", qrCodeUrl: mockQrCodeUrl, folderPath: mockFolderPath });
  } catch (error) {
    res.status(500).json({ error: "Failed to generate QR code" });
  }
};
