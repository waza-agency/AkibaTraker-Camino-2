import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Image } from "lucide-react";
import StyleSelector from "./style-selector";
import MusicSelector from "./music-selector";
import { useState } from "react";

interface UploadFormProps {
  onSubmit: (data: { prompt: string; style: string; music: string }) => void;
  isLoading: boolean;
  isAuthenticated: boolean;
  onApiKeySubmit: (apiKey: string) => void;
}

export default function UploadForm({ onSubmit, isLoading, isAuthenticated, onApiKeySubmit }: UploadFormProps) {
  const [selectedStyle, setSelectedStyle] = useState("dramatic");
  const [selectedMusic, setSelectedMusic] = useState("epic.mp3");
  const [apiKey, setApiKey] = useState("");

  const form = useForm({
    defaultValues: {
      prompt: "",
    },
  });

  const handleSubmit = (data: { prompt: string }) => {
    onSubmit({ 
      ...data, 
      style: selectedStyle,
      music: selectedMusic
    });
  };

  const handleApiKeySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim()) return;
    onApiKeySubmit(apiKey);
  };

  if (!isAuthenticated) {
    return (
      <div className="space-y-4 text-center">
        <h3 className="text-lg font-bold glow-text">Authentication Required</h3>
        <p className="text-sm text-muted-foreground mt-2">
          Please log in to start creating AMVs.
        </p>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="prompt"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Prompt or Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe your AMV scene or paste an image URL..."
                  className="h-32 resize-none pixel-borders"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div>
          <FormLabel>Music Track</FormLabel>
          <MusicSelector
            selected={selectedMusic}
            onSelect={setSelectedMusic}
          />
        </div>

        <div>
          <FormLabel>Visual Style</FormLabel>
          <StyleSelector
            selected={selectedStyle}
            onSelect={setSelectedStyle}
          />
        </div>

        <Button
          type="submit"
          className="w-full retro-btn"
          disabled={isLoading}
        >
          <Image className="mr-2 h-4 w-4" />
          {isLoading ? (
            <span className="retro-loading">Generating...</span>
          ) : (
            "Generate AMV"
          )}
        </Button>
      </form>
    </Form>
  );
}