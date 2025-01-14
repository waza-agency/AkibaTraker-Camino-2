import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import type { SelectVideo } from "@db/schema";

export default function VideoPreview() {
  const { data: videos } = useQuery<SelectVideo[]>({
    queryKey: ["/api/videos"],
  });

  if (!videos?.length) {
    return null;
  }

  const latestVideo = videos[0];

  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold mb-4">Preview</h2>
      
      {latestVideo.status === "pending" && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Generating your AMV...</p>
          <Progress value={30} />
        </div>
      )}

      {latestVideo.status === "completed" && latestVideo.outputUrl && (
        <div className="space-y-4">
          <video
            src={latestVideo.outputUrl}
            controls
            className="w-full rounded-lg"
          />
          <Button className="w-full">
            <Download className="mr-2 h-4 w-4" />
            Download AMV
          </Button>
        </div>
      )}

      {latestVideo.status === "failed" && (
        <p className="text-sm text-destructive">
          Failed to generate video. Please try again.
        </p>
      )}
    </Card>
  );
}
