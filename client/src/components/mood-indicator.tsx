import { FC } from "react";
import { motion, AnimatePresence } from "framer-motion";

export type Mood = "happy" | "energetic" | "calm" | "serious" | "kawaii" | "bored";

interface Props {
  mood: Mood;
  className?: string;
  hideVideo?: boolean;
}

const moodColors: Record<Mood, string> = {
  happy: "#FFD700",     // Gold
  energetic: "#FF4500", // Red-Orange
  calm: "#4169E1",      // Royal Blue
  serious: "#800080",   // Purple
  kawaii: "#FF69B4",    // Hot Pink
  bored: "#808080"      // Gray
};

const moodEmojis: Record<Mood, string> = {
  happy: "😊",
  energetic: "⚡",
  calm: "😌",
  serious: "🤔",
  kawaii: "✨",
  bored: "😑"
};

const moodAnimations: Record<Mood, any> = {
  happy: {
    initial: { scale: 0.8, opacity: 0 },
    animate: { 
      scale: [1, 1.2, 1],
      rotate: [0, 10, -10, 0],
      opacity: 1
    },
    exit: { scale: 0.8, opacity: 0 },
    transition: { duration: 0.5 }
  },
  energetic: {
    initial: { scale: 0.8, opacity: 0 },
    animate: { 
      scale: [1, 1.3, 0.9, 1],
      opacity: 1
    },
    exit: { scale: 0.8, opacity: 0 },
    transition: { duration: 0.3 }
  },
  calm: {
    initial: { scale: 0.8, opacity: 0 },
    animate: { 
      opacity: [0.6, 1, 0.6],
      scale: [0.95, 1, 0.95]
    },
    exit: { scale: 0.8, opacity: 0 },
    transition: { duration: 0.7 }
  },
  serious: {
    initial: { scale: 0.8, opacity: 0 },
    animate: { 
      scale: [1, 1.05, 1],
      opacity: 1
    },
    exit: { scale: 0.8, opacity: 0 },
    transition: { duration: 0.4 }
  },
  kawaii: {
    initial: { scale: 0.8, opacity: 0 },
    animate: { 
      scale: [1, 1.1, 1],
      rotate: [0, 5, -5, 0],
      opacity: 1
    },
    exit: { scale: 0.8, opacity: 0 },
    transition: { duration: 0.5 }
  },
  bored: {
    initial: { scale: 0.8, opacity: 0 },
    animate: { 
      scale: [1, 0.95, 1],
      opacity: [1, 0.7, 1]
    },
    exit: { scale: 0.8, opacity: 0 },
    transition: { duration: 0.8 }
  }
};

const videoUrls: Record<Mood, string> = {
  happy: "https://lime-zygomorphic-vicuna-674.mypinata.cloud/ipfs/bafybeicu5vjdynha335bgy33ma4xl66worzexkji7yluongayvqkfyb3xi",
  energetic: "",
  calm: "",
  serious: "",
  kawaii: "",
  bored: "https://lime-zygomorphic-vicuna-674.mypinata.cloud/ipfs/bafybeiag5zwawnbbdvjbrjmxorpobfyiuc2ncqr7azgylbuhpfrwcjaaha"
};

export const MoodIndicator: FC<Props> = ({ mood, className = "", hideVideo = false }) => {
  const videoSrc = !hideVideo ? videoUrls[mood] : undefined;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <AnimatePresence mode="wait">
        <motion.div
          key={mood}
          initial="initial"
          animate="animate"
          exit="exit"
          variants={moodAnimations[mood]}
          className="flex items-center gap-1 px-3 py-1 rounded-full border border-[#ffffff33] shadow-glow"
          style={{ 
            backgroundColor: `${moodColors[mood]}15`,
            boxShadow: `0 0 10px ${moodColors[mood]}33`
          }}
        >
          {videoSrc && (
            <video 
              src={videoSrc} 
              autoPlay 
              loop 
              muted 
              className="w-12 h-12 object-cover rounded-full"
            />
          )}
          <motion.span 
            className="text-lg"
            role="img" 
            aria-label={`${mood} emoji`}
            animate={{
              scale: [1, 1.2, 1],
              transition: { duration: 0.5, repeat: Infinity }
            }}
          >
            {moodEmojis[mood]}
          </motion.span>
          <motion.span 
            className="text-sm font-medium capitalize"
            style={{ color: moodColors[mood] }}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.3 }}
          >
            {mood}
          </motion.span>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};