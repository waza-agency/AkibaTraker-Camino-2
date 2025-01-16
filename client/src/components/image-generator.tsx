import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";

export default function ImageGenerator() {
  const [prompt, setPrompt] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
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

  if (!isAuthenticated) {
    return (
      <Card className="w-full retro-container p-6">
        <div className="text-center space-y-4">
          <h3 className="text-lg font-bold glow-text">FAL.ai API Key Required</h3>
          <p className="text-sm text-muted-foreground">
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
      <h2 className="text-2xl font-bold glow-text mb-4">Create Your Akiba</h2>
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
          {generateImage.isPending ? "Generating..." : "Generate Akiba"}
        </Button>

        {generateImage.data?.imageUrl && (
          <div className="mt-4">
            <img
              src={generateImage.data.imageUrl}
              alt="Generated Akiba"
              className="w-full rounded-lg pixel-borders"
            />
            <Button 
              className="w-full mt-2 retro-btn"
              onClick={() => window.open(generateImage.data.imageUrl, '_blank')}
            >
              Download Image
            </Button>
          </div>
        )}
      </form>
    </Card>
  );
}