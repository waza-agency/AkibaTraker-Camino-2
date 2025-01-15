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