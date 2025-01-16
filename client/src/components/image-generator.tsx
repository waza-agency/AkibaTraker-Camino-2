import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { Download } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { motion, AnimatePresence } from "framer-motion";

export default function ImageGenerator() {
  const [prompt, setPrompt] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const { toast } = useToast();

  const generateImage = useMutation({
    mutationFn: async (userPrompt: string) => {
      const res = await fetch("/api/generate-image", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-fal-api-key": apiKey
        },
        body: JSON.stringify({ prompt: userPrompt }),
      });

      if (!res.ok) {
        const error = await res.text();
        throw new Error(error);
      }

      return res.json();
    },
    onSuccess: (data) => {
      setGeneratedImage(data.imageUrl);
      toast({
        title: "Success",
        description: "Image generated successfully!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleApiKeySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim()) return;

    setIsAuthenticated(true);
    toast({
      title: "Success",
      description: "API Key saved! You can now generate images",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    await generateImage.mutate(prompt);
  };

  const handleDownload = () => {
    if (generatedImage) {
      const link = document.createElement('a');
      link.href = generatedImage;
      link.download = `akiba-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  if (!isAuthenticated) {
    return (
      <Card className="w-full retro-container p-6">
        <div className="text-center space-y-4">
          <h3 className="text-lg font-bold glow-text">FAL.ai API Key Required</h3>
          <p className="text-sm text-muted-foreground mt-2">
            To generate custom Akiba images, you'll need a FAL.ai API key.
          </p>
          <form onSubmit={handleApiKeySubmit} className="space-y-4">
            <Input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your FAL.ai API key"
              className="pixel-borders"
            />
            <Button type="submit" className="w-full retro-btn">
              Start Creating
            </Button>
          </form>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 retro-container">
      <div>
        <h2 className="text-lg font-semibold mb-4">Create Your Akiba Image</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe how you want your Akiba to look..."
              className="pixel-borders"
              disabled={generateImage.isPending}
            />
          </div>

          <Button 
            type="submit"
            className="w-full retro-btn"
            disabled={generateImage.isPending}
          >
            {generateImage.isPending ? (
              <div className="flex items-center space-x-2">
                <LoadingSpinner size="sm" />
                <span>Generating...</span>
              </div>
            ) : (
              "Generate Akiba"
            )}
          </Button>

          <AnimatePresence>
            {generatedImage && (
              <motion.div 
                className="mt-4 space-y-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="border-4 border-primary/20 rounded-lg overflow-hidden relative">
                  <img
                    src={generatedImage}
                    alt="Generated Akiba"
                    className="w-full h-auto"
                  />
                  {generateImage.isPending && (
                    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
                      <LoadingSpinner size="lg" />
                    </div>
                  )}
                </div>
                <Button 
                  className="w-full retro-btn"
                  onClick={handleDownload}
                  disabled={generateImage.isPending}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Image
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </form>
      </div>
    </Card>
  );
}