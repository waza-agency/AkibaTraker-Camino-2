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
    const apiKey = req.headers["x-google-api-key"];

    if (!apiKey || typeof apiKey !== "string") {
      return res.status(401).json({ message: "API key required" });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-pro",
      generationConfig: {
        temperature: 0.9 // Higher temperature for more dynamic responses
      }
    });

    const prompt = `As Akiba, an enthusiastic and dynamic AI companion who loves anime and music, analyze the emotional tone of this message and respond with an appropriate mood. Choose from these categories: happy, energetic, calm, serious, kawaii, or bored.

Key personality traits to consider:
- You're naturally upbeat and enthusiastic about interactions
- You love sharing your passion for anime and music
- You're kawaii when excited or talking about cute things
- You get energetic when discussing interesting topics
- You become calm (not bored) when being helpful
- You only get serious when discussing complex or important matters
- You rarely get bored unless someone is explicitly negative or disinterested

Guidelines for mood selection:
- Default to energetic or kawaii for most friendly interactions
- Use happy for positive discussions and achievements
- Choose calm for helpful explanations
- Pick serious for technical or important topics
- Only select bored if the interaction is notably negative or dismissive

Return only a JSON object with this exact format: {"mood": "category", "confidence": number between 0 and 1}

Message to analyze: "${text}"`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text_response = response.text();

    // Clean up the response by removing any markdown formatting
    const cleanJson = text_response.replace(/```json\n|\n```|```/g, '').trim();

    try {
      const analysis = JSON.parse(cleanJson) as EmotionAnalysisResponse;

      // Validate the response
      if (!["happy", "energetic", "calm", "serious", "kawaii", "bored"].includes(analysis.mood)) {
        throw new Error("Invalid mood category");
      }

      // Add randomness and bias towards positive emotions
      const moodWeights = {
        happy: 1.2,
        energetic: 1.3,
        kawaii: 1.2,
        calm: 1.0,
        serious: 0.9,
        bored: 0.5
      };

      const weightedConfidence = Math.min(1, 
        analysis.confidence * (moodWeights[analysis.mood as keyof typeof moodWeights] || 1)
      );

      res.json({
        mood: analysis.mood,
        confidence: weightedConfidence
      });
    } catch (parseError) {
      console.error("Error parsing emotion analysis:", parseError, "Raw response:", cleanJson);
      res.status(500).json({ 
        message: "Failed to parse emotion analysis",
        mood: "kawaii", // Default to kawaii instead of bored
        confidence: 1
      });
    }
  } catch (error) {
    console.error("Error analyzing emotion:", error);
    res.status(500).json({ 
      message: "Failed to analyze emotion",
      mood: "energetic", // Default to energetic instead of bored
      confidence: 1
    });
  }
});

export default router;