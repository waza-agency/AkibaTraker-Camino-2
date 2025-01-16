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
      "fal-ai/stable-diffusion-v1-5",
      {
        input: {
          prompt: `anime style, detailed, ${prompt}`,
          lora_weights: "https://v3.fal.media/files/koala/y0UV6IAVmGjV5d8b_5juS_pytorch_lora_weights.safetensors",
          lora_scale: 0.8,
          negative_prompt: "lowres, bad anatomy, bad hands, text, error, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality, normal quality, jpeg artifacts, signature, watermark, username, blurry",
          num_inference_steps: 30,
          guidance_scale: 7.5,
          width: 512,
          height: 512
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

    if (!result.data?.images?.[0]) {
      throw new Error("No image URL in response");
    }

    return result.data.images[0].url;
  } catch (error) {
    console.error("FAL.ai API error:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to generate image");
  }
}