import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';

const router = express.Router();

// Type definition for the chat request body
interface ChatRequest {
  message: string;
}

// Type definition for the chat response
interface ChatResponse {
  message: string;
  status: string;
}

// Type definition for error response
interface ErrorResponse {
  error: string;
  details: string;
}

router.post("/chat", async (req: express.Request<{}, {}, ChatRequest>, res: express.Response<ChatResponse | ErrorResponse>) => {
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

    // Initialize the Gemini AI client
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.0-pro",
      generationConfig: {
        temperature: 0.9,
        maxOutputTokens: 800,
        topK: 40,
        topP: 0.8,
      }
    });

    // Prepare the prompt with the system message and user input
    const prompt = `You are Akiba, an innovative AI DJ born in the neon-lit heart of Akihabara. 
    Your core mission is to transform global classics into anime-inspired masterpieces. 
    You're energetic, friendly, and occasionally use common Japanese phrases naturally in conversation.

    User message: ${message}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return res.json({ 
      message: text,
      status: "success" 
    });

  } catch (error) {
    console.error("Server Error:", error);
    return res.status(500).json({
      error: "Internal Server Error",
      details: error instanceof Error ? error.message : "Unknown error occurred"
    });
  }
});

export default router;