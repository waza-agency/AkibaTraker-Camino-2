import { FC, useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { RefreshCw, Play, Pause, SkipBack } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

const MUSIC_OPTIONS = [
  { 
    id: "epic-flute", 
    name: "Epic Flute", 
    file: "https://lime-zygomorphic-vicuna-674.mypinata.cloud/ipfs/bafybeih3mms7mj4ajx3mwntpz7t6wqqrc5tno4jjwptfddxqflrwn74bzzli", 
    color: "bg-red-500" 
  },
  { 
    id: "fantasy-orchestra", 
    name: "Fantasy Orchestra", 
    file: "https://lime-zygomorphic-vicuna-674.mypinata.cloud/ipfs/bafybeiedtm3ghqodbgfqbasddtn6hxka3ihytz6dfuscofgbx77ahbzzli", 
    color: "bg-blue-500" 
  },
];

const DEFAULT_TRACK = MUSIC_OPTIONS[0].file;
const VIDEO_DURATION = 5; // Duration in seconds

interface MusicSelectorProps {
  selected: string;
  onSelect: (file: string) => void;
}

const MusicSelector: FC<MusicSelectorProps> = ({ selected, onSelect }) => {
  const radius = 150;
  const totalItems = MUSIC_OPTIONS.length;
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  const handleReset = () => {
    onSelect(DEFAULT_TRACK);
    if (audioRef.current) {
      audioRef.current.currentTime = startTime;
      setCurrentTime(startTime);
    }
  };

  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.currentTime = startTime;
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const time = audioRef.current.currentTime;
      setCurrentTime(time);

      // Stop if we've played 5 seconds from the start time
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

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = startTime;
    }
  }, [selected]);

  return (
    <div className="space-y-8">
      <div className="relative w-[400px] h-[400px] mx-auto">
        {MUSIC_OPTIONS.map((option, index) => {
          const angle = (index / totalItems) * 2 * Math.PI;
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

        <div className="absolute left-1/2 top-1/2 w-32 h-32 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/20 retro-container flex flex-col items-center justify-center gap-2">
          <span className="text-sm font-bold text-primary glow-text">Preview</span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={togglePlayPause}
              className="h-8 w-8 p-0"
            >
              {isPlaying ? (
                <Pause className="h-4 w-4" />
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
      />
    </div>
  );
};

export default MusicSelector;