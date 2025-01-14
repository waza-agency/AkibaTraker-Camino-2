const FAL_API_KEY = import.meta.env.VITE_FAL_API_KEY;

export async function generateVideo(prompt: string): Promise<string> {
  const response = await fetch("https://fal.ai/api/v1/video", {
    method: "POST",
    headers: {
      "Authorization": `Key ${FAL_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt,
      duration: 15,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to generate video");
  }

  const data = await response.json();
  return data.url;
}
