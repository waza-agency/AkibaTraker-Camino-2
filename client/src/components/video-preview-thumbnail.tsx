import { FC } from "react";

interface VideoPreviewThumbnailProps {
  src: string;
  className?: string;
}

const VideoPreviewThumbnail: FC<VideoPreviewThumbnailProps> = ({
  src,
  className
}) => {
  return (
    <div className={`relative group ${className}`}>
      <video 
        src={src}
        className="w-full h-full object-cover"
        controls
        muted
        playsInline
      />
    </div>
  );
};

export default VideoPreviewThumbnail;