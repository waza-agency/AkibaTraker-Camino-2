export const stylePresets = {
  dramatic: "Dramatic and intense Anime scenes with high contrast",
  romantic: "Soft and emotional Anime scenes with warm colors", 
  action: "Fast-paced Anime action sequences with dynamic transitions",
  aesthetic: "Aesthetic and dreamy Anime scenes with pastel colors",
  retro: "Retro Anime style with film grain effect",
} as const;

export type StylePresetKey = keyof typeof stylePresets; 