import type { Express } from "express";
import { createServer, type Server } from "http";
import { db } from "@db";
import { videos } from "@db/schema";
import { eq } from "drizzle-orm";

export function registerRoutes(app: Express): Server {
  const httpServer = createServer(app);

  // Create new video generation
  app.post("/api/videos", async (req, res) => {
    const { prompt, musicFile } = req.body;
    
    try {
      const [video] = await db.insert(videos)
        .values({
          prompt,
          musicFile,
          status: "pending",
          metadata: {}
        })
        .returning();
      
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
