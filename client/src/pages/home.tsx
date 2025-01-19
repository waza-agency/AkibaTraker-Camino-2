import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import UploadForm from "@/components/upload-form";
import VideoPreview from "@/components/video-preview";
import VideoGallery from "@/components/video-gallery";
import TopVideos from "@/components/top-videos";
import HeroBanner from "@/components/hero-banner";
import CharacterCard from "@/components/character-card";
import ChatInterface from "@/components/chat-interface";
import { useToast } from "@/hooks/use-toast";
import ImageGenerator from "@/components/image-generator";
import Navbar from "@/components/navbar";
import { motion } from "framer-motion";
import { MoodIndicator } from "@/components/mood-indicator";
import { useMood } from "@/hooks/use-mood";

// Add ElevenLabs component type definition
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'elevenlabs-convai': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        'agent-id': string;
      }
    }
  }
}

interface GenerateVideoParams {
  prompt: string;
  style: string;
  music: string;
}

export default function Home() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [falApiKey, setFalApiKey] = useState<string | null>(null);
  const { currentMood } = useMood();

  const createVideo = useMutation({
    mutationFn: async ({ prompt, style, music }: GenerateVideoParams) => {
      const res = await fetch("/api/videos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-fal-api-key": falApiKey || "",
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

  const handleFalApiKeySubmit = (apiKey: string) => {
    setFalApiKey(apiKey);
    toast({
      title: "Success",
      description: "FAL.ai API key saved",
    });
  };

  const VoiceWaveAnimation = () => (
    <div className="flex gap-3 mt-4">
      {[1, 2, 3].map((i) => (
        <motion.div
          key={i}
          className="w-3 bg-primary/60 rounded-full"
          animate={{
            height: ["20px", "40px", "20px"],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            delay: i * 0.2,
          }}
        />
      ))}
    </div>
  );

  return (
    <div
      className="min-h-screen relative"
      style={{
        backgroundImage:
          'url("https://lime-zygomorphic-vicuna-674.mypinata.cloud/ipfs/bafybeicz4mfqquhx7fgjbg6zuz35olhlfcxugbj4rmjpwkvulhixq3lwwa")',
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Background Overlay */}
      <div className="absolute inset-0 bg-background/40 backdrop-blur-sm" />

      {/* Content */}
      <div className="relative z-10">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-6 space-y-8">
          <HeroBanner />
          <CharacterCard />

          {/* Chat Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Gemini Chat Section */}
            <div className="flex flex-col space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold glow-text">
                  Chat with Akiba
                </h2>
                <MoodIndicator mood={currentMood} className="bg-black/50 backdrop-blur-sm px-3 py-1 rounded-full" />
              </div>
              <Card className="flex-1 min-h-[500px] max-h-[500px] bg-card/50 backdrop-blur-sm">
                <ChatInterface />
              </Card>
            </div>

            {/* ElevenLabs Chat Section */}
            <div className="flex flex-col space-y-4">
              <h2 className="text-2xl font-bold glow-text">
                Habla con Akiba (Voz)
              </h2>
              <Card className="flex-1 min-h-[500px] max-h-[500px] bg-card/50 backdrop-blur-sm relative overflow-hidden">
                {/* Neon Marquee */}
                <div className="absolute top-0 left-0 right-0 bg-black/30 backdrop-blur-sm">
                  <motion.div
                    className="text-center py-2 text-sm font-medium tracking-wider"
                    animate={{
                      opacity: [1, 0.5, 1],
                      textShadow: [
                        "0 0 7px #fff, 0 0 10px #fff, 0 0 21px #fff, 0 0 42px #0fa, 0 0 82px #0fa, 0 0 92px #0fa",
                        "0 0 7px #fff, 0 0 10px #fff, 0 0 21px #fff, 0 0 42px #0fa",
                        "0 0 7px #fff, 0 0 10px #fff, 0 0 21px #fff, 0 0 42px #0fa, 0 0 82px #0fa, 0 0 92px #0fa",
                      ]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    ¿Quieres Conversar con Akiba?
                  </motion.div>
                </div>

                {/* ElevenLabs Widget Container */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-full max-w-2xl px-4 pt-20 flex flex-col items-center justify-center">
                    <div className="w-full">
                      <elevenlabs-convai
                        agent-id="5PqK0LFTDnnE0wBvIR46"
                        style={{
                          width: "100%",
                          height: "450px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          margin: "0 auto",
                          "--elevenlabs-button-background": "transparent",
                          "--elevenlabs-button-color": "white",
                          "--elevenlabs-button-border": "2px solid white",
                          "--elevenlabs-button-hover-background": "rgba(255, 255, 255, 0.1)",
                          "--elevenlabs-call-button-position": "relative",
                          "--elevenlabs-call-button-transform": "none",
                          "--elevenlabs-call-button-margin": "0 auto",
                        } as React.CSSProperties}
                      />
                    </div>
                  </div>
                </div>

                {/* Voice Wave Animation */}
                <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                  <VoiceWaveAnimation />
                </div>
              </Card>
            </div>
          </div>

          {/* Image Generator Section */}
          <div className="mt-16">
            <ImageGenerator />
          </div>

          <div className="space-y-8">
            <Card className="p-6">
              <div>
                <h2 className="text-lg font-semibold mb-4">
                  Create Your AMV
                </h2>
                <UploadForm
                  onSubmit={handleSubmit}
                  isLoading={createVideo.isPending}
                  isAuthenticated={!!falApiKey}
                  onApiKeySubmit={handleFalApiKeySubmit}
                />
              </div>
            </Card>

            <VideoPreview />
            <TopVideos />
            <VideoGallery />
          </div>
        </div>
      </div>
    </div>
  );
}