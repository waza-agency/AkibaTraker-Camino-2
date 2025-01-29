import { useState } from 'react';
import { MusicSelector } from "./music-selector";
import { Label } from "./ui/label";

interface FormData {
  musicFile: string;
  // ... add other form fields as needed
}

export function VideoForm() {
  const [formData, setFormData] = useState<FormData>({
    musicFile: '',
    // ... initialize other form fields
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Add your form submission logic here
  };

  const handleMusicSelect = async ({ song, startTime, endTime }) => {
    try {
      const response = await fetch('/api/trim-audio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sourceUrl: song.storageUrl,
          startTime,
          endTime
        }),
      });

      if (!response.ok) throw new Error('Failed to trim audio');
      
      const { trimmedAudioUrl } = await response.json();
      
      setFormData(prev => ({
        ...prev,
        musicFile: trimmedAudioUrl
      }));
    } catch (error) {
      console.error('Error trimming audio:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* ... other form fields ... */}
      
      <div className="space-y-2">
        <Label>Background Music</Label>
        <MusicSelector onSelect={handleMusicSelect} />
      </div>

      {/* ... rest of the form ... */}
    </form>
  );
} 