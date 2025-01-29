import { fal } from "@fal-ai/client";

type GenerationStatus = 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
type ProgressCallback = (status: GenerationStatus, progress?: number) => Promise<void>;

interface VideoGenerationResult {
  video_url: string;
  seed?: number;
}

export async function generateVideo(prompt: string, apiKey: string, onProgress?: ProgressCallback) {
  try {
    console.log('Starting video generation with prompt:', prompt);
    
    // Configure FAL client
    fal.config({
      credentials: apiKey,
    });

    let startTime = Date.now();
    let lastProgress = 0;

    // Start the video generation
    const result = await fal.subscribe("fal-ai/kling-video/v1.6/standard/text-to-video", {
      input: {
        prompt: `anime cartoon, high quality, masterpiece, best quality, anime style, ${prompt}`,
        duration: "10",
        aspect_ratio: "16:9"
      },
      pollInterval: 10000, // Poll every 10 seconds
      logs: true,
      onQueueUpdate: async (update) => {
        console.log('Video generation status:', update.status);
        
        if (onProgress) {
          let status: GenerationStatus = 'IN_PROGRESS';
          let progress = lastProgress;

          // Calculate progress based on status
          if (update.status === 'IN_PROGRESS') {
            // Estimate progress based on time elapsed
            const timeElapsed = (Date.now() - startTime) / 1000;
            progress = Math.min(95, (timeElapsed / 60) * 100); // Assume ~1 minute generation time
            lastProgress = progress;
            // Log any messages from the API
            update.logs.map((log) => log.message).forEach(console.log);
          } else if (update.status === 'COMPLETED') {
            status = 'COMPLETED';
            progress = 100;
          } else {
            // Any other status (FAILED, CANCELLED, etc.) is treated as failure
            status = 'FAILED';
            progress = 0;
          }
          
          console.log('Estimated progress:', progress, '%');
          await onProgress(status, progress);
        }
      }
    });

    console.log("Video generation result:", result);

    if (!result.data?.video?.url) {
      throw new Error('No video URL in response');
    }

    return {
      url: result.data.video.url,
      duration: "10s"
    };
  } catch (error) {
    console.error('Error generating video:', error);
    throw error;
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
      "fal-ai/flux-lora",
      {
        input: {
          prompt: `high quality, masterpiece, best quality, anime style, ${prompt}`,
          image_size: "square_hd",
          num_inference_steps: 28,
          guidance_scale: 3.5,
          num_images: 1,
          enable_safety_checker: true,
          output_format: "jpeg",
          loras: [
            {
              path: "https://v3.fal.media/files/koala/y0UV6IAVmGjV5d8b_5juS_pytorch_lora_weights.safetensors",
              scale: 0.85
            }
          ]
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