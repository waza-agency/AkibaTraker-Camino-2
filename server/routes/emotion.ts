import { Router } from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";

const router = Router();

interface EmotionAnalysisResponse {
  mood: string;
  confidence: number;
}

router.post("/analyze-emotion", async (req, res) => {
  try {
    const { text } = req.body;
    const apiKey = process.env.GOOGLE_API_KEY || "";

    // Validate API key
    if (!apiKey || apiKey.trim() === "") {
      console.error("Missing Google API key in environment");
      return res.status(401).json({ error: "Google API key not configured in secrets" });
    }

    // Validate input text
    if (!text || typeof text !== "string" || text.trim().length === 0) {
      console.error("Missing or invalid text input");
      return res.status(400).json({ error: "Text is required" });
    }

    console.log("Analyzing emotion for text:", text.substring(0, 50) + "...");

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-pro",
      generationConfig: {
        temperature: 0.9,
        maxOutputTokens: 100, // Limit output size for faster response
      }
    });

    const prompt = `As Akiba, analyze the emotional tone of your response and select the most appropriate mood that matches your emotional state. Choose from these categories: happy, energetic, calm, serious, kawaii.

Return only a JSON object with this exact format: {"mood": "category", "confidence": number between 0 and 1}

Response to analyze: "${text}"`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text_response = response.text();

    // Clean up the response
    const cleanJson = text_response.replace(/```json\n|\n```|```/g, '').trim();
    console.log("Raw AI response:", cleanJson);

    try {
      const analysis = JSON.parse(cleanJson) as EmotionAnalysisResponse;

      // Validate the mood
      if (!["happy", "energetic", "calm", "serious", "kawaii", "bored"].includes(analysis.mood)) {
        console.error("Invalid mood category received:", analysis.mood);
        return res.status(422).json({ 
          error: "Invalid mood category",
          received: analysis.mood,
          allowed: ["happy", "energetic", "calm", "serious", "kawaii", "bored"]
        });
      }

      // Validate confidence
      if (typeof analysis.confidence !== "number" || analysis.confidence < 0 || analysis.confidence > 1) {
        console.error("Invalid confidence value:", analysis.confidence);
        return res.status(422).json({ 
          error: "Invalid confidence value",
          received: analysis.confidence,
          expected: "Number between 0 and 1"
        });
      }

      console.log("Emotion analysis result:", analysis);
      res.json(analysis);
    } catch (parseError) {
      console.error("Error parsing emotion analysis response:", parseError);
      console.error("Failed to parse response:", cleanJson);
      res.status(500).json({ 
        error: "Failed to parse emotion analysis response",
        mood: "energetic", // Default to energetic
        confidence: 1
      });
    }
  } catch (error) {
    console.error("Error in emotion analysis:", error);
    res.status(500).json({ 
      error: "Internal server error during emotion analysis",
      mood: "energetic", // Default to energetic
      confidence: 1
    });
  }
});

export default router;