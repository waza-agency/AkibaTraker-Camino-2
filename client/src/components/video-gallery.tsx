import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { SelectVideo } from "@db/schema";
import VideoPreviewThumbnail from "./video-preview-thumbnail";
import ShareButton from "./share-button";
import CaptionGenerator from "./caption-generator";

interface VideoMetadata {
  error?: string;
  retryCount: number;
}

interface VideoWithMetadata extends Omit<SelectVideo, 'metadata'> {
  metadata: VideoMetadata;
}

export default function VideoGallery() {
  const { data: videos, isLoading } = useQuery<VideoWithMetadata[]>({
    queryKey: ["/api/videos"],
    // Poll for updates every 2 seconds while a video is pending
    refetchInterval: (data) => {
      if (!Array.isArray(data)) return false;
      return data.some((v) => v.status === "pending") ? 2000 : false;
    },
  });
  const [videoCaptions, setVideoCaptions] = useState<Record<number, string>>({});
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const retryGeneration = useMutation({
    mutationFn: async (videoId: number) => {
      const res = await fetch(`/api/videos/${videoId}/retry`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Error retrying video generation");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/videos"] });
      toast({
        title: "Success",
        description: "Video generation restarted",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Could not retry video generation",
        variant: "destructive",
      });
    },
  });

  const likeMutation = useMutation({
    mutationFn: async (videoId: number) => {
      const res = await fetch(`/api/videos/${videoId}/like`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Error liking video");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/videos"] });
      queryClient.invalidateQueries({ queryKey: ["/api/videos/top"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Could not like video",
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

  const allVideos = videos ?? [];

  if (!allVideos.length) {
    return (
      <Card className="p-4 text-center text-muted-foreground">
        You haven't generated any videos yet. Try creating one!
      </Card>
    );
  }

  const handleCaptionGenerated = async (videoId: number, caption: string) => {
    setVideoCaptions(prev => ({
      ...prev,
      [videoId]: caption
    }));
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Your Generated Videos</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {allVideos.map((video) => (
          <Card key={video.id} className="p-4 space-y-3 overflow-hidden">
            {video.status === "pending" && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Generating{" "}
                  {new Date(video.createdAt).toLocaleTimeString()}
                </p>
                <Progress value={30} className="animate-pulse" />
              </div>
            )}

            {video.status === "failed" && (
              <div className="space-y-3">
                <div className="p-4 rounded-lg bg-destructive/10 text-destructive">
                  <p className="text-sm font-medium">Generation failed</p>
                  <p className="text-xs mt-1 text-muted-foreground">
                    {video.metadata?.error || "An error occurred during generation"}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => retryGeneration.mutate(video.id)}
                  disabled={retryGeneration.isPending}
                >
                  {retryGeneration.isPending ? "Retrying..." : "Retry Generation"}
                </Button>
              </div>
            )}

            {video.status === "completed" && video.outputUrl && (
              <div className="space-y-3">
                <div className="relative group">
                  <VideoPreviewThumbnail
                    src={video.outputUrl}
                    className="w-full rounded-lg aspect-video"
                  />
                  <ShareButton 
                    url={video.outputUrl} 
                    title={video.prompt}
                  />
                  <div className="absolute top-2 right-2 flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="bg-background/80 backdrop-blur-sm hover:bg-background/90"
                      onClick={() => likeMutation.mutate(video.id)}
                      disabled={likeMutation.isPending}
                    >
                      <Heart className={`w-4 h-4 ${video.likesCount > 0 ? 'fill-primary text-primary' : ''}`} />
                      <span className="ml-1">{video.likesCount || 0}</span>
                    </Button>
                    <CaptionGenerator
                      videoId={video.id}
                      onCaptionGenerated={(caption) => handleCaptionGenerated(video.id, caption)}
                    />
                  </div>
                </div>
                <div>
                  <p className="text-sm truncate" title={video.prompt}>
                    {video.prompt}
                  </p>
                  {videoCaptions[video.id] && (
                    <p className="text-sm mt-2 italic text-muted-foreground">
                      {videoCaptions[video.id]}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(video.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}