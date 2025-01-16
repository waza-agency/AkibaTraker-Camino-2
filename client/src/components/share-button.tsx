import { Share2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface ShareButtonProps {
  url: string;
  title: string;
}

export default function ShareButton({ url, title }: ShareButtonProps) {
  const { toast } = useToast();

  const handleShare = async (platform?: string) => {
    const shareData = {
      title: "Check out this AMV!",
      text: title,
      url: url,
    };

    try {
      if (!platform && navigator.share) {
        await navigator.share(shareData);
        return;
      }

      switch (platform) {
        case "twitter":
          window.open(
            `https://twitter.com/intent/tweet?text=${encodeURIComponent(
              `${shareData.title}\n${shareData.text}`
            )}&url=${encodeURIComponent(url)}`,
            "_blank"
          );
          break;
        case "facebook":
          window.open(
            `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
              url
            )}&quote=${encodeURIComponent(title)}`,
            "_blank"
          );
          break;
        case "copy":
          await navigator.clipboard.writeText(url);
          toast({
            title: "Link copied!",
            description: "The video URL has been copied to your clipboard.",
          });
          break;
      }
    } catch (error) {
      console.error("Error sharing:", error);
      toast({
        title: "Share failed",
        description: "Failed to share the video. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-2 left-2 bg-background/80 backdrop-blur-sm hover:bg-background/90"
        >
          <Share2 className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {navigator.share && (
          <DropdownMenuItem onSelect={() => handleShare()}>
            Share...
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onSelect={() => handleShare("twitter")}>
          Share on Twitter
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => handleShare("facebook")}>
          Share on Facebook
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => handleShare("copy")}>
          Copy Link
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}