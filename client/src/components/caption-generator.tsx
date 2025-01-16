import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Wand2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";

interface CaptionGeneratorProps {
  prompt: string;
  onCaptionGenerated?: (caption: string) => void;
  disabled?: boolean;
}

export default function CaptionGenerator({ 
  prompt, 
  onCaptionGenerated,
  disabled 
}: CaptionGeneratorProps) {
  const { toast } = useToast();
  const [apiKey, setApiKey] = useState<string | null>(null);

  const generateCaption = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/generate-caption", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-google-api-key": apiKey || ""
        },
        body: JSON.stringify({ prompt }),
      });

      if (!res.ok) {
        const error = await res.text();
        throw new Error(error);
      }

      return res.json();
    },
    onSuccess: (data) => {
      onCaptionGenerated?.(data.caption);
      toast({
        title: "Success",
        description: "Caption generated successfully!",
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

  const handleGenerateCaption = async () => {
    if (!apiKey) {
      const key = prompt("Please enter your Google API key to generate captions:");
      if (!key) return;
      setApiKey(key);
    }
    await generateCaption.mutate();
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      className="gap-2"
      onClick={handleGenerateCaption}
      disabled={disabled || generateCaption.isPending}
    >
      <Wand2 className="w-4 h-4" />
      {generateCaption.isPending ? "Generating..." : "Generate Caption"}
    </Button>
  );
}
