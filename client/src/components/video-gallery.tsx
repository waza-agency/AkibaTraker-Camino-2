import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Heart, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import VideoPreviewThumbnail from "./video-preview-thumbnail";
import CaptionGenerator from "./caption-generator";
import { translations } from "@/lib/translations";
import React from "react";

interface VideoMetadata {
  error?: string;
  retryCount: number;
  progress: number;
  duration?: string;
  style?: string;
  audioFile?: string;
}

interface Video {
  id: number;
  prompt: string;
  style: string;
  videoUrl: string;
  audioUrl: string;
  status: string;
  metadata: VideoMetadata;
  likesCount: number;
  createdAt: string;
  creatorName: string;
}

export default function VideoGallery() {
  const { data: videos, isLoading, error } = useQuery<Video[]>({
    queryKey: ["/api/videos"],
    refetchInterval: (data) => {
      if (!Array.isArray(data)) return false;
      return data.some((v) => ["pending", "generating", "merging"].includes(v.status)) ? 2000 : false;
    }
  });

  // Log data for debugging
  React.useEffect(() => {
    if (videos) {
      console.log("Videos fetched successfully:", videos.length);
      if (videos.length > 0) {
        console.log("First video:", videos[0]);
      } else {
        console.log("No videos returned from API");
      }
    }
    if (error) {
      console.error("Error fetching videos:", error);
    }
  }, [videos, error]);

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
        title: translations.general.success,
        description: translations.videos.videoGenStarted,
      });
    },
    onError: () => {
      toast({
        title: translations.general.error,
        description: translations.videos.failedToStartGen,
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
    },
    onError: () => {
      toast({
        title: translations.general.error,
        description: "No se pudo dar like al video",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">{translations.videos.title}</h2>
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
        {translations.home.noVideosYet}
      </Card>
    );
  }

  const handleCaptionGenerated = async (videoId: number, caption: string) => {
    setVideoCaptions(prev => ({
      ...prev,
      [videoId]: caption
    }));
  };

  // Helper function to get proper video URL
  const getVideoUrl = (url: string) => {
    if (!url) {
      console.log("Empty video URL");
      return '';
    }
    console.log("Processing video URL:", url);
    return url.startsWith('/') ? `${window.location.origin}${url}` : url;
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">{translations.videos.yourGeneratedVideos}</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {allVideos.map((video) => (
          <Card key={video.id} className="p-4 space-y-3 overflow-hidden bg-card/50 backdrop-blur-sm">
            {(video.status === "pending" || video.status === "generating") && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  {translations.videos.generatingVideo} {Math.round(video.metadata?.progress || 0)}%
                </p>
                <Progress 
                  value={video.metadata?.progress || 0} 
                  className="animate-pulse" 
                />
              </div>
            )}

            {video.status === "ready_for_audio" && (
              <div className="space-y-3">
                <div className="p-4 rounded-lg bg-amber-500/10 text-amber-500">
                  <p className="text-sm font-medium">Audio Integration in Progress</p>
                  <p className="text-xs mt-1 text-muted-foreground">
                    Video is being processed with audio automatically
                  </p>
                </div>
                <Progress 
                  value={50} 
                  className="animate-pulse" 
                />
              </div>
            )}

            {video.status === "merging" && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  {translations.videos.mergingAudio} {Math.round(video.metadata?.progress || 0)}%
                </p>
                <Progress 
                  value={video.metadata?.progress || 0} 
                  className="animate-pulse" 
                />
              </div>
            )}

            {video.status === "failed" && (
              <div className="space-y-3">
                <div className="p-4 rounded-lg bg-destructive/10 text-destructive">
                  <p className="text-sm font-medium">{translations.general.error}</p>
                  <p className="text-xs mt-1 text-muted-foreground">
                    {video.metadata?.error || translations.errors.somethingWentWrong}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => retryGeneration.mutate(video.id)}
                  disabled={retryGeneration.isPending}
                >
                  {retryGeneration.isPending ? translations.upload.generating : translations.general.retry}
                </Button>
              </div>
            )}

            {video.status === "completed" && video.videoUrl && (
              <div className="space-y-3">
                <div className="relative group">
                  <VideoPreviewThumbnail
                    src={getVideoUrl(video.videoUrl)}
                    className="w-full rounded-lg aspect-video"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 left-2 bg-background/80 backdrop-blur-sm hover:bg-background/90"
                    onClick={() => window.open(getVideoUrl(video.videoUrl), '_blank')}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
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
                  <div className="flex justify-between items-center mt-2">
                    <p className="text-xs text-muted-foreground">
                      {new Date(video.createdAt).toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      By {video.creatorName}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}