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
import { videosRouter, integrateAudio } from "./routes/videos";

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
    console.warn("Failed to cleanup stalled videos (database may be unavailable):", error);
    // Continue execution even if database is unavailable
  }
}

// Function to automatically process videos that are stuck in ready_for_audio state
async function processReadyForAudioVideos() {
  try {
    console.log("Checking for videos ready for audio integration...");
    const result = await db.query(
      `SELECT id FROM videos WHERE status = 'ready_for_audio'`
    );
    
    if (result.rows.length > 0) {
      console.log(`Found ${result.rows.length} videos ready for audio integration`);
      
      for (const video of result.rows) {
        try {
          console.log(`Automatically processing audio integration for video ${video.id}`);
          // We don't await this to allow parallel processing
          integrateAudio(video.id).catch(err => {
            console.error(`Error processing audio for video ${video.id}:`, err);
          });
        } catch (error) {
          console.error(`Failed to process audio for video ${video.id}:`, error);
        }
      }
    }
  } catch (error) {
    console.warn("Failed to process ready-for-audio videos:", error);
  }
}

export function registerRoutes(app: Express): void {
  try {
    // Clean up stalled videos on startup
    cleanupStalledVideos();
    setInterval(cleanupStalledVideos, 5 * 60 * 1000);
    
    // Process videos ready for audio integration
    processReadyForAudioVideos();
    setInterval(processReadyForAudioVideos, 1 * 60 * 1000); // Check every minute
  } catch (error) {
    console.warn("Could not set up video cleanup (database may be unavailable):", error);
    // Continue execution even if database is unavailable
  }

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