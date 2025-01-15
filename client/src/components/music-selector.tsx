import { FC, useState } from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const MUSIC_OPTIONS = [
  { id: "epic", name: "Epic Orchestra", file: "epic.mp3", color: "bg-red-500" },
  { id: "lofi", name: "Lo-fi Beats", file: "lofi.mp3", color: "bg-blue-500" },
  { id: "jpop", name: "J-Pop", file: "jpop.mp3", color: "bg-green-500" },
  { id: "rock", name: "Rock", file: "rock.mp3", color: "bg-purple-500" },
  { id: "synthwave", name: "Synthwave", file: "synthwave.mp3", color: "bg-pink-500" },
  { id: "classical", name: "Classical", file: "classical.mp3", color: "bg-yellow-500" },
];

interface MusicSelectorProps {
  selected: string;
  onSelect: (file: string) => void;
}

const MusicSelector: FC<MusicSelectorProps> = ({ selected, onSelect }) => {
  const radius = 150; // Radius of the circle
  const totalItems = MUSIC_OPTIONS.length;

  return (
    <div className="relative w-[400px] h-[400px] mx-auto my-8">
      {MUSIC_OPTIONS.map((option, index) => {
        // Calculate position in the circle
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

      {/* Center circle */}
      <div className="absolute left-1/2 top-1/2 w-24 h-24 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/20 retro-container flex items-center justify-center">
        <span className="text-sm font-bold text-primary glow-text">Select Track</span>
      </div>
    </div>
  );
};

export default MusicSelector;