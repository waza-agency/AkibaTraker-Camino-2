import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { SelectVideo } from "@db/schema";
import VideoPreviewThumbnail from "./video-preview-thumbnail";

export default function VideoGallery() {
  const { data: videos, isLoading } = useQuery<SelectVideo[]>({
    queryKey: ["/api/videos"],
  });
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const likeMutation = useMutation({
    mutationFn: async (videoId: number) => {
      const res = await fetch(`/api/videos/${videoId}/like`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to like video");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/videos"] });
      queryClient.invalidateQueries({ queryKey: ["/api/videos/top"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to like video",
        variant: "destructive",
      });
    },
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
      <Card className="p-4 text-center text-muted-foreground">
        No videos generated yet. Try creating one!
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Your Generated Videos</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {videos.map((video) => (
          <Card key={video.id} className="p-4 space-y-3 overflow-hidden">
            {video.status === "pending" && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Generating...</p>
                <Progress value={30} />
              </div>
            )}

            {video.status === "completed" && video.outputUrl && (
              <div className="relative group">
                <VideoPreviewThumbnail
                  src={video.outputUrl}
                  className="w-full rounded-lg aspect-video"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm hover:bg-background/90"
                  onClick={() => likeMutation.mutate(video.id)}
                  disabled={likeMutation.isPending}
                >
                  <Heart className={`w-4 h-4 ${video.likesCount > 0 ? 'fill-primary text-primary' : ''}`} />
                  <span className="ml-1">{video.likesCount || 0}</span>
                </Button>
              </div>
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