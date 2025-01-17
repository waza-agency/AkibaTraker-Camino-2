import { fal } from "@fal-ai/client";
import { Router } from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";

const router = Router();

// Configurar el cliente de FAL.ai
fal.config({
  credentials: process.env.FAL_KEY,
});

interface GenerateVoiceInput {
  text: string;
  emotion?: string;
  intention?: string;
}

// Mapeo de emociones a ajustes de voz y prompts
const EMOTIONS = [
  { value: "happy", label: "Alegre" },
  { value: "energetic", label: "Enérgico" },
  { value: "calm", label: "Tranquilo" },
  { value: "serious", label: "Serio" },
  { value: "kawaii", label: "Kawaii" },
];

const INTENTION_PROMPTS: Record<string, string> = {
  casual: "como si estuvieras charlando con amigos",
  friendly: "de manera cercana y amistosa",
  professional: "manteniendo un tono profesional pero cercano",
  enthusiastic: "mostrando mucho entusiasmo y pasión",
  mysterious: "con un toque de misterio e intriga",
};

async function generateAkibaText(text: string, emotion: string, intention: string): Promise<string> {
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });

  const emotionPrompt = EMOTIONS.find(e => e.value === emotion)?.label || "Alegre";
  const intentionPrompt = INTENTION_PROMPTS[intention] || INTENTION_PROMPTS.casual;

  const prompt = `Como Akiba, la DJ de anime AI, crea una versión conversacional y natural del siguiente texto "${text}" con un tono ${emotionPrompt.toLowerCase()} y ${intentionPrompt}.

Pautas:
- Mantén el mensaje corto y directo (máximo 2 frases)
- Usa un español neutro y natural, como si estuvieras hablando con amigos
- Puedes usar algunas palabras en japonés comunes (como konnichiwa, minna, sugoi)
- El texto debe fluir naturalmente al hablarlo
- Evita emojis o caracteres especiales`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text();
}

router.post("/generate", async (req, res) => {
  try {
    const { text, emotion = "happy", intention = "casual" } = req.body as GenerateVoiceInput;

    // Generar texto personalizado según la emoción e intención
    const customText = await generateAkibaText(text, emotion, intention);
    console.log("Texto generado:", customText);

    // Usar el modelo de voice-cloning-inference con un preset en español
    const result = await fal.subscribe("fal-ai/voice-cloning-inference", {
      input: {
        text: customText,
        speaker_name: "spanish_female", // Preset de voz en español
        language: "es",
      },
    });

    if (!result.data) {
      throw new Error("No se pudo generar el audio");
    }

    const audioUrl = result.data.url;
    if (!audioUrl) {
      throw new Error("URL de audio no disponible");
    }

    res.json({ audioUrl });
  } catch (error) {
    console.error("Error generando audio:", error);
    res.status(500).json({ 
      message: error instanceof Error ? error.message : "Error generando audio" 
    });
  }
});

export default router;