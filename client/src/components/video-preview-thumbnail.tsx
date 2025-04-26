import { FC, useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { normalizeUrl } from "@/lib/uri-utils";

interface VideoPreviewThumbnailProps {
  src: string;
  className?: string;
}

const VideoPreviewThumbnail: FC<VideoPreviewThumbnailProps> = ({
  src,
  className
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sanitizedSrc, setSanitizedSrc] = useState<string>('');

  useEffect(() => {
    try {
      // Sanitize URL to prevent malformed URI issues
      if (!src) {
        setSanitizedSrc('');
        setError("No video source provided");
        setIsLoading(false);
        return;
      }

      // Use our utility function to normalize the URL
      const normalizedUrl = normalizeUrl(src);
      
      if (normalizedUrl) {
        setSanitizedSrc(normalizedUrl);
      } else {
        setError("Invalid video URL");
        setIsLoading(false);
      }
    } catch (e) {
      console.error("Error sanitizing video URL:", e, src);
      setError("Invalid video URL");
      setIsLoading(false);
    }
  }, [src]);

  return (
    <div className={`relative group ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      )}
      
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-destructive/10">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}
      
      {sanitizedSrc && (
        <video 
          src={sanitizedSrc}
          className="w-full h-full object-cover"
          controls
          muted
          playsInline
          onLoadedData={() => setIsLoading(false)}
          onError={(e) => {
            console.error("Video load error:", e);
            setIsLoading(false);
            setError("Failed to load video");
          }}
        />
      )}
    </div>
  );
};

export default VideoPreviewThumbnail;