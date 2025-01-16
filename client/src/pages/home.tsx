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
import ImageGenerator from "@/components/image-generator";
import Navbar from "@/components/navbar";

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
    <div 
      className="min-h-screen relative"
      style={{
        backgroundImage: 'url("https://lime-zygomorphic-vicuna-674.mypinata.cloud/ipfs/bafybeicz4mfqquhx7fgjbg6zuz35olhlfcxugbj4rmjpwkvulhixq3lwwa")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Background Overlay */}
      <div className="absolute inset-0 bg-background/40 backdrop-blur-sm" />

      {/* Content */}
      <div className="relative z-10 retro-container">
        <Navbar />
        <div className="max-w-6xl mx-auto p-6">
          <HeroBanner />

          <CharacterCard />

          {/* Chat Section */}
          <div className="my-8">
            <h2 className="text-2xl font-bold glow-text mb-4 text-center">Chat with Akiba</h2>
            <ChatInterface />
          </div>

          {/* Image Generator Section */}
          <div className="my-8">
            <ImageGenerator />
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
    </div>
  );
}