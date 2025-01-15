import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { SelectVideo } from "@db/schema";

export default function VideoGallery() {
  const { data: videos, isLoading } = useQuery<SelectVideo[]>({
    queryKey: ["/api/videos"],
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Your Generated Videos</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="p-4 h-[200px] animate-pulse bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  if (!videos?.length) {
    return (
      <Card className="p-6 text-center text-muted-foreground">
        No videos generated yet. Try creating one!
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Your Generated Videos</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {videos.map((video) => (
          <Card key={video.id} className="p-4 space-y-3">
            {video.status === "pending" && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Generating...</p>
                <Progress value={30} />
              </div>
            )}
            
            {video.status === "completed" && video.outputUrl && (
              <video
                src={video.outputUrl}
                controls
                className="w-full rounded-lg aspect-video object-cover"
              />
            )}
            
            {video.status === "failed" && (
              <p className="text-sm text-destructive">
                Failed to generate video
              </p>
            )}
            
            <p className="text-sm truncate" title={video.prompt}>
              {video.prompt}
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
}
