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
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";

interface GenerateVideoParams {
  prompt: string;
  style: string;
  music: string;
}

export default function Home() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [googleApiKey, setGoogleApiKey] = useState<string | null>(null);

  const createVideo = useMutation({
    mutationFn: async ({ prompt, style, music }: GenerateVideoParams) => {
      const res = await fetch("/api/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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

  const handleApiKeySubmit = (apiKey: string) => {
    setGoogleApiKey(apiKey);
    toast({
      title: "Success",
      description: "Google API key saved",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-primary/5 retro-container">
      <div className="max-w-6xl mx-auto p-6">
        <HeroBanner />

        <CharacterCard />

        <div className="space-y-8">
          <Card className="p-6 pixel-borders">
            <div>
              <h2 className="text-lg font-semibold mb-4">Create Your AMV</h2>
              <UploadForm onSubmit={handleSubmit} isLoading={createVideo.isPending} />
            </div>
          </Card>

          <VideoPreview />

          <VideoGallery />

          <Drawer>
            <DrawerTrigger asChild>
              <Button className="fixed bottom-6 right-6 h-16 w-16 rounded-full retro-btn">
                <MessageSquare className="h-6 w-6" />
              </Button>
            </DrawerTrigger>
            <DrawerContent className="h-[80vh]">
              <div className="mx-auto w-full max-w-4xl p-6">
                <ChatInterface
                  googleApiKey={googleApiKey}
                  onApiKeySubmit={handleApiKeySubmit}
                />
              </div>
            </DrawerContent>
          </Drawer>
        </div>
      </div>
    </div>
  );
}