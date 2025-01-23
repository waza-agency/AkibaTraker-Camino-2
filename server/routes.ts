import type { Express } from "express";
import { createServer, type Server } from "http";
import { db } from "@db";
import { videos, videoLikes } from "@db/schema";
import { eq, and, desc, sql, lt } from "drizzle-orm";
import { generateVideo, generateAkibaImage } from "../client/src/lib/fal-api";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { setupAuth } from "./auth";
import emotionRouter from "./routes/emotion";
import cspRouter from "./routes/csp";
import chatRouter from "./routes/chat";

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

  // Register chat routes
  app.use("/api", chatRouter);

  // Register CSP routes
  app.use("/api/csp", cspRouter);

  // Public routes (no authentication required)
  app.post("/api/videos", async (req, res) => {
    const { prompt, style } = req.body;
    const musicFile = getRandomMusic();
    const MAX_RETRIES = 3;
    const RETRY_DELAY = 2000; // 2 seconds

    try {
      console.log("Creating video with prompt:", prompt);

      const [video] = await db.insert(videos)
        .values({
          prompt,
          musicFile,
          style,
          status: "pending",
          metadata: { retryCount: 0 },
          userId: null,
          likesCount: 0
        })
        .returning();

      console.log("Created pending video entry:", video);

      // Function to attempt video generation with retries
      const attemptGeneration = async (retryCount = 0) => {
        try {
          const outputUrl = await generateVideo(prompt, process.env.FAL_API_KEY!);
          console.log("Video generated successfully:", outputUrl);
          
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
          console.error(`Failed to generate video (attempt ${retryCount + 1}/${MAX_RETRIES}):`, error);
          
          if (retryCount < MAX_RETRIES - 1) {
            console.log(`Retrying in ${RETRY_DELAY}ms...`);
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
            return attemptGeneration(retryCount + 1);
          }

          await db
            .update(videos)
            .set({
              status: "failed",
              metadata: sql`jsonb_set(COALESCE(metadata, '{}'::jsonb), '{error}', '"Maximum retry attempts exceeded"')`,
              updatedAt: new Date()
            })
            .where(eq(videos.id, video.id));
          
          console.log("Updated video status to failed after max retries:", video.id);
        }
      };

      // Start the generation process
      attemptGeneration().catch(async (error) => {
        console.error("Unexpected error in generation process:", error);
        await db
          .update(videos)
          .set({
            status: "failed",
            metadata: sql`jsonb_set(COALESCE(metadata, '{}'::jsonb), '{error}', '"Unexpected error in generation process"')`,
            updatedAt: new Date()
          })
          .where(eq(videos.id, video.id));
      });

      res.json(video);
    } catch (error) {
      console.error("Error creating video:", error);
      res.status(500).json({ error: "Failed to create video" });
    }
  });

  app.post("/api/generate-image", async (req, res) => {
    const { prompt } = req.body;

    try {
      const imageUrl = await generateAkibaImage(prompt, process.env.FAL_API_KEY!);
      res.json({ imageUrl });
    } catch (error) {
      console.error("Error generating image:", error);
      res.status(500).json({ error: "Failed to generate image" });
    }
  });

  // Public routes for viewing videos
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

  // Public routes (no authentication required)
  app.post("/api/videos/:id/retry", async (req, res) => {
    const { id } = req.params;

    try {
      const video = await db.query.videos.findFirst({
        where: eq(videos.id, parseInt(id))
      });

      if (!video) {
        return res.status(404).json({ error: "Video not found" });
      }

      if (video.status !== "failed") {
        return res.status(400).json({ error: "Can only retry failed videos" });
      }

      // Update video status to pending
      await db
        .update(videos)
        .set({
          status: "pending",
          metadata: {},
          updatedAt: new Date()
        })
        .where(eq(videos.id, video.id));

      // Start video generation
      generateVideo(video.prompt, process.env.FAL_API_KEY!)
        .then(async (outputUrl) => {
          console.log("Video generated successfully:", outputUrl);
          await db
            .update(videos)
            .set({
              outputUrl,
              status: "completed",
              updatedAt: new Date()
            })
            .where(eq(videos.id, video.id));
        })
        .catch(async (error) => {
          console.error("Failed to generate video:", error);
          await db
            .update(videos)
            .set({
              status: "failed",
              metadata: { error: error.message || "Failed to generate video" },
              updatedAt: new Date()
            })
            .where(eq(videos.id, video.id));
        });

      res.json({ message: "Video generation restarted" });
    } catch (error) {
      console.error("Error retrying video:", error);
      res.status(500).json({ error: "Failed to retry video" });
    }
  });

  // Protected routes (require authentication)
  const requireAuth = (req: any, res: any, next: any) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }
    next();
  };

  app.post("/api/videos/:id/like", requireAuth, async (req, res) => {
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

  app.get("/api/videos/liked", requireAuth, async (req, res) => {
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

  app.post("/api/videos/:id/caption", requireAuth, async (req, res) => {
    const { id } = req.params;
    const apiKey = process.env.GOOGLE_API_KEY;

    if (!apiKey) {
      console.error("Missing Google API key in environment");
      return res.status(401).json({
        error: "Authentication failed",
        details: "Google API key not configured"
      });
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