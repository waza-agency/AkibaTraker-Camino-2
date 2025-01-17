import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Wand2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";

interface CaptionGeneratorProps {
  videoId: number;
  prompt: string;
  onCaptionGenerated?: (caption: string) => void;
  disabled?: boolean;
}

export default function CaptionGenerator({ 
  videoId,
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

      const res = await fetch(`/api/videos/${videoId}/caption`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-google-api-key": apiKey.trim()
        },
      });

      if (!res.ok) {
        throw new Error(await res.text());
      }

      const data = await res.json();
      return data.caption;
    },
    onSuccess: (caption) => {
      localStorage.setItem('google_api_key', apiKey);
      onCaptionGenerated?.(caption);
      toast({
        title: "¡Éxito!",
        description: "¡Akiba ha creado un caption épico para tu video!",
      });
      setShowDialog(false);
    },
    onError: (error: Error) => {
      console.error("Error generando caption:", error);
      let errorMessage = "Error al generar el caption";

      if (error.message.includes("API key")) {
        errorMessage = "API key de Google inválida o faltante";
        localStorage.removeItem('google_api_key');
        setApiKey('');
        setShowDialog(true);
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const handleGenerateCaption = async () => {
    if (!apiKey.trim()) {
      setShowDialog(true);
      return;
    }

    try {
      await generateCaption.mutateAsync();
    } catch (error) {
      console.error("Error en generación:", error);
    }
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

    try {
      await generateCaption.mutateAsync();
    } catch (error) {
      console.error("Error en submit:", error);
    }
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
        {generateCaption.isPending ? "Generando..." : "Generar Caption"}
      </Button>

      <Dialog 
        open={showDialog} 
        onOpenChange={(open) => {
          // Prevenir que se cierre el diálogo si no hay API key
          if (!open && !apiKey.trim()) {
            return;
          }
          setShowDialog(open);
        }}
      >
        <DialogContent className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 max-w-md w-full mx-4 bg-background p-6 rounded-lg shadow-lg border z-50">
          <DialogHeader>
            <DialogTitle>API Key de Google necesaria</DialogTitle>
            <DialogDescription>
              Para que Akiba pueda crear captions creativos para tus videos, necesita acceso al modelo Gemini de Google.
              Tu API key se guardará de forma segura en tu navegador.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleApiKeySubmit} className="space-y-4 mt-4">
            <Input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Ingresa tu API key de Google"
              className="w-full"
              required
              autoFocus
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
                "Generar Caption"
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}