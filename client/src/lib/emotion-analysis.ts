import { type Mood } from "@/components/mood-indicator";

interface EmotionAnalysis {
  mood: Mood;
  confidence: number;
}

export async function analyzeEmotion(text: string, apiKey: string): Promise<EmotionAnalysis> {
  try {
    console.log("Analyzing emotion for text:", text.substring(0, 50) + "...");

    const response = await fetch('/api/analyze-emotion', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      console.error("Error response from emotion analysis:", response.status, response.statusText);
      throw new Error('Failed to analyze emotion');
    }

    const result = await response.json();
    console.log("Emotion analysis result:", result);

    // Validate that the mood is one of the allowed values
    if (!["happy", "energetic", "calm", "serious", "kawaii", "bored"].includes(result.mood)) {
      console.warn("Invalid mood received:", result.mood);
      return { mood: "energetic", confidence: 1 }; // Default fallback
    }

    return {
      mood: result.mood as Mood,
      confidence: Math.max(0, Math.min(1, result.confidence))
    };
  } catch (error) {
    console.error("Error analyzing emotion:", error);
    // Return a default mood instead of throwing to maintain app stability
    return { mood: "energetic", confidence: 1 };
  }
}