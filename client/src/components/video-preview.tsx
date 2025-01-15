import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import type { SelectVideo } from "@db/schema";

export default function VideoPreview() {
  const { data: videos, refetch } = useQuery<SelectVideo[]>({
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

      {latestVideo.status === "pending" && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Generating your AMV...</p>
          <Progress value={30} className="pixel-borders" />
        </div>
      )}

      {latestVideo.status === "completed" && latestVideo.outputUrl && (
        <div className="space-y-4">
          <video
            src={latestVideo.outputUrl}
            controls
            className="w-full rounded-lg pixel-borders"
          />
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