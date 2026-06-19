import { RequestHandler } from "express";
import { db } from "../db";
import { campaigns } from "../../drizzle/schema";

export const createCampaign: RequestHandler = async (req, res) => {
  try {
    const { campaignName } = req.body;
    
    // We insert first to get an ID (since it's serial/auto-increment)
    // But since Drizzle returning gives the whole record, let's just insert with a placeholder folder
    const [inserted] = await db.insert(campaigns).values({
      campaignName,
      qrCodeUrl: "",
      folderPath: ""
    }).returning();

    // Now update with actual QR code based on ID
    const host = req.headers.host || "localhost:8080";
    const protocol = req.headers['x-forwarded-proto'] || "http";
    const appUrl = `${protocol}://${host}`;
    
    const qrData = encodeURIComponent(`${appUrl}/?campaign=${inserted.id}`);
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${qrData}`;
    const cloudBucketUrl = process.env.VERCEL_BLOB_READ_WRITE_TOKEN
      ? `https://smart-feedback-hub.vercel-storage.com`
      : `https://smart-feedback-hub.s3.amazonaws.com`;
    const folderPath = `${cloudBucketUrl}/campaigns/camp_${inserted.id}`;

    // Update the memory reference
    inserted.qrCodeUrl = qrCodeUrl;
    inserted.folderPath = folderPath;

    // Update database if using Postgres
    if (process.env.DATABASE_URL) {
      const { eq } = await import("drizzle-orm");
      await db.update(campaigns).set({ qrCodeUrl, folderPath }).where(eq(campaigns.id, inserted.id));
    }
    
    res.json(inserted);
  } catch (error) {
    console.error("Error creating campaign:", error);
    res.status(500).json({ error: "Failed to create campaign" });
  }
};

export const listCampaigns: RequestHandler = async (req, res) => {
  try {
    const allCampaigns = await db.select().from(campaigns);
    res.json(allCampaigns);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch campaigns" });
  }
};
