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
  const [apiKey, setApiKey] = useState<string>("");
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
          "x-google-api-key": apiKey
        },
        body: JSON.stringify({ prompt }),
        credentials: "include"
      });

      if (!res.ok) {
        const errorData = await res.text();
        throw new Error(errorData || "Error al generar el subtítulo");
      }

      const data = await res.json();
      return data.caption;
    },
    onSuccess: (caption) => {
      if (caption) {
        onCaptionGenerated?.(caption);
        toast({
          title: "¡Éxito!",
          description: "¡Subtítulo generado correctamente!",
        });
        setShowDialog(false);
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al generar el subtítulo",
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
      console.error("Error al generar subtítulo:", error);
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
      console.error("Error al generar subtítulo después de ingresar API key:", error);
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
        {generateCaption.isPending ? "Generando..." : "Generar Subtítulo"}
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ingresa tu API Key de Google</DialogTitle>
            <DialogDescription>
              Para generar subtítulos con el estilo de Akiba, necesitas una API key de Google para el modelo Gemini.
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