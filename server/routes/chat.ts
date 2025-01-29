import { Router } from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";

const router = Router();

router.post("/chat", async (req, res) => {
  try {
    console.log("Environment variables:", {
      GOOGLE_API_KEY: process.env.GOOGLE_API_KEY ? "Present" : "Missing",
      NODE_ENV: process.env.NODE_ENV
    });

    const { message, history } = req.body;

    if (!message) {
      return res.status(400).json({
        error: "Bad Request",
        details: "Message is required"
      });
    }

    const apiKey = process.env.GOOGLE_API_KEY;
    
    if (!apiKey) {
      console.error("Missing Google API key in environment");
      return res.status(500).json({ 
        error: "Server Configuration Error", 
        details: "Google API key not configured"
      });
    }

    console.log("Initializing Google AI with API key");
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-pro",
      generationConfig: {
        temperature: 0.9,
        maxOutputTokens: 1000,
        topK: 40,
        topP: 0.8,
      }
    });

    // Format history for Gemini's expected structure
    const formattedHistory = history ? history.map((entry: any) => ({
      role: entry.role === 'user' ? 'user' : 'model',
      parts: [{ text: entry.content }]
    })) : [];

    console.log("Starting chat with history:", formattedHistory.length > 0 ? "Present" : "Missing");
    const chat = model.startChat({
      history: history || [],
      generationConfig: {
        temperature: 0.9,
        maxOutputTokens: 1000,
        topK: 40,
        topP: 0.8,
      },
    });

    try {
      console.log("Sending message to AI:", message);
      const result = await chat.sendMessage(message);
      const response = await result.response;
      const text = response.text();

      if (!text) {
        throw new Error("Empty response from AI model");
      }

      console.log("Received response from AI:", text.substring(0, 100) + "...");
      res.json({ message: text });
    } catch (modelError) {
      console.error("AI model error:", modelError);
      res.status(500).json({ 
        error: "AI Processing Error",
        details: modelError instanceof Error ? modelError.message : "Failed to process message with AI model"
      });
    }
  } catch (error) {
    console.error("Chat error:", error);
    res.status(500).json({ 
      error: "Internal Server Error",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

export default router; 