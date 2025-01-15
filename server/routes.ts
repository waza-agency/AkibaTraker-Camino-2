import type { Express } from "express";
import { createServer, type Server } from "http";
import { db } from "@db";
import { videos } from "@db/schema";
import { eq } from "drizzle-orm";
import { generateVideo } from "../client/src/lib/fal-api";

// Temporary music library - to be replaced with actual tracks
const MUSIC_LIBRARY = ["track1.mp3", "track2.mp3", "track3.mp3"];

function getRandomMusic(): string {
  const randomIndex = Math.floor(Math.random() * MUSIC_LIBRARY.length);
  return MUSIC_LIBRARY[randomIndex];
}

export function registerRoutes(app: Express): Server {
  const httpServer = createServer(app);

  // Create new video generation
  app.post("/api/videos", async (req, res) => {
    const { prompt } = req.body;
    const musicFile = getRandomMusic();

    try {
      // First create a pending video entry
      const [video] = await db.insert(videos)
        .values({
          prompt,
          musicFile,
          status: "pending",
          metadata: {}
        })
        .returning();

      // Simulate video generation in the background
      generateVideo(prompt)
        .then(async (outputUrl) => {
          await db
            .update(videos)
            .set({
              outputUrl,
              status: "completed",
              updatedAt: new Date()
            })
            .where(eq(videos.id, video.id));
        })
        .catch(async () => {
          await db
            .update(videos)
            .set({
              status: "failed",
              updatedAt: new Date()
            })
            .where(eq(videos.id, video.id));
        });

      res.json(video);
    } catch (error) {
      res.status(500).json({ error: "Failed to create video" });
    }
  });

  // Get video status
  app.get("/api/videos/:id", async (req, res) => {
    const { id } = req.params;

    try {
      const video = await db.query.videos.findFirst({
        where: eq(videos.id, parseInt(id))
      });

      if (!video) {
        return res.status(404).json({ error: "Video not found" });
      }

      res.json(video);
    } catch (error) {
      res.status(500).json({ error: "Failed to get video" });
    }
  });

  // Get all videos
  app.get("/api/videos", async (_req, res) => {
    try {
      const allVideos = await db.query.videos.findMany({
        orderBy: (videos, { desc }) => [desc(videos.createdAt)]
      });
      res.json(allVideos);
    } catch (error) {
      res.status(500).json({ error: "Failed to get videos" });
    }
  });

  return httpServer;
}