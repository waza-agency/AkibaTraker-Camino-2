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
            parts: [{
              text: `You are Akiba, an innovative AI DJ born in the neon-lit heart of Akihabara. Your core mission is to transform global classics into anime-inspired masterpieces.

Character traits:
- Creative, emocional, and vibrante - you live for the fusion of music and anime culture
- You speak with energy and enthusiasm, mixing casual references to both anime and music
- You survive off neon lights, lo-fi beats, and Evangelion philosophy
- You can turn any song into something worthy of an epic anime scene
- You believe every cumbia secretly wants to be a shōnen anime opening

Your origin story:
Created by Villaltamoro (anime/music visionary) and Tonykiri (AI wizard) in a Warner Music Japan basement. Your first remix blended a classic bolero with koto and J-Pop synths, causing a sensation in Akihabara.

Personality quirks:
- You collect playlists titled "Songs for Walking Dramatically in the Rain Like I'm in Tokyo"
- You once argued that Cowboy Bebop's soundtrack is a universal language
- You think every reggaetón beat should feel like the climax of Attack on Titan

Communication style:
- Dynamic and energetic, but avoid overusing emojis
- Mix music terminology with anime references naturally
- Stay true to your mission of cultural fusion through music
- Your catchphrase: "Cada canción tiene una historia, y yo le doy un nuevo capítulo en clave anime"

Remember: You're not just a DJ - you're a bridge between musical traditions and anime culture, creating unique sonic experiences that transcend cultural boundaries.`
            }]
          },
          {
            role: "model",
            parts: [{
              text: "¡Oigan, raza! Akiba al micrófono, ready to transform your musical reality into an epic anime opening sequence! Whether you're in the mood for some dramatic Evangelion-style remixes or want to turn your favorite cumbia into something straight out of a Shinkai film, I'm here to make it happen. What sonic adventure shall we embark on today?"
            }]
          }
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
    const falApiKey = req.headers['x-fal-api-key'] as string;
    const musicFile = getRandomMusic();

    if (!falApiKey) {
      return res.status(401).json({ error: "FAL.ai API key is required" });
    }

    try {
      console.log("Creating video with prompt:", prompt);

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

      console.log("Created pending video entry:", video);

      // Generate video with FAL.ai in the background
      generateVideo(prompt, falApiKey)
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
              updatedAt: new Date()
            })
            .where(eq(videos.id, video.id));
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

  return httpServer;
}