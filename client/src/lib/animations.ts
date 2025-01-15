import { Variants } from "framer-motion";

// Pixel-style fade in animation
export const pixelFadeIn: Variants = {
  initial: {
    opacity: 0,
    scale: 0.9,
    filter: "blur(5px)",
  },
  animate: {
    opacity: 1,
    scale: 1,
    filter: "blur(0px)",
    transition: {
      duration: 0.3,
      ease: "easeOut",
    },
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    filter: "blur(5px)",
    transition: {
      duration: 0.2,
    },
  },
};

// 8-bit bounce effect
export const retroBounce: Variants = {
  initial: { y: 0 },
  animate: {
    y: [-4, 0, -2, 0],
    transition: {
      duration: 0.5,
      times: [0, 0.4, 0.7, 1],
      repeat: Infinity,
      repeatType: "reverse",
    },
  },
};

// Retro slide in from side
export const retroSlide: Variants = {
  initial: { x: -20, opacity: 0 },
  animate: {
    x: 0,
    opacity: 1,
    transition: {
      duration: 0.3,
      ease: [0.17, 0.67, 0.83, 0.67], // Pixelated easing
    },
  },
};

// Game menu selection animation
export const menuSelect: Variants = {
  initial: { x: 0, scale: 1 },
  hover: {
    x: 10,
    scale: 1.02,
    transition: {
      duration: 0.2,
      ease: "easeInOut",
    },
  },
  tap: {
    scale: 0.95,
    transition: {
      duration: 0.1,
    },
  },
};
