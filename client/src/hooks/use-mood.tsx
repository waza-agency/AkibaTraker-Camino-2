import { createContext, useContext, useState, ReactNode } from "react";
import { type Mood } from "@/components/mood-indicator";

interface MoodContextType {
  currentMood: Mood;
  setMood: (mood: Mood) => void;
}

const MoodContext = createContext<MoodContextType | undefined>(undefined);

export function MoodProvider({ children }: { children: ReactNode }) {
  const [currentMood, setCurrentMood] = useState<Mood>("energetic");

  return (
    <MoodContext.Provider value={{ currentMood, setMood: setCurrentMood }}>
      {children}
    </MoodContext.Provider>
  );
}

export function useMood() {
  const context = useContext(MoodContext);
  if (context === undefined) {
    throw new Error("useMood must be used within a MoodProvider");
  }
  return context;
}
