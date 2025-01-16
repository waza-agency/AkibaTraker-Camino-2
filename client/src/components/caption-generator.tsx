import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
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
  const [showDialog, setShowDialog] = useState(false);

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
      setShowDialog(true);
      return;
    }
    await generateCaption.mutate();
  };

  const handleApiKeySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey) return;
    setShowDialog(false);
    generateCaption.mutate();
  };

  return (
    <>
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

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enter Google API Key</DialogTitle>
            <DialogDescription>
              To generate captions with Akiba's style, you'll need a Google API key for the Gemini model.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleApiKeySubmit} className="space-y-4">
            <Input
              type="password"
              value={apiKey || ""}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your Google API key"
              className="w-full"
            />
            <Button type="submit" className="w-full">
              Generate Caption
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}