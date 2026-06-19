import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../drizzle/schema";
import { hashPassword } from "../server/db";
import { eq } from "drizzle-orm";
import "dotenv/config";

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("No DATABASE_URL found in environment variables. Check Vercel or .env");
    process.exit(1);
  }

  const sql = neon(process.env.DATABASE_URL);
  const db = drizzle(sql, { schema });

  const adminUser = "Devil";
  const adminPass = "Devil@2231";
  
  console.log(`[Seed Script] Seeding Super Admin: ${adminUser}`);
  
  try {
    const existing = await db.select().from(schema.admins).where(eq(schema.admins.username, adminUser));
    if (existing.length > 0) {
      console.log("[Seed Script] Super Admin already exists. Updating password hash to ensure freshness...");
      await db.update(schema.admins)
        .set({ passwordHash: hashPassword(adminPass) })
        .where(eq(schema.admins.username, adminUser));
      console.log("[Seed Script] Updated existing Super Admin.");
    } else {
      console.log("[Seed Script] Super Admin not found in DB. Inserting...");
      await db.insert(schema.admins).values({
        username: adminUser,
        passwordHash: hashPassword(adminPass),
        role: "superadmin"
      });
      console.log("[Seed Script] Inserted Super Admin successfully.");
    }
    console.log("[Seed Script] Seeding complete.");
  } catch (err) {
    console.error("[Seed Script] Failed to seed admin. Check connection pooling or DB URL:", err);
  }
}

main();
