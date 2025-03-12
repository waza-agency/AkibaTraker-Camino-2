import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, ChevronRight, Play, Pause } from "lucide-react";
import { Card } from "@/components/ui/card";
import ReactPlayer from "react-player";

interface Song {
  id: number;
  title: string;
  artist: string;
  mood: string;
  storageUrl: string;
}

interface MusicSelectorProps {
  onSelect: (data: { song: Song; startTime: number; endTime: number }) => void;
  addLog?: (message: string, type?: 'info' | 'error' | 'success') => void;
}

// Helper function to get proper URL for IPFS content
function getProperUrl(url: string): string {
  if (!url) return '';
  
  console.log('Original URL:', url);
  
  // If it's already a gateway URL, return as is
  if (url.startsWith('http')) {
    // Use cloudflare gateway instead of ipfs.io for better reliability
    if (url.includes('ipfs.io')) {
      const newUrl = url.replace('ipfs.io', 'cloudflare-ipfs.com');
      console.log('Using Cloudflare gateway:', newUrl);
      return newUrl;
    }
    console.log('Using direct HTTP URL:', url);
    return url;
  }
  
  // If it's a bare CID (no protocol or path)
  if (url.match(/^[a-zA-Z0-9]{46,59}$/)) {
    const gatewayUrl = `https://cloudflare-ipfs.com/ipfs/${url}`;
    console.log('Converted CID:', url, 'to:', gatewayUrl);
    return gatewayUrl;
  }
  
  // Handle IPFS protocol URLs
  if (url.startsWith('ipfs://')) {
    const cid = url.replace('ipfs://', '');
    const gatewayUrl = `https://cloudflare-ipfs.com/ipfs/${cid}`;
    console.log('Converted IPFS URL:', url, 'to:', gatewayUrl);
    return gatewayUrl;
  }

  // Handle IPFS paths
  if (url.startsWith('/ipfs/')) {
    const cid = url.replace('/ipfs/', '');
    const gatewayUrl = `https://cloudflare-ipfs.com/ipfs/${cid}`;
    console.log('Converted IPFS path:', url, 'to:', gatewayUrl);
    return gatewayUrl;
  }

  // If none of the above, assume it's a CID
  const gatewayUrl = `https://cloudflare-ipfs.com/ipfs/${url}`;
  console.log('Using URL as CID:', url, 'to:', gatewayUrl);
  return gatewayUrl;
}

export function MusicSelector({ onSelect, addLog }: MusicSelectorProps) {
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [startTime, setStartTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPlayingFull, setIsPlayingFull] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isTrimming, setIsTrimming] = useState(false);
  const playerRef = useRef<ReactPlayer>(null);
  const TEN_SECONDS = 10;
  const { toast } = useToast();

  useEffect(() => {
    const fetchSongs = async () => {
      try {
        // Hardcode the song for now since we're having database issues
        const hardcodedSongs = [{
          id: 1,
          title: "Pon Pon Pon",
          artist: "Kyary Pamyu Pamyu",
          mood: "Party",
          storageUrl: "https://lime-zygomorphic-vicuna-674.mypinata.cloud/ipfs/bafybeiexrz2iyivgepluiurdcfbfgtctfcdkwggv4ec3b3suumkrwk6k5i"
        }];
        
        setSongs(hardcodedSongs);
        setLoading(false);
        addLog?.('Music library loaded successfully', 'success');
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load music library",
          variant: "destructive",
        });
        console.error("Error loading songs:", error);
        addLog?.('Failed to load music library', 'error');
        setLoading(false);
      }
    };

    fetchSongs();
  }, [toast, addLog]);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % songs.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + songs.length) % songs.length);
  };

  const handleSongSelect = (song: Song) => {
    console.log("Selected song:", song);
    setSelectedSong(song);
    setStartTime(0);
    setIsPlaying(false);
    setIsPlayingFull(false);
    addLog?.(`Selected song: ${song.title} by ${song.artist}`, 'info');
  };

  const handleConfirm = async () => {
    if (!selectedSong) {
      toast({
        title: "Error",
        description: "Please select a song first",
        variant: "destructive",
      });
      return;
    }

    setIsPlaying(false);
    setIsPlayingFull(false);
    setIsTrimming(true);

    try {
      // Call the trim endpoint
      const response = await fetch('/api/audio/trim', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sourceUrl: selectedSong.storageUrl,
          startTime: startTime,
          endTime: startTime + TEN_SECONDS
        })
      });

      if (!response.ok) {
        throw new Error('Failed to trim audio');
      }

      const data = await response.json();
      console.log("Trim response:", data);

      // Pass the trimmed audio URL to the parent component
      onSelect({
        song: selectedSong,
        startTime: startTime,
        endTime: startTime + TEN_SECONDS
      });

      addLog?.(`Confirmed music segment: ${selectedSong.title}`, 'success');
      addLog?.(`Time range: ${startTime}s to ${startTime + TEN_SECONDS}s`, 'info');

    } catch (error) {
      console.error('Error trimming audio:', error);
      toast({
        title: "Error",
        description: "Failed to trim audio segment",
        variant: "destructive",
      });
    } finally {
      setIsTrimming(false);
    }
  };

  const togglePreview = () => {
    if (!selectedSong) return;
    
    if (isPlaying) {
      setIsPlaying(false);
      addLog?.('Preview stopped', 'info');
    } else {
      setIsPlayingFull(false);
      setIsPlaying(true);
      if (playerRef.current) {
        playerRef.current.seekTo(startTime, 'seconds');
      }
      addLog?.('Previewing segment...', 'info');
    }
  };

  const toggleFullPlay = () => {
    if (!selectedSong) return;
    
    if (isPlayingFull) {
      setIsPlayingFull(false);
      addLog?.('Stopped full song', 'info');
    } else {
      setIsPlaying(false);
      setIsPlayingFull(true);
      if (playerRef.current) {
        playerRef.current.seekTo(0, 'seconds');
      }
      addLog?.('Playing full song...', 'info');
    }
  };

  const handleDuration = (duration: number) => {
    console.log("Audio duration:", duration);
    setDuration(duration);
  };

  const handleProgress = (state: { playedSeconds: number }) => {
    console.log("Playback progress:", state.playedSeconds);
    if (isPlaying && state.playedSeconds >= startTime + TEN_SECONDS) {
      setIsPlaying(false);
      if (playerRef.current) {
        playerRef.current.seekTo(startTime, 'seconds');
      }
    }
  };

  const handleSliderChange = (values: number[]) => {
    const newStartTime = values[0];
    console.log("Slider changed to:", newStartTime);
    setStartTime(newStartTime);
    if (playerRef.current) {
      playerRef.current.seekTo(newStartTime, 'seconds');
    }
  };

  if (loading) {
    return <div className="text-center p-4">Loading music library...</div>;
  }

  const currentUrl = selectedSong ? getProperUrl(selectedSong.storageUrl) : '';
  console.log("Current audio URL:", currentUrl);

  return (
    <div className="space-y-4">
      <div className="relative">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePrev}
            className="absolute left-0 z-10"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>

          <div className="flex overflow-hidden mx-8">
            <div 
              className="flex transition-transform duration-300 ease-in-out"
              style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
              {songs.map((song) => (
                <Card
                  key={song.id}
                  className={`flex-shrink-0 w-64 p-4 m-2 cursor-pointer transition-all ${
                    selectedSong?.id === song.id 
                      ? 'ring-2 ring-primary' 
                      : 'hover:ring-2 hover:ring-primary/50'
                  }`}
                  onClick={() => handleSongSelect(song)}
                >
                  <h3 className="font-bold">{song.title}</h3>
                  <p className="text-sm text-muted-foreground">{song.artist}</p>
                  <p className="text-xs text-muted-foreground mt-1">Mood: {song.mood}</p>
                </Card>
              ))}
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleNext}
            className="absolute right-0 z-10"
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
        </div>
      </div>

      {selectedSong && (
        <div className="space-y-4 p-4 bg-secondary/50 rounded-lg mt-4">
          <div className="space-y-2">
            <Label>Preview Controls</Label>
            <div className="flex space-x-2">
              <Button onClick={togglePreview} disabled={isTrimming}>
                {isPlaying ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
                {isPlaying ? 'Stop Preview' : 'Preview Segment'}
              </Button>
              <Button onClick={toggleFullPlay} disabled={isTrimming}>
                {isPlayingFull ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
                {isPlayingFull ? 'Stop Full Song' : 'Play Full Song'}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Segment Start Time: {startTime.toFixed(1)}s</Label>
            <Slider
              value={[startTime]}
              min={0}
              max={Math.max(0, duration - TEN_SECONDS)}
              step={0.1}
              onValueChange={handleSliderChange}
              disabled={isTrimming}
            />
          </div>

          <Button 
            onClick={handleConfirm} 
            className="w-full"
            disabled={isTrimming}
          >
            {isTrimming ? 'Trimming...' : 'Confirm This Segment'}
          </Button>

          <ReactPlayer
            ref={playerRef}
            url={currentUrl}
            playing={isPlaying || isPlayingFull}
            onDuration={handleDuration}
            onProgress={handleProgress}
            onError={(e) => {
              console.error("Player error:", e);
              addLog?.(`Error playing audio: ${e}`, 'error');
              toast({
                title: "Playback Error",
                description: "Failed to play audio. Please try another song or refresh the page.",
                variant: "destructive",
              });
            }}
            width="0"
            height="0"
            config={{
              file: {
                forceAudio: true,
                attributes: {
                  crossOrigin: "anonymous"
                },
                forceVideo: false
              }
            }}
          />
        </div>
      )}
    </div>
  );
}