import type { Express } from "express";
import { createServer, type Server } from "http";
import { db } from "@db";
import { videos, videoLikes } from "@db/schema";
import { eq, and, desc, sql, lt } from "drizzle-orm";
import { generateVideo, generateAkibaImage } from "../client/src/lib/fal-api";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { setupAuth } from "./auth";
import emotionRouter from "./routes/emotion";

const MAX_GENERATION_TIME = 10 * 60 * 1000; // 10 minutes in milliseconds

// Clean up stalled videos
async function cleanupStalledVideos() {
  const staleTime = new Date(Date.now() - MAX_GENERATION_TIME);

  try {
    await db
      .update(videos)
      .set({
        status: "failed",
        metadata: sql`jsonb_set(COALESCE(metadata, '{}'::jsonb), '{error}', '"Generation timeout exceeded"')`,
        updatedAt: new Date()
      })
      .where(
        and(
          eq(videos.status, "pending"),
          lt(videos.createdAt, staleTime)
        )
      );

    console.log("Cleaned up stalled videos older than:", staleTime);
  } catch (error) {
    console.error("Failed to cleanup stalled videos:", error);
  }
}

// Run cleanup every 5 minutes
setInterval(cleanupStalledVideos, 5 * 60 * 1000);

export function registerRoutes(app: Express): Server {
  // Clean up stalled videos on startup
  cleanupStalledVideos();

  // Set up authentication routes and middleware
  setupAuth(app);

  // Register emotion analysis routes under /api prefix
  app.use("/api", emotionRouter);

  // Chat endpoint
  app.post("/api/chat", async (req, res) => {
    const { message } = req.body;
    const apiKey = process.env.GOOGLE_API_KEY || req.headers["x-google-api-key"];

    if (!apiKey || typeof apiKey !== "string") {
      return res.status(401).json({ error: "Google API key is required" });
    }

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ 
        model: "gemini-pro",
        generationConfig: {
          temperature: 0.9,
          maxOutputTokens: 500,
          topK: 40,
          topP: 0.8,
        }
      });

      const chat = model.startChat({
        history: [
          {
            role: "user",
            parts: [{
              text: `You are Akiba, an innovative AI DJ born in the neon-lit heart of Akihabara. Your core mission is to transform global classics into anime-inspired masterpieces.`
            }]
          },
          {
            role: "model",
            parts: [{
              text: "¡Oigan, raza! Akiba al micrófono, ready to transform your musical reality into an epic anime opening sequence!"
            }]
          }
        ]
      });

      const result = await chat.sendMessage(message);
      const response = await result.response;

      res.json({ message: response.text() });
    } catch (error) {
      console.error("Chat error:", error);
      res.status(500).json({ error: "Failed to process chat message" });
    }
  });

  // Like/Unlike video
  app.post("/api/videos/:id/like", async (req, res) => {
    const videoId = parseInt(req.params.id);
    const userId = req.user!.id;

    try {
      const [existingLike] = await db
        .select()
        .from(videoLikes)
        .where(
          and(
            eq(videoLikes.videoId, videoId),
            eq(videoLikes.userId, userId)
          )
        )
        .limit(1);

      if (existingLike) {
        await db.delete(videoLikes)
          .where(eq(videoLikes.id, existingLike.id));

        await db
          .update(videos)
          .set({
            likesCount: sql`likes_count - 1`,
            updatedAt: new Date()
          })
          .where(eq(videos.id, videoId));

        return res.json({ liked: false });
      }

      await db.insert(videoLikes)
        .values({
          videoId,
          userId
        });

      await db
        .update(videos)
        .set({
          likesCount: sql`likes_count + 1`,
          updatedAt: new Date()
        })
        .where(eq(videos.id, videoId));

      res.json({ liked: true });
    } catch (error) {
      console.error("Failed to toggle like:", error);
      res.status(500).json({ error: "Failed to toggle like" });
    }
  });

  // Get user's liked videos
  app.get("/api/videos/liked", async (req, res) => {
    try {
      const likedVideos = await db.query.videoLikes.findMany({
        where: eq(videoLikes.userId, req.user!.id),
        with: {
          video: true
        }
      });

      res.json(likedVideos);
    } catch (error) {
      console.error("Failed to get liked videos:", error);
      res.status(500).json({ error: "Failed to get liked videos" });
    }
  });

  // Get top liked videos
  app.get("/api/videos/top", async (req, res) => {
    try {
      const topVideos = await db
        .select()
        .from(videos)
        .where(eq(videos.status, "completed"))
        .orderBy(desc(videos.likesCount))
        .limit(4);

      res.json(topVideos);
    } catch (error) {
      console.error("Failed to get top videos:", error);
      res.status(500).json({ error: "Failed to get top videos" });
    }
  });

  // Create new video generation
  app.post("/api/videos", async (req, res) => {
    const { prompt, style } = req.body;
    const falApiKey = req.headers['x-fal-api-key'] as string;
    const musicFile = getRandomMusic();

    if (!falApiKey) {
      return res.status(401).json({ error: "FAL.ai API key is required" });
    }

    try {
      console.log("Creating video with prompt:", prompt);

      const [video] = await db.insert(videos)
        .values({
          prompt,
          musicFile,
          style,
          status: "pending",
          metadata: {},
          userId: req.user!.id,
          likesCount: 0
        })
        .returning();

      console.log("Created pending video entry:", video);

      generateVideo(prompt, falApiKey)
        .then(async (outputUrl) => {
          console.log("Video generated successfully:", outputUrl);
          try {
            await db
              .update(videos)
              .set({
                outputUrl,
                status: "completed",
                updatedAt: new Date()
              })
              .where(eq(videos.id, video.id));

            console.log("Database updated with video URL:", {
              videoId: video.id,
              outputUrl,
              status: "completed"
            });
          } catch (error) {
            console.error("Failed to update video in database:", error);
            await db
              .update(videos)
              .set({
                status: "failed",
                updatedAt: new Date()
              })
              .where(eq(videos.id, video.id));
          }
        })
        .catch(async (error) => {
          console.error("Failed to generate video:", error);
          try {
            await db
              .update(videos)
              .set({
                status: "failed",
                updatedAt: new Date()
              })
              .where(eq(videos.id, video.id));
            console.log("Updated video status to failed:", video.id);
          } catch (dbError) {
            console.error("Failed to update video status in database:", dbError);
          }
        });

      res.json(video);
    } catch (error) {
      console.error("Failed to create video:", error);
      res.status(500).json({
        error: "Failed to create video",
        details: error instanceof Error ? error.message : "Unknown error"
      });
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
      console.error("Failed to get video:", error);
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
      console.error("Failed to get videos:", error);
      res.status(500).json({ error: "Failed to get videos" });
    }
  });

  // Generate Akiba image
  app.post("/api/generate-image", async (req, res) => {
    const { prompt } = req.body;
    const falApiKey = req.headers['x-fal-api-key'] as string;

    if (!falApiKey) {
      return res.status(401).json({ error: "FAL.ai API key is required" });
    }

    try {
      console.log("Generating image with prompt:", prompt);
      const imageUrl = await generateAkibaImage(prompt, falApiKey);
      res.json({ imageUrl });
    } catch (error) {
      console.error("Failed to generate image:", error);
      res.status(500).json({
        error: "Failed to generate image",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Generate video captions
  app.post("/api/videos/:id/caption", async (req, res) => {
    const { id } = req.params;
    const apiKey = process.env.GOOGLE_API_KEY || req.headers["x-google-api-key"];

    if (!apiKey || typeof apiKey !== "string") {
      return res.status(401).json({ error: "Google API key is required" });
    }

    try {
      const video = await db.query.videos.findFirst({
        where: eq(videos.id, parseInt(id))
      });

      if (!video) {
        return res.status(404).json({ error: "Video not found" });
      }

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: "gemini-pro",
        generationConfig: {
          temperature: 0.9,
          maxOutputTokens: 100,
          topK: 40,
          topP: 0.8,
        }
      });

      const chat = model.startChat({
        history: [
          {
            role: "user",
            parts: [{
              text: `Eres Akiba, genera un caption en español para: ${video.prompt}`
            }]
          }
        ]
      });

      const result = await chat.sendMessage(video.prompt);
      const response = await result.response;
      const caption = response.text();

      await db
        .update(videos)
        .set({
          caption,
          updatedAt: new Date()
        })
        .where(eq(videos.id, parseInt(id)));

      console.log("Generated and saved caption:", caption);
      res.json({ caption });
    } catch (error) {
      console.error("Failed to generate caption:", error);
      res.status(500).json({
        error: "Failed to generate caption",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Temporary music library
const MUSIC_LIBRARY = ["track1.mp3", "track2.mp3", "track3.mp3"];

function getRandomMusic(): string {
  const randomIndex = Math.floor(Math.random() * MUSIC_LIBRARY.length);
  return MUSIC_LIBRARY[randomIndex];
}