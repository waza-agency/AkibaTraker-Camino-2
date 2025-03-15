import React, { useEffect, useRef } from "react";
import { useUser } from "@/hooks/use-user";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import HeroBanner from "@/components/hero-banner";
import VideoGallery from "@/components/video-gallery";
import UploadForm from "@/components/upload-form";
import CharacterCard from "@/components/character-card";
import ChatInterface from "@/components/chat-interface";
import ImageGenerator from "@/components/image-generator";
import Navbar from "@/components/navbar";
import { MoodIndicator } from "@/components/mood-indicator";
import { useMood } from "@/hooks/use-mood";
import { Card } from "@/components/ui/card";
import { translations } from "@/lib/translations";

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

// Add global window type for loadElevenLabsScript
declare global {
  interface Window {
    loadElevenLabsScript: () => boolean;
  }
}

export default function Home() {
  const { user } = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { currentMood } = useMood();
  // Add a ref to track if the component is mounted
  const isMountedRef = useRef(true);

  // Modify the scroll effect to only run once on initial mount
  useEffect(() => {
    // Only scroll to top on initial page load, not during widget interactions
    const initialLoad = sessionStorage.getItem('initialPageLoad') !== 'true';
    if (initialLoad) {
      window.scrollTo(0, 0);
      sessionStorage.setItem('initialPageLoad', 'true');
    }
    
    // Prevent automatic scrolling behavior
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }
    
    // Cleanup function to set mounted ref to false when component unmounts
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Add useEffect for Eleven Labs widget initialization and error handling
  useEffect(() => {
    // Check if the Eleven Labs widget script is loaded
    const checkElevenLabsWidget = () => {
      if (!isMountedRef.current) return;
      
      if (document.querySelector('elevenlabs-convai')) {
        console.log('Eleven Labs widget found in DOM');
        
        // Add event listener for errors on the widget
        const widget = document.querySelector('elevenlabs-convai');
        if (widget) {
          // Remove any existing event listeners to prevent duplicates
          widget.removeEventListener('error', handleWidgetError);
          widget.addEventListener('error', handleWidgetError);
          
          // Prevent default behavior for any click events inside the widget
          widget.addEventListener('click', (e) => {
            e.stopPropagation();
          });
        }
      } else {
        console.warn('Eleven Labs widget not found in DOM');
        // Try to load the script again if widget is not found
        if (typeof window.loadElevenLabsScript === 'function') {
          window.loadElevenLabsScript();
        }
      }
    };
    
    // Handler function for widget errors
    const handleWidgetError = (e) => {
      console.error('ElevenLabs widget error event:', e);
      const errorElement = document.getElementById('elevenlabs-error-message');
      if (errorElement) {
        errorElement.classList.remove('hidden');
      }
    };
    
    // Run the check after a delay to ensure the DOM has been updated
    const timer = setTimeout(checkElevenLabsWidget, 2000);
    
    // Prevent scroll events from bubbling up when interacting with the widget
    const preventScrollReset = (e) => {
      if (e.target.closest('elevenlabs-convai')) {
        e.stopPropagation();
      }
    };
    
    // Add event listeners to prevent unwanted scrolling
    document.addEventListener('wheel', preventScrollReset, { passive: false });
    document.addEventListener('touchmove', preventScrollReset, { passive: false });
    
    return () => {
      clearTimeout(timer);
      document.removeEventListener('wheel', preventScrollReset);
      document.removeEventListener('touchmove', preventScrollReset);
    };
  }, []);

  const createVideo = useMutation({
    mutationFn: async (data: { prompt: string; style: string; music: string; musicStartTime?: number; musicEndTime?: number }) => {
      const res = await fetch("/api/videos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
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

          {/* Spotify Playlist Section */}
          <section className="mt-8">
            <Card className="bg-card/50 backdrop-blur-sm p-6 border border-primary/20">
              <div className="space-y-4">
                <h2 className="text-2xl font-bold glow-text text-center">{translations.home.warnerMusicTitle}</h2>
                <p className="text-center text-muted-foreground">
                  {translations.home.warnerMusicDescription}
                </p>
                <div className="relative rounded-xl overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 animate-gradient" />
                  <iframe 
                    className="relative z-10"
                    style={{ borderRadius: "12px" }}
                    src="https://open.spotify.com/embed/playlist/3YFBFlUlgFM7HonQqwTnuM?utm_source=generator&theme=0"
                    width="100%"
                    height={352}
                    frameBorder={0}
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                    loading="lazy"
                  />
                </div>
              </div>
            </Card>
          </section>

          {/* Chat Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Gemini Chat Section */}
            <div className="flex flex-col space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold glow-text">
                  {translations.home.chatWithAkiba}
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
                      {/* Error handling wrapper */}
                      <div className="relative">
                        {/* Eleven Labs widget */}
                        <elevenlabs-convai
                          agent-id="5PqK0LFTDnnE0wBvIR46"
                          style={{
                            width: "100%",
                            height: "450px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            margin: "0 auto",
                          }}
                          data-auto-scroll="false"
                          onClick={(e) => e.stopPropagation()}
                          onError={(e) => {
                            console.error("ElevenLabs widget error:", e);
                            const errorElement = document.getElementById('elevenlabs-error-message');
                            if (errorElement) {
                              errorElement.classList.remove('hidden');
                            }
                          }}
                        />
                        
                        {/* Fallback message for errors */}
                        <div 
                          id="elevenlabs-error-message" 
                          className="hidden absolute inset-0 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm p-6 rounded-lg"
                        >
                          <h3 className="text-xl font-bold text-red-400 mb-4">Error al cargar el chat de voz</h3>
                          <p className="text-center mb-4">
                            No se pudo cargar el módulo de audio necesario para la conversación por voz.
                          </p>
                          <div className="space-y-2 text-sm">
                            <p className="text-center">Intenta lo siguiente:</p>
                            <ul className="list-disc pl-6 space-y-1">
                              <li>Actualiza tu navegador a la última versión</li>
                              <li>Desactiva extensiones de bloqueo de contenido</li>
                              <li>Prueba en modo incógnito o en otro navegador</li>
                              <li>Verifica tu conexión a internet</li>
                            </ul>
                          </div>
                          <button 
                            className="mt-6 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/80 transition-colors"
                            onClick={() => {
                              // Try to reload the Eleven Labs script
                              if (typeof window.loadElevenLabsScript === 'function') {
                                // If the function exists in the global scope
                                window.loadElevenLabsScript();
                              } else {
                                // Otherwise just reload the page
                                window.location.reload();
                              }
                            }}
                          >
                            Reintentar
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Voice Wave Animation */}
                <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                  <div className="flex gap-3">
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
                </div>
              </Card>
            </div>
          </div>

          {/* Image Generator Section */}
          <div className="mt-16">
            <ImageGenerator />
          </div>

          {/* AMV Creation Section */}
          <section>
            <h2 className="text-2xl font-bold mb-6 glow-text">{translations.home.createAMV}</h2>
            <Card className="bg-card/50 backdrop-blur-sm p-6">
              <UploadForm 
                onSubmit={(data) => createVideo.mutate(data)}
                isLoading={createVideo.isPending}
              />
            </Card>
          </section>

          {/* Video Gallery Section */}
          <section>
            <h2 className="text-2xl font-bold mb-6 glow-text">{translations.home.latestCreations}</h2>
            <VideoGallery />
          </section>
        </div>
      </div>
    </div>
  );
}