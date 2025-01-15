const MOCK_VIDEOS = [
  "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
];

export async function generateVideo(prompt: string): Promise<string> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Return a random sample video
  const randomVideo = MOCK_VIDEOS[Math.floor(Math.random() * MOCK_VIDEOS.length)];
  return randomVideo;
}