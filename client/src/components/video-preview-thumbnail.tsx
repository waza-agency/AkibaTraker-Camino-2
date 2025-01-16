import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface VideoPreviewThumbnailProps {
  src: string;
  className?: string;
}

export default function VideoPreviewThumbnail({
  src,
  className
}: VideoPreviewThumbnailProps) {
  const [isHovering, setIsHovering] = useState(false);
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Function to capture thumbnails from the video
  const captureThumbnails = async () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Capture frames at different timestamps
    const timestamps = [0, 0.25, 0.5, 0.75];
    const frames: string[] = [];

    for (const time of timestamps) {
      video.currentTime = time * video.duration;
      // Wait for the video to seek to the timestamp
      await new Promise(resolve => {
        video.onseeked = resolve;
      });
      
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        frames.push(canvas.toDataURL('image/jpeg'));
      }
    }

    setThumbnails(frames);
  };

  useEffect(() => {
    if (isHovering && thumbnails.length === 0) {
      captureThumbnails();
    }

    let interval: NodeJS.Timeout;
    if (isHovering && thumbnails.length > 0) {
      interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % thumbnails.length);
      }, 750); // Change thumbnail every 750ms
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isHovering, thumbnails]);

  return (
    <div 
      className={`relative group ${className}`}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <video 
        ref={videoRef}
        src={src}
        className="w-full h-full object-cover"
        preload="metadata"
        muted
        playsInline
      />

      <AnimatePresence>
        {isHovering && thumbnails.length > 0 && (
          <motion.img
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            src={thumbnails[currentIndex]}
            alt="Video preview"
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
      </AnimatePresence>
    </div>
  );
}
