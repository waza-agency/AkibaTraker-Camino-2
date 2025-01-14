import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import UploadForm from "@/components/upload-form";
import VideoPreview from "@/components/video-preview";
import MusicSelector from "@/components/music-selector";
import { type VideoMetadata } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const [selectedMusic, setSelectedMusic] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createVideo = useMutation({
    mutationFn: async (data: { prompt: string; musicFile: string }) => {
      const res = await fetch("/api/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create video");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/videos"] });
      toast({
        title: "Success",
        description: "Video generation started",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to start video generation",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (prompt: string) => {
    if (!selectedMusic) {
      toast({
        title: "Error",
        description: "Please select background music",
        variant: "destructive",
      });
      return;
    }

    await createVideo.mutate({ prompt, musicFile: selectedMusic });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-primary/5 p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            AI AMV Generator
          </h1>
          <p className="text-muted-foreground mt-2">
            Create stunning anime music videos with AI
          </p>
        </div>

        <Card className="p-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <h2 className="text-lg font-semibold mb-4">1. Upload Content</h2>
              <UploadForm onSubmit={handleSubmit} isLoading={createVideo.isPending} />
            </div>
            <Separator className="md:hidden" />
            <div>
              <h2 className="text-lg font-semibold mb-4">2. Select Music</h2>
              <MusicSelector
                selected={selectedMusic}
                onSelect={setSelectedMusic}
              />
            </div>
          </div>
        </Card>

        <VideoPreview />
      </div>
    </div>
  );
}
