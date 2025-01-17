
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export function CaptionGenerator({ videoId }: { videoId: number }) {
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
      toast({
        title: "Success",
        description: "Caption generated successfully!",
      });
      return data.caption;
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
      {isLoading ? "Generating..." : "Generar Caption"}
    </Button>
  );
}
