import { translations } from "./translations";

export const stylePresets = {
  dramatic: translations.styles.dramatic.description,
  romantic: translations.styles.romantic.description,
  action: translations.styles.action.description,
  aesthetic: translations.styles.aesthetic.description,
  retro: translations.styles.retro.description,
} as const;

export type StylePresetKey = keyof typeof stylePresets; 