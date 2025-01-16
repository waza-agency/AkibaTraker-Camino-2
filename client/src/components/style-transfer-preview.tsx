import { useState, useEffect } from "react";
import { Slider } from "@/components/ui/slider";
import { Card } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

interface StyleTransferPreviewProps {
  prompt: string;
  onStyleStrengthChange?: (strength: number) => void;
  className?: string;
}

export default function StyleTransferPreview({
  prompt,
  onStyleStrengthChange,
  className
}: StyleTransferPreviewProps) {
  const [styleStrength, setStyleStrength] = useState(0.75);
  const { toast } = useToast();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const previewMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/style-preview", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
          styleStrength,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to generate preview");
      }

      const data = await res.json();
      return data.previewUrl;
    },
    onSuccess: (url) => {
      setPreviewUrl(url);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to generate style preview",
        variant: "destructive",
      });
    },
  });

  // Generate preview when prompt or style strength changes
  useEffect(() => {
    if (prompt) {
      const debounceTimer = setTimeout(() => {
        previewMutation.mutate();
      }, 500); // Debounce preview generation

      return () => clearTimeout(debounceTimer);
    }
  }, [prompt, styleStrength]);

  // Notify parent component of style strength changes
  useEffect(() => {
    onStyleStrengthChange?.(styleStrength);
  }, [styleStrength, onStyleStrengthChange]);

  return (
    <Card className={`p-4 space-y-4 ${className}`}>
      <div className="space-y-2">
        <label className="text-sm font-medium">Style Strength</label>
        <Slider
          value={[styleStrength * 100]}
          onValueChange={(values) => setStyleStrength(values[0] / 100)}
          max={100}
          step={1}
          className="w-full"
        />
        <p className="text-xs text-muted-foreground text-right">
          {Math.round(styleStrength * 100)}%
        </p>
      </div>

      <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
        <AnimatePresence mode="wait">
          {previewMutation.isPending ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <LoadingSpinner />
            </motion.div>
          ) : previewUrl ? (
            <motion.img
              key="preview"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              src={previewUrl}
              alt="Style preview"
              className="w-full h-full object-cover"
            />
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground"
            >
              Enter a prompt to see style preview
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Card>
  );
}
