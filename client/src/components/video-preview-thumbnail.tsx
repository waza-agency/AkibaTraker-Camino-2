import { FC, useState } from "react";
import { Loader2 } from "lucide-react";

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
      
      <video 
        src={src}
        className="w-full h-full object-cover"
        controls
        muted
        playsInline
        onLoadedData={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          setError("Failed to load video");
        }}
      />
    </div>
  );
};

export default VideoPreviewThumbnail;