import { createContext, useContext, useState, ReactNode } from "react";
import { type Mood } from "@/components/mood-indicator";

interface MoodContextType {
  currentMood: Mood;
  setMood: (mood: Mood) => void;
}

const MoodContext = createContext<MoodContextType | undefined>(undefined);

export function MoodProvider({ children }: { children: ReactNode }) {
  const [currentMood, setCurrentMood] = useState<Mood>("energetic");

  const value = {
    currentMood,
    setMood: setCurrentMood
  };

  return (
    <MoodContext.Provider value={value}>
      {children}
    </MoodContext.Provider>
  );
}

export function useMood(): MoodContextType {
  const context = useContext(MoodContext);
  if (context === undefined) {
    throw new Error("useMood must be used within a MoodProvider");
  }
  return context;
}