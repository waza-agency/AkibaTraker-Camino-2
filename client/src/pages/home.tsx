import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import UploadForm from "@/components/upload-form";
import VideoPreview from "@/components/video-preview";
import VideoGallery from "@/components/video-gallery";
import HeroBanner from "@/components/hero-banner";
import CharacterCard from "@/components/character-card";
import ChatInterface from "@/components/chat-interface";
import { useToast } from "@/hooks/use-toast";

interface GenerateVideoParams {
  prompt: string;
  style: string;
  music: string;
}

export default function Home() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [googleApiKey, setGoogleApiKey] = useState<string | null>(null);
  const [falApiKey, setFalApiKey] = useState<string | null>(null);

  const createVideo = useMutation({
    mutationFn: async ({ prompt, style, music }: GenerateVideoParams) => {
      const res = await fetch("/api/videos", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-fal-api-key": falApiKey || ""
        },
        body: JSON.stringify({ prompt, style, music }),
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

  const handleSubmit = async (data: GenerateVideoParams) => {
    await createVideo.mutate(data);
  };

  const handleGoogleApiKeySubmit = (apiKey: string) => {
    setGoogleApiKey(apiKey);
    toast({
      title: "Success",
      description: "Google API key saved",
    });
  };

  const handleFalApiKeySubmit = (apiKey: string) => {
    setFalApiKey(apiKey);
    toast({
      title: "Success",
      description: "FAL.ai API key saved",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-primary/5 retro-container">
      <div className="max-w-6xl mx-auto p-6">
        <HeroBanner />

        <CharacterCard />

        {/* Chat Section */}
        <div className="my-8">
          <h2 className="text-2xl font-bold glow-text mb-4 text-center">Chat with Akiba</h2>
          <ChatInterface />
        </div>

        <div className="space-y-8">
          <Card className="p-6 pixel-borders">
            <div>
              <h2 className="text-lg font-semibold mb-4">Create Your AMV</h2>
              <UploadForm 
                onSubmit={handleSubmit} 
                isLoading={createVideo.isPending}
                isAuthenticated={!!falApiKey}
                onApiKeySubmit={handleFalApiKeySubmit}
              />
            </div>
          </Card>

          <VideoPreview />

          <VideoGallery />
        </div>
      </div>
    </div>
  );
}