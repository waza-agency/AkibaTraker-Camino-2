import { Router } from "express";
import { db } from "@db";

const router = Router();

router.get("/", async (_req, res) => {
  try {
    // Get songs from music_library table
    const result = await db.query(`
      SELECT 
        id,
        title,
        artist,
        mood,
        storage_url as "storageUrl"
      FROM music_library
      ORDER BY created_at DESC
    `);

    console.log('Fetched songs from DB:', result.rows);
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching music library:", error);
    res.status(500).json({ error: "Failed to fetch music library" });
  }
});

export default router; 