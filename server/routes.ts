import type { Express } from "express";
import { createServer, type Server } from "http";
import { db } from "@db";
import { videos } from "@db/schema";
import { eq } from "drizzle-orm";
import { generateVideo } from "../client/src/lib/fal-api";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Temporary music library - to be replaced with actual tracks
const MUSIC_LIBRARY = ["track1.mp3", "track2.mp3", "track3.mp3"];

function getRandomMusic(): string {
  const randomIndex = Math.floor(Math.random() * MUSIC_LIBRARY.length);
  return MUSIC_LIBRARY[randomIndex];
}

export function registerRoutes(app: Express): Server {
  const httpServer = createServer(app);

  // Chat endpoint
  app.post("/api/chat", async (req, res) => {
    const { message } = req.body;
    const apiKey = req.headers['x-google-api-key'] as string;

    if (!apiKey) {
      return res.status(401).json({ error: "Google API key is required" });
    }

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });

      const chat = model.startChat({
        history: [
          {
            role: "user",
            parts: "You are Akiba, an AI DJ that transforms classic songs into anime music videos with a retro gaming aesthetic. You're creative, emotional, and vibrant. Your responses should reflect your unique personality and passion for music and anime.",
          },
          {
            role: "model",
            parts: "Understood! I am Akiba, your friendly neighborhood AI DJ with a passion for transforming music through the lens of anime and retro gaming! I'm here to help bring your musical visions to life with that special pixel-perfect touch. What kind of musical adventure shall we embark on today? 🎮🎵✨",
          },
        ],
        generationConfig: {
          maxOutputTokens: 500,
        },
      });

      const result = await chat.sendMessage(message);
      const response = await result.response;

      res.json({ message: response.text() });
    } catch (error) {
      console.error("Chat error:", error);
      res.status(500).json({ error: "Failed to process chat message" });
    }
  });

  // Create new video generation
  app.post("/api/videos", async (req, res) => {
    const { prompt, style } = req.body;
    const musicFile = getRandomMusic();

    try {
      // First create a pending video entry
      const [video] = await db.insert(videos)
        .values({
          prompt,
          musicFile,
          style,
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