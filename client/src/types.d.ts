interface MusicTrack {
  id: number;
  title: string;
  artist: string;
  mood: string;
  storageUrl: string;
}

interface Video {
  id: number;
  prompt: string;
  status: string;
  outputUrl?: string;
  // ... other fields ...
} 