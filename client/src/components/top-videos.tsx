import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Heart } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import type { SelectVideo } from "@db/schema";

export default function TopVideos() {
  const { data: topVideos, isLoading } = useQuery<SelectVideo[]>({
    queryKey: ["/api/videos/top"],
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner />
      </div>
    );
  }

  if (!topVideos?.length) {
    return null;
  }

  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold glow-text mb-4">Most Liked Videos</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {topVideos.map((video) => (
          <Card key={video.id} className="relative overflow-hidden retro-container">
            {video.outputUrl && (
              <div className="aspect-video">
                <video
                  src={video.outputUrl}
                  className="w-full h-full object-cover"
                  controls
                  muted
                />
              </div>
            )}
            <div className="p-4">
              <p className="text-sm truncate">{video.prompt}</p>
              <div className="flex items-center mt-2 text-primary">
                <Heart className="w-4 h-4 mr-1 fill-current" />
                <span className="text-sm">{video.likesCount}</span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
