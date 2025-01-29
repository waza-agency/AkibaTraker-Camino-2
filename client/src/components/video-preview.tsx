import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { useState } from "react";

interface Video {
  id: number;
  outputUrl: string;
  status: string;
  // ... other fields ...
}

export default function VideoPreview() {
  const [aspectRatio, setAspectRatio] = useState<"16:9" | "9:16" | "1:1">("16:9");
  const { data: videos, refetch } = useQuery<Video[]>({
    queryKey: ["/api/videos"],
    // Poll for updates every 2 seconds while a video is pending
    refetchInterval: (data) => {
      const latestVideo = data?.[0];
      return latestVideo?.status === "pending" ? 2000 : false;
    },
  });

  if (!videos?.length) {
    return null;
  }

  const latestVideo = videos[0];

  return (
    <Card className="p-6 retro-container">
      <h2 className="text-lg font-semibold mb-4 glow-text">Preview</h2>

      <div className="mb-4">
        <label className="text-sm block mb-2">Aspect Ratio:</label>
        <div className="flex gap-2">
          <button 
            onClick={() => setAspectRatio("16:9")}
            className={`px-3 py-1 rounded ${aspectRatio === "16:9" ? "bg-primary text-primary-foreground" : "bg-muted"}`}
          >
            16:9
          </button>
          <button 
            onClick={() => setAspectRatio("9:16")}
            className={`px-3 py-1 rounded ${aspectRatio === "9:16" ? "bg-primary text-primary-foreground" : "bg-muted"}`}
          >
            9:16
          </button>
          <button 
            onClick={() => setAspectRatio("1:1")}
            className={`px-3 py-1 rounded ${aspectRatio === "1:1" ? "bg-primary text-primary-foreground" : "bg-muted"}`}
          >
            1:1
          </button>
        </div>
      </div>

      {latestVideo.status === "pending" && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Generating your AMV...</p>
          <Progress value={30} className="pixel-borders" />
        </div>
      )}

      {latestVideo.status === "completed" && latestVideo.outputUrl && (
        <div className="space-y-4">
          <div className={`relative ${
            aspectRatio === "16:9" ? "aspect-video" : 
            aspectRatio === "9:16" ? "aspect-[9/16]" : 
            "aspect-square"
          }`}>
            <video
              src={latestVideo.outputUrl}
              controls
              className="w-full h-full rounded-lg pixel-borders object-cover"
            />
          </div>
          <Button 
            className="w-full retro-btn"
            onClick={() => window.open(latestVideo.outputUrl, '_blank')}
          >
            <Download className="mr-2 h-4 w-4" />
            Download AMV
          </Button>
        </div>
      )}

      {latestVideo.status === "failed" && (
        <div className="space-y-2">
          <p className="text-sm text-destructive">
            Failed to generate video. Please try again.
          </p>
          <Button 
            variant="outline" 
            className="w-full retro-btn"
            onClick={() => refetch()}
          >
            Retry
          </Button>
        </div>
      )}
    </Card>
  );
}