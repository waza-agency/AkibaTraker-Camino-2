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
      addLog(`Selecting music: ${songData.song.title}`);
      addLog(`Time segment: ${songData.startTime}s to ${songData.endTime}s`);

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
      addLog('Audio segment trimmed successfully', 'success');
      
      setSelectedMusic({
        url: trimmedAudioUrl,
        startTime: songData.startTime,
        endTime: songData.endTime
      });
    } catch (error) {
      console.error('Error trimming audio:', error);
      addLog(`Error: ${error instanceof Error ? error.message : 'Failed to trim audio'}`, 'error');
    }
  };

  const handleSubmit = async (data: { prompt: string }) => {
    if (!selectedMusic.url) {
      addLog('No music selected!', 'error');
      return;
    }

    setIsProcessing(true);
    addLog('Starting video generation process...', 'info');
    addLog(`Prompt: ${data.prompt}`, 'info');
    addLog(`Style: ${selectedStyle}`, 'info');
    addLog(`Music: ${selectedMusic.url}`, 'info');

    try {
      const response = await fetch('/api/videos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: data.prompt,
          style: selectedStyle,
          music: selectedMusic.url,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const responseData = await response.json();
      
      if (!responseData.id) {
        throw new Error('No video ID received from server');
      }

      addLog(`Video generation started with ID: ${responseData.id}`, 'info');

      const pollInterval = setInterval(async () => {
        try {
          console.log('Polling status for video:', responseData.id);
          
          const statusResponse = await fetch(`/api/videos/${responseData.id}/status`, {
            headers: {
              'Accept': 'application/json'
            }
          });

          console.log('Status response:', {
            ok: statusResponse.ok,
            status: statusResponse.status,
            contentType: statusResponse.headers.get('content-type')
          });

          if (!statusResponse.ok) {
            const errorText = await statusResponse.text();
            console.error('Status response error:', {
              status: statusResponse.status,
              statusText: statusResponse.statusText,
              body: errorText
            });
            throw new Error(`Status fetch failed: ${statusResponse.status} ${statusResponse.statusText}`);
          }

          if (!statusResponse.headers.get('content-type')?.includes('application/json')) {
            throw new Error('Invalid response format from status endpoint');
          }

          const statusData = await statusResponse.json();
          console.log('Received status:', statusData);

          if (!statusData) {
            throw new Error('Empty response from status endpoint');
          }

          switch(statusData.status) {
            case 'pending':
              addLog('Waiting for video generation to start...', 'info');
              break;
            case 'generating':
              addLog(`Generating video: ${statusData.progress || 0}%`, 'info');
              break;
            case 'ready_for_audio':
              addLog('Video generated, starting audio integration...', 'info');
              try {
                const audioResponse = await fetch(`/api/videos/${responseData.id}/integrate-audio`, {
                  method: 'POST'
                });
                if (!audioResponse.ok) {
                  throw new Error('Failed to start audio integration');
                }
              } catch (error) {
                console.error('Audio integration error:', error);
                addLog('Failed to start audio integration', 'error');
              }
              break;
            case 'merging':
              addLog(`Merging audio: ${statusData.progress || 0}%`, 'info');
              break;
            case 'completed':
              addLog('Video generation completed!', 'success');
              clearInterval(pollInterval);
              setIsProcessing(false);
              break;
            case 'failed':
              const errorMessage = statusData.error || 'Unknown error';
              addLog(`Failed: ${errorMessage}`, 'error');
              console.error('Video generation failed:', errorMessage);
              clearInterval(pollInterval);
              setIsProcessing(false);
              break;
            default:
              addLog(`Unknown status: ${statusData.status}`, 'warning');
          }
        } catch (error) {
          console.error('Error polling status:', error);
          addLog(`Error checking status: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
          clearInterval(pollInterval);
          setIsProcessing(false);
        }
      }, 2000);

      // Cleanup on component unmount
      return () => {
        if (pollInterval) {
          clearInterval(pollInterval);
        }
      };

    } catch (error) {
      console.error('Error submitting video:', error);
      addLog(`Error: ${error instanceof Error ? error.message : 'Failed to generate video'}`, 'error');
      setIsProcessing(false);
    }
  };

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
          <MusicSelector onSelect={handleMusicSelect} addLog={addLog} />
        </div>

        <div>
          <FormLabel>Visual Style</FormLabel>
          <StyleSelector
            selected={selectedStyle}
            onSelect={setSelectedStyle}
          />
        </div>

        <LogConsole logs={logs} isProcessing={isProcessing} />

        <Button
          type="submit"
          className="w-full retro-btn"
          disabled={isLoading || isProcessing}
        >
          <Image className="mr-2 h-4 w-4" />
          {isLoading || isProcessing ? (
            <span className="retro-loading">Generating...</span>
          ) : (
            "Generate AMV"
          )}
        </Button>
      </form>
    </Form>
  );
}