import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface LoadingSpinnerProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

const sizes = {
  sm: "w-8 h-8",
  md: "w-12 h-12",
  lg: "w-16 h-16",
};

export function LoadingSpinner({ className, size = "md" }: LoadingSpinnerProps) {
  return (
    <div className={cn("flex items-center justify-center", className)}>
      <motion.div
        className={cn(
          "relative retro-container",
          sizes[size]
        )}
        animate={{
          rotate: 360,
        }}
        transition={{
          duration: 2,
          ease: "linear",
          repeat: Infinity,
        }}
      >
        {/* Pixel art loading spinner segments */}
        {[0, 90, 180, 270].map((rotation) => (
          <motion.div
            key={rotation}
            className="absolute w-3 h-3 bg-primary"
            style={{
              rotate: rotation,
              transformOrigin: "50% 50%",
            }}
            animate={{
              opacity: [0.2, 1, 0.2],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: rotation / 360,
            }}
          />
        ))}
      </motion.div>
    </div>
  );
}
