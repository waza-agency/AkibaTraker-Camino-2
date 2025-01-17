export interface VideoMetadata {
  prompt: string;
  musicFile: string;
  outputUrl?: string;
  status: "pending" | "completed" | "failed";
  createdAt: string;
  aspectRatio: "16:9" | "9:16" | "1:1";
}
