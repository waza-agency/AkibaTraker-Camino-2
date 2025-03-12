import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Image } from "lucide-react";
import StyleSelector from "./style-selector";
import { MusicSelector } from "./music-selector";
import { useState, useCallback } from "react";
import { LogConsole } from './log-console';
import { translations } from "@/lib/translations";

interface UploadFormProps {
  onSubmit: (data: { prompt: string; style: string; music: string; musicStartTime?: number; musicEndTime?: number }) => void;
  isLoading: boolean;
}

export default function UploadForm({ onSubmit, isLoading }: UploadFormProps) {
  const [selectedStyle, setSelectedStyle] = useState("dramatic");
  const [selectedMusic, setSelectedMusic] = useState<{
    url: string;
    startTime?: number;
    endTime?: number;
  }>({ url: "" });
  const [logs, setLogs] = useState<Array<{
    message: string;
    timestamp: string;
    type: 'info' | 'error' | 'success';
  }>>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const form = useForm({
    defaultValues: {
      prompt: "",
    },
  });

  const addLog = useCallback((message: string, type: 'info' | 'error' | 'success' = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { message, timestamp, type }]);
  }, []);

  const handleMusicSelect = async (songData: { 
    song: any; 
    startTime: number; 
    endTime: number 
  }) => {
    try {
      addLog(`${translations.logs.selectingMusic}: ${songData.song.title}`);
      addLog(`${translations.logs.timeSegment}: ${songData.startTime}s to ${songData.endTime}s`);

      const response = await fetch('/api/audio/trim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceUrl: songData.song.storageUrl,
          startTime: songData.startTime,
          endTime: songData.endTime
        }),
      });

      if (!response.ok) throw new Error('Failed to trim audio');
      
      const { trimmedAudioUrl } = await response.json();
      addLog(translations.logs.audioTrimmed, 'success');
      
      setSelectedMusic({
        url: trimmedAudioUrl,
        startTime: songData.startTime,
        endTime: songData.endTime
      });
    } catch (error) {
      console.error('Error trimming audio:', error);
      addLog(`${translations.general.error}: ${error instanceof Error ? error.message : translations.logs.failedToTrimAudio}`, 'error');
    }
  };

  const handleFormSubmit = (data: { prompt: string }) => {
    if (!selectedMusic.url) {
      addLog(translations.logs.noMusicSelected, 'error');
      return;
    }

    onSubmit({
      prompt: data.prompt,
      style: selectedStyle,
      music: selectedMusic.url,
      musicStartTime: selectedMusic.startTime,
      musicEndTime: selectedMusic.endTime
    });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">{translations.upload.title}</h2>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="prompt"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{translations.upload.prompt}</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder={translations.upload.promptPlaceholder}
                    className="min-h-[100px]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="space-y-2">
            <FormLabel>{translations.upload.style}</FormLabel>
            <StyleSelector selected={selectedStyle} onSelect={setSelectedStyle} />
          </div>

          <div className="space-y-2">
            <FormLabel>{translations.upload.music}</FormLabel>
            <MusicSelector onSelect={handleMusicSelect} addLog={addLog} />
          </div>

          <Button type="submit" disabled={isLoading || isProcessing || !selectedMusic.url}>
            {isLoading || isProcessing ? translations.upload.generating : translations.upload.generate}
          </Button>
        </form>
      </Form>

      <LogConsole logs={logs} isProcessing={isProcessing} />
    </div>
  );
}