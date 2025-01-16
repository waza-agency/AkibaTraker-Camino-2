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

export default function VideoGallery() {
  const { data: videos, isLoading } = useQuery<SelectVideo[]>({
    queryKey: ["/api/videos"],
  });
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const retryGeneration = useMutation({
    mutationFn: async (videoId: number) => {
      const res = await fetch(`/api/videos/${videoId}/retry`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Error al reintentar la generación del video");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/videos"] });
      toast({
        title: "Éxito",
        description: "Se ha reiniciado la generación del video",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo reintentar la generación del video",
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
      if (!res.ok) throw new Error("Error al dar me gusta al video");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/videos"] });
      queryClient.invalidateQueries({ queryKey: ["/api/videos/top"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo dar me gusta al video",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Tus Videos Generados</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="p-4 h-[200px] animate-pulse bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  // Filter and check for videos
  const allVideos = videos ?? [];

  if (!allVideos.length) {
    return (
      <Card className="p-4 text-center text-muted-foreground">
        Aún no has generado ningún video. ¡Intenta crear uno!
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Tus Videos Generados</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {allVideos.map((video) => (
          <Card key={video.id} className="p-4 space-y-3 overflow-hidden">
            {video.status === "pending" && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Generando{" "}
                  {new Date(video.createdAt).toLocaleTimeString()}
                </p>
                <Progress value={30} />
              </div>
            )}

            {video.status === "failed" && (
              <div className="space-y-2">
                <p className="text-sm text-red-500">Error al generar el video</p>
                <p className="text-xs text-muted-foreground">
                  {video.metadata?.error || "Error desconocido"}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => retryGeneration.mutate(video.id)}
                  disabled={retryGeneration.isPending}
                  className="w-full"
                >
                  Reintentar Generación
                </Button>
              </div>
            )}

            {video.status === "completed" && video.outputUrl && (
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
                  <CaptionGenerator
                    prompt={video.prompt}
                    onCaptionGenerated={(caption) => {
                      const captionElement = document.createElement('p');
                      captionElement.className = 'text-sm mt-2 italic text-muted-foreground';
                      captionElement.textContent = caption;

                      const promptElement = document.querySelector(`[data-video-id="${video.id}"] .video-prompt`);
                      if (promptElement) {
                        const existingCaption = promptElement.nextElementSibling;
                        if (existingCaption?.classList.contains('video-caption')) {
                          existingCaption.textContent = caption;
                        } else {
                          promptElement.insertAdjacentElement('afterend', captionElement);
                        }
                      }
                    }}
                  />
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
                </div>
              </div>
            )}

            <div data-video-id={video.id}>
              <p className="text-sm truncate video-prompt" title={video.prompt}>
                {video.prompt}
              </p>
              <p className="text-xs text-muted-foreground">
                {new Date(video.createdAt).toLocaleString()}
              </p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}