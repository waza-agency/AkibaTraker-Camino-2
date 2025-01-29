import { Express } from "express";
import { createServer, type Server } from "http";
import { db } from "@db";
import { generateVideo, generateAkibaImage } from "../client/src/lib/fal-api";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { setupAuth } from "./auth";
import emotionRouter from "./routes/emotion";
import cspRouter from "./routes/csp";
import chatRouter from "./routes/chat";
import musicRoutes from "./routes/music";
import audioRoutes from './routes/audio';
import { videosRouter } from "./routes/videos";

const MAX_GENERATION_TIME = 10 * 60 * 1000;

async function cleanupStalledVideos() {
  const staleTime = new Date(Date.now() - MAX_GENERATION_TIME);

  try {
    await db.query(
      `UPDATE videos 
       SET status = 'failed',
           metadata = jsonb_set(COALESCE(metadata, '{}'::jsonb), '{error}', '"Generation timeout exceeded"'),
           updated_at = NOW()
       WHERE status = 'pending' 
       AND created_at < $1`,
      [staleTime]
    );

    console.log("Cleaned up stalled videos older than:", staleTime);
  } catch (error) {
    console.error("Failed to cleanup stalled videos:", error);
  }
}

export function registerRoutes(app: Express): void {
  // Clean up stalled videos on startup
  cleanupStalledVideos();
  setInterval(cleanupStalledVideos, 5 * 60 * 1000);

  // Set up auth
  setupAuth(app);

  // Register all routes
  app.use("/api", emotionRouter);
  app.use("/api", chatRouter);
  app.use("/api/csp", cspRouter);
  app.use("/api/videos", videosRouter);
  app.use("/api/music", musicRoutes);
  app.use("/api/audio", audioRoutes);

  // Add generate-image endpoint
  app.post("/api/generate-image", async (req, res) => {
    try {
      const { prompt } = req.body;
      
      if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
      }

      const imageUrl = await generateAkibaImage(prompt, process.env.FAL_API_KEY!);
      res.json({ imageUrl });
    } catch (error) {
      console.error("Error generating image:", error);
      res.status(500).json({ 
        error: "Failed to generate image",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
}