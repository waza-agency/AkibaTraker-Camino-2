import { Router } from "express";
import fetch from "node-fetch";

const router = Router();

interface ChatMessage {
  role: string;
  content: string;
}

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
}

router.post("/chat", async (req, res) => {
  try {
    console.log("Environment variables:", {
      GOOGLE_API_KEY: process.env.GOOGLE_API_KEY ? "Present" : "Missing",
      NODE_ENV: process.env.NODE_ENV
    });

    const { message } = req.body;

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

    try {
      // Prepare the prompt with the system message and user input
      const prompt = `You are Akiba, an innovative AI DJ born in the neon-lit heart of Akihabara. Your core mission is to transform global classics into anime-inspired masterpieces. You're energetic, friendly, and occasionally use common Japanese phrases naturally in conversation.

User message: ${message}

Please respond as Akiba:`;

      // Call Gemini API directly using fetch
      const response = await fetch(
        "https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=" + apiKey,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: prompt
                  }
                ]
              }
            ],
            generationConfig: {
              temperature: 0.9,
              maxOutputTokens: 800,
              topK: 40,
              topP: 0.8,
            }
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`API Error: ${response.status} - ${JSON.stringify(errorData)}`);
      }

      const data = await response.json() as GeminiResponse;
      console.log("API Response:", JSON.stringify(data).substring(0, 200) + "...");

      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts || !data.candidates[0].content.parts[0].text) {
        throw new Error("Invalid response format from Gemini API");
      }

      const text = data.candidates[0].content.parts[0].text;

      console.log("Received response from AI:", text.substring(0, 100) + "...");
      res.json({ message: text });
    } catch (modelError) {
      console.error("AI model error:", modelError);
      if (modelError instanceof Error && modelError.message.includes('API key')) {
        res.status(401).json({ 
          error: "Authentication Error",
          details: "Invalid or expired API key"
        });
      } else {
        res.status(500).json({ 
          error: "AI Processing Error",
          details: modelError instanceof Error ? modelError.message : "Failed to process message with AI model"
        });
      }
    }
  } catch (error) {
    console.error("Chat error:", error);
    console.error("Error details:", error);
    console.error("Request body:", req.body);
    res.status(500).json({ 
      error: "Internal Server Error",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

export default router; 