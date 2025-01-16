import { Share2, Mail, Copy, Twitter, Facebook, Linkedin, MessageCircle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
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
    try {
      const shareData = {
        title: "Check out this AMV!",
        text: title,
        url: url,
      };

      if (!platform && navigator.share) {
        await navigator.share(shareData);
        toast({
          title: "Success",
          description: "Content shared successfully!",
        });
        return;
      }

      switch (platform) {
        case "twitter":
          window.open(
            `https://twitter.com/intent/tweet?text=${encodeURIComponent(
              `${shareData.title}\n${shareData.text}`
            )}&url=${encodeURIComponent(url)}`,
            "_blank",
            "noopener,noreferrer"
          );
          break;
        case "facebook":
          window.open(
            `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
              url
            )}&quote=${encodeURIComponent(title)}`,
            "_blank",
            "noopener,noreferrer"
          );
          break;
        case "linkedin":
          window.open(
            `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
            "_blank",
            "noopener,noreferrer"
          );
          break;
        case "reddit":
          window.open(
            `https://reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(shareData.title)}`,
            "_blank",
            "noopener,noreferrer"
          );
          break;
        case "whatsapp":
          window.open(
            `https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareData.title}\n${shareData.text}\n${url}`)}`,
            "_blank",
            "noopener,noreferrer"
          );
          break;
        case "email":
          window.location.href = `mailto:?subject=${encodeURIComponent(
            shareData.title
          )}&body=${encodeURIComponent(`${shareData.text}\n\n${url}`)}`;
          break;
        case "copy":
          await navigator.clipboard.writeText(`${shareData.title}\n${shareData.text}\n${url}`);
          toast({
            title: "Link copied!",
            description: "The video details have been copied to your clipboard.",
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
      <DropdownMenuContent align="start" className="w-56">
        {navigator.share && (
          <>
            <DropdownMenuItem onSelect={() => handleShare()} className="flex items-center">
              <Share2 className="w-4 h-4 mr-2" />
              Share using device...
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuItem onSelect={() => handleShare("twitter")} className="flex items-center">
          <Twitter className="w-4 h-4 mr-2" />
          Share on Twitter
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => handleShare("facebook")} className="flex items-center">
          <Facebook className="w-4 h-4 mr-2" />
          Share on Facebook
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => handleShare("linkedin")} className="flex items-center">
          <Linkedin className="w-4 h-4 mr-2" />
          Share on LinkedIn
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => handleShare("whatsapp")} className="flex items-center">
          <MessageCircle className="w-4 h-4 mr-2" />
          Share on WhatsApp
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => handleShare("email")} className="flex items-center">
          <Mail className="w-4 h-4 mr-2" />
          Share via Email
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => handleShare("copy")} className="flex items-center">
          <Copy className="w-4 h-4 mr-2" />
          Copy to Clipboard
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}