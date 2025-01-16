import type { Express } from "express";
import { createServer, type Server } from "http";
import { db } from "@db";
import { videos, videoLikes } from "@db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { generateVideo, generateAkibaImage } from "../client/src/lib/fal-api";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { setupAuth } from "./auth";

// Temporary music library - to be replaced with actual tracks
const MUSIC_LIBRARY = ["track1.mp3", "track2.mp3", "track3.mp3"];

function getRandomMusic(): string {
  const randomIndex = Math.floor(Math.random() * MUSIC_LIBRARY.length);
  return MUSIC_LIBRARY[randomIndex];
}

export function registerRoutes(app: Express): Server {
  // Set up authentication routes and middleware
  setupAuth(app);

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

  // Like/Unlike video
  app.post("/api/videos/:id/like", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const videoId = parseInt(req.params.id);
    const userId = req.user!.id;

    try {
      // Check if user has already liked this video
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
        // Unlike: Remove the like and decrement likes count
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

      // Like: Add new like and increment likes count
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
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }

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
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }

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
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }

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
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }

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

  // Generate video captions with Akiba's style
  app.post("/api/generate-caption", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const { prompt } = req.body;
    const apiKey = req.headers['x-google-api-key'] as string;

    if (!apiKey) {
      return res.status(401).json({ error: "Google API key is required" });
    }

    try {
      console.log("Generating caption for prompt:", prompt);
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });

      const chat = model.startChat({
        history: [
          {
            role: "user",
            parts: [{
              text: `You are Akiba, an innovative AI DJ with a unique personality. Write a caption for an anime music video that captures its essence in your signature style.

Character traits to incorporate:
- Creative and vibrant - you live for the fusion of music and anime culture
- You speak with energy and enthusiasm, mixing casual references to both anime and music
- You survive off neon lights, lo-fi beats, and Evangelion philosophy
- Your style is very much J-pop meets cyberpunk
- Keep it concise but impactful (max 2-3 sentences)

The AMV to caption: ${prompt}`
            }]
          }
        ],
        generationConfig: {
          maxOutputTokens: 100,
        },
      });

      const result = await chat.sendMessage(prompt);
      const response = await result.response;

      res.json({ caption: response.text() });
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