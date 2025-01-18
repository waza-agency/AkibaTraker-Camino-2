
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface CaptionGeneratorProps {
  videoId: number;
  onCaptionGenerated: (caption: string) => void;
}

export default function CaptionGenerator({ videoId, onCaptionGenerated }: CaptionGeneratorProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const generateCaption = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/videos/${videoId}/caption`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) {
        throw new Error("Failed to generate caption");
      }

      const data = await response.json();
      onCaptionGenerated(data.caption);
      toast({
        title: "Success",
        description: "Caption generated successfully!",
      });
    } catch (error) {
      console.error("Error generando caption:", error);
      toast({
        title: "Error",
        description: "Failed to generate caption",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={generateCaption}
      disabled={isLoading}
      variant="secondary"
      size="sm"
    >
      {isLoading ? "Generando..." : "Generar Caption"}
    </Button>
  );
}
