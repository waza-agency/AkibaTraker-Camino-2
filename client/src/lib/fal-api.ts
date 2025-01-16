import { fal } from "@fal-ai/client";

export async function generateVideo(prompt: string, apiKey: string): Promise<string> {
  try {
    // Configure FAL client with API key
    fal.config({
      credentials: apiKey
    });

    // Submit request using fal.subscribe for real-time updates
    const result = await fal.subscribe(
      "fal-ai/kling-video/v1.6/standard/text-to-video",
      {
        input: {
          prompt,
          duration: "5",
          aspect_ratio: "16:9"
        },
        logs: true,
        onQueueUpdate: (update) => {
          if (update.status === "IN_PROGRESS") {
            update.logs.map((log) => log.message).forEach(console.log);
          }
        },
      }
    );

    if (!result.data?.video?.url) {
      throw new Error("No video URL in response");
    }

    return result.data.video.url;
  } catch (error) {
    console.error("FAL.ai API error:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to generate video");
  }
}

export async function generateAkibaImage(prompt: string, apiKey: string): Promise<string> {
  try {
    // Configure FAL client with API key
    fal.config({
      credentials: apiKey
    });

    console.log("Starting image generation with prompt:", prompt);

    // Submit request using fal.subscribe for real-time updates
    const result = await fal.subscribe(
      "fal-ai/sd-lora",
      {
        input: {
          prompt: `high quality, detailed, best quality, masterpiece, anime style, ${prompt}`,
          model_name: "runwayml/stable-diffusion-v1-5",
          lora_weights: "https://v3.fal.media/files/koala/y0UV6IAVmGjV5d8b_5juS_pytorch_lora_weights.safetensors",
          lora_scale: 0.85,
          negative_prompt: "lowres, bad anatomy, bad hands, text, error, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality, normal quality, jpeg artifacts, signature, watermark, username, blurry, artist name",
          num_inference_steps: 35,
          guidance_scale: 8.5,
          width: 768,
          height: 768,
          scheduler: "DDIM",
          seed: Math.floor(Math.random() * 1000000)
        },
        logs: true,
        onQueueUpdate: (update) => {
          if (update.status === "IN_PROGRESS") {
            console.log("Generation status:", update.status);
            update.logs.map((log) => log.message).forEach(console.log);
          }
        },
      }
    );

    console.log("Generation result:", result);

    if (!result.data?.images?.[0]?.url) {
      throw new Error("No image URL in response");
    }

    return result.data.images[0].url;
  } catch (error) {
    console.error("FAL.ai API error:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to generate image");
  }
}