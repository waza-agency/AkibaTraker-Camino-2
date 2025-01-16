import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Wand2, Loader2 } from "lucide-react";
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
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('google_api_key') || '');
  const [showDialog, setShowDialog] = useState(false);

  const generateCaption = useMutation({
    mutationFn: async () => {
      if (!apiKey.trim()) {
        throw new Error("Se requiere una API key válida");
      }

      const res = await fetch("/api/generate-caption", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-google-api-key": apiKey.trim()
        },
        body: JSON.stringify({ prompt }),
      });

      if (!res.ok) {
        const error = await res.text();
        throw new Error(error);
      }

      const data = await res.json();
      return data.caption;
    },
    onSuccess: (caption) => {
      if (!caption) {
        throw new Error("No se pudo generar el subtítulo");
      }

      // Save API key for future use
      localStorage.setItem('google_api_key', apiKey);

      onCaptionGenerated?.(caption);
      toast({
        title: "¡Éxito!",
        description: "¡Subtítulo generado correctamente!",
      });
      setShowDialog(false);
    },
    onError: (error) => {
      console.error("Error generating caption:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al generar el subtítulo",
        variant: "destructive",
      });

      // Clear invalid API key
      if (error.message.includes("API key")) {
        localStorage.removeItem('google_api_key');
        setApiKey('');
      }
    },
  });

  const handleGenerateCaption = async () => {
    if (!apiKey.trim()) {
      setShowDialog(true);
      return;
    }
    await generateCaption.mutateAsync();
  };

  const handleApiKeySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim()) {
      toast({
        title: "Error",
        description: "Por favor ingresa una API key válida",
        variant: "destructive",
      });
      return;
    }
    await generateCaption.mutateAsync();
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="bg-background/80 backdrop-blur-sm hover:bg-background/90 gap-2"
        onClick={handleGenerateCaption}
        disabled={disabled || generateCaption.isPending}
      >
        {generateCaption.isPending ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Wand2 className="w-4 h-4" />
        )}
        {generateCaption.isPending ? "Generando..." : "Generar Subtítulo"}
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ingresa tu API Key de Google</DialogTitle>
            <DialogDescription>
              Para generar subtítulos con el estilo de Akiba, necesitas una API key de Google para el modelo Gemini.
              Esta se guardará localmente para futuros usos.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleApiKeySubmit} className="space-y-4">
            <Input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Ingresa tu API key de Google"
              className="w-full"
              required
            />
            <Button 
              type="submit" 
              className="w-full"
              disabled={generateCaption.isPending}
            >
              {generateCaption.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Generando...
                </>
              ) : (
                "Generar Subtítulo"
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}