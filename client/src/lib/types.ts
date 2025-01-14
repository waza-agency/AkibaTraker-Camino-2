export interface VideoMetadata {
  prompt: string;
  musicFile: string;
  outputUrl?: string;
  status: "pending" | "completed" | "failed";
  createdAt: string;
}
