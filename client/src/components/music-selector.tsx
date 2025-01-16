import { FC, useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { RefreshCw, Play, Pause, SkipBack } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface MusicOption {
  id: string;
  name: string;
  file: string;
  color: string;
}

interface MusicOptions {
  [key: string]: MusicOption[];
}

const MUSIC_OPTIONS: MusicOptions = {
  "Anime & J-Pop": [
    {
      id: "jpop-1",
      name: "Sakura Dreams",
      file: "https://lime-zygomorphic-vicuna-674.mypinata.cloud/ipfs/bafybeih3mms7mj4ajx3mwntpz7t6wqqrc5tno4jjwptfddxqflrwn74brm",
      color: "bg-pink-500"
    },
    {
      id: "jpop-2",
      name: "City Pop Vibes",
      file: "https://lime-zygomorphic-vicuna-674.mypinata.cloud/ipfs/bafybeiedtm3ghqodbgfqbasddtn6hxka3ihytz6dfuscofgbx77ahbzzli",
      color: "bg-blue-400"
    }
  ],
  "Epic & Orchestral": [
    {
      id: "epic-flute",
      name: "Epic Flute",
      file: "https://lime-zygomorphic-vicuna-674.mypinata.cloud/ipfs/bafybeih3mms7mj4ajx3mwntpz7t6wqqrc5tno4jjwptfddxqflrwn74brm",
      color: "bg-red-500"
    },
    {
      id: "fantasy-orchestra",
      name: "Fantasy Orchestra",
      file: "https://lime-zygomorphic-vicuna-674.mypinata.cloud/ipfs/bafybeiedtm3ghqodbgfqbasddtn6hxka3ihytz6dfuscofgbx77ahbzzli",
      color: "bg-purple-500"
    }
  ],
  "Traditional Japanese": [
    {
      id: "trad-1",
      name: "Zen Garden",
      file: "https://lime-zygomorphic-vicuna-674.mypinata.cloud/ipfs/bafybeih3mms7mj4ajx3mwntpz7t6wqqrc5tno4jjwptfddxqflrwn74brm",
      color: "bg-green-500"
    },
    {
      id: "trad-2",
      name: "Koto Dreams",
      file: "https://lime-zygomorphic-vicuna-674.mypinata.cloud/ipfs/bafybeiedtm3ghqodbgfqbasddtn6hxka3ihytz6dfuscofgbx77ahbzzli",
      color: "bg-emerald-500"
    }
  ],
  "Electronic": [
    {
      id: "electronic-1",
      name: "Future Bass",
      file: "https://lime-zygomorphic-vicuna-674.mypinata.cloud/ipfs/bafybeih3mms7mj4ajx3mwntpz7t6wqqrc5tno4jjwptfddxqflrwn74brm",
      color: "bg-cyan-500"
    },
    {
      id: "electronic-2",
      name: "Synthwave Night",
      file: "https://lime-zygomorphic-vicuna-674.mypinata.cloud/ipfs/bafybeiedtm3ghqodbgfqbasddtn6hxka3ihytz6dfuscofgbx77ahbzzli",
      color: "bg-indigo-500"
    }
  ],
  "Lo-fi & Chill": [
    {
      id: "lofi-1",
      name: "Rainy Mood",
      file: "https://lime-zygomorphic-vicuna-674.mypinata.cloud/ipfs/bafybeih3mms7mj4ajx3mwntpz7t6wqqrc5tno4jjwptfddxqflrwn74brm",
      color: "bg-violet-500"
    },
    {
      id: "lofi-2",
      name: "Study Beats",
      file: "https://lime-zygomorphic-vicuna-674.mypinata.cloud/ipfs/bafybeiedtm3ghqodbgfqbasddtn6hxka3ihytz6dfuscofgbx77ahbzzli",
      color: "bg-rose-500"
    }
  ]
};

const DEFAULT_GENRE = "Anime & J-Pop";
const DEFAULT_TRACK = MUSIC_OPTIONS[DEFAULT_GENRE][0].file;
const VIDEO_DURATION = 5; // Duration in seconds

interface MusicSelectorProps {
  selected: string;
  onSelect: (file: string) => void;
}

const MusicSelector: FC<MusicSelectorProps> = ({ selected, onSelect }) => {
  const [currentGenre, setCurrentGenre] = useState(DEFAULT_GENRE);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const { toast } = useToast();

  const handleReset = () => {
    onSelect(DEFAULT_TRACK);
    if (audioRef.current) {
      audioRef.current.currentTime = startTime;
      setCurrentTime(startTime);
    }
  };

  const resetPlayback = () => {
    setIsPlaying(false);
    setIsLoading(false);
    setHasError(false);
  };

  const togglePlayPause = () => {
    if (hasError) {
      if (audioRef.current) {
        audioRef.current.load();
        setHasError(false);
      }
      return;
    }

    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        setIsLoading(true);
        setHasError(false);
        audioRef.current.currentTime = startTime;
        audioRef.current.play().catch((error) => {
          console.error("Audio playback error:", error);
          toast({
            title: "Playback Error",
            description: "Failed to play the audio track. Please try again.",
            variant: "destructive",
          });
          resetPlayback();
        });
      }
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const time = audioRef.current.currentTime;
      setCurrentTime(time);

      if (time >= startTime + VIDEO_DURATION) {
        audioRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  const handleSliderChange = (value: number[]) => {
    const newStartTime = value[0];
    setStartTime(newStartTime);
    if (audioRef.current) {
      audioRef.current.currentTime = newStartTime;
      setCurrentTime(newStartTime);
    }
  };

  // Reset audio when selected track changes
  useEffect(() => {
    resetPlayback();
    if (audioRef.current) {
      audioRef.current.currentTime = startTime;
      audioRef.current.load();
    }
  }, [selected]);

  return (
    <div className="space-y-8" onClick={(e) => e.stopPropagation()}>
      {/* Genre Selector */}
      <div className="relative z-20">
        <Select
          value={currentGenre}
          onValueChange={(value) => {
            setCurrentGenre(value);
            // Select first track of the new genre by default
            const firstTrack = MUSIC_OPTIONS[value][0].file;
            onSelect(firstTrack);
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a genre" />
          </SelectTrigger>
          <SelectContent>
            {Object.keys(MUSIC_OPTIONS).map((genre) => (
              <SelectItem key={genre} value={genre}>
                {genre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Track Selection Wheel */}
      <div className="relative w-[400px] h-[400px] mx-auto">
        {MUSIC_OPTIONS[currentGenre].map((option, index) => {
          const totalItems = MUSIC_OPTIONS[currentGenre].length;
          const angle = (index / totalItems) * 2 * Math.PI;
          const radius = 150;
          const x = radius * Math.cos(angle);
          const y = radius * Math.sin(angle);

          return (
            <motion.button
              key={option.id}
              onClick={() => onSelect(option.file)}
              className={cn(
                "absolute w-20 h-20 rounded-full retro-container transform -translate-x-1/2 -translate-y-1/2",
                "hover:scale-110 transition-transform duration-200 cursor-pointer",
                "flex items-center justify-center text-center text-sm font-bold text-white",
                "shadow-lg hover:shadow-xl",
                option.color,
                selected === option.file && "ring-4 ring-white ring-opacity-50 scale-110"
              )}
              style={{
                left: "50%",
                top: "50%",
                transform: `translate(${x}px, ${y}px)`,
              }}
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="glow-text px-2">{option.name}</span>
            </motion.button>
          );
        })}

        {/* Central Play Controls */}
        <div className="absolute left-1/2 top-1/2 w-32 h-32 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/20 retro-container flex flex-col items-center justify-center gap-2">
          <span className="text-sm font-bold text-primary glow-text">Preview</span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={togglePlayPause}
              className="h-8 w-8 p-0"
              disabled={isLoading}
            >
              {isPlaying ? (
                <Pause className="h-4 w-4" />
              ) : hasError ? (
                <RefreshCw className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleReset}
              className="h-8 w-8 p-0"
            >
              <SkipBack className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Time Slider */}
      <div className="w-full max-w-md mx-auto space-y-2">
        <Slider
          value={[startTime]}
          min={0}
          max={audioRef.current?.duration || 30}
          step={0.1}
          onValueChange={handleSliderChange}
          className="w-full"
        />
        <div className="text-sm text-center text-muted-foreground">
          Start Time: {startTime.toFixed(1)}s
        </div>
      </div>

      {/* Hidden Audio Element */}
      <audio
        ref={audioRef}
        src={selected}
        onTimeUpdate={handleTimeUpdate}
        onEnded={() => setIsPlaying(false)}
        onLoadedMetadata={() => {
          if (audioRef.current) {
            audioRef.current.currentTime = startTime;
          }
        }}
        onLoadStart={() => {
          setIsLoading(true);
          setHasError(false);
        }}
        onCanPlay={() => {
          setIsLoading(false);
          if (isPlaying) {
            audioRef.current?.play().catch(() => {
              resetPlayback();
            });
          }
        }}
        onError={(e) => {
          console.error("Audio error:", e);
          setIsLoading(false);
          setIsPlaying(false);
          setHasError(true);
          toast({
            title: "Error",
            description: "Failed to load the audio track. Please try another one or retry.",
            variant: "destructive",
          });
        }}
      />
    </div>
  );
};

export default MusicSelector;