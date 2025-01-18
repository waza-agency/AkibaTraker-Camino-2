import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { analyzeEmotion } from "@/lib/emotion-analysis";
import { useMood } from "@/hooks/use-mood";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
  role: "user" | "assistant";
  content: string;
  id: string;
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { setMood } = useMood();
  const [messageCount, setMessageCount] = useState(0);

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = useMutation({
    mutationFn: async (message: string) => {
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          body: JSON.stringify({ message }),
          credentials: 'include'
        });

        const data = await res.json();
        
        if (!res.ok) {
          throw new Error(data.error || `HTTP error! status: ${res.status}`);
        }

        if (!data || typeof data.message !== 'string') {
          console.error("Invalid response:", data);
          throw new Error("Invalid response format from server");
        }

        return data;
      } catch (error) {
        console.error("Chat API error:", error);
        throw new Error(error instanceof Error ? error.message : "Failed to send message");
      }
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput("");

    const userMessageId = `msg-${Date.now()}-user`;
    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        content: userMessage,
        id: userMessageId,
      },
    ]);

    try {
      const data = await sendMessage.mutateAsync(userMessage);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.message,
          id: `msg-${Date.now()}-assistant`,
        },
      ]);
    } catch (error) {
      console.error("Chat message error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send message",
        variant: "destructive",
      });
    }

    inputRef.current?.focus();
  };


  const messageVariants = {
    initial: {
      opacity: 0,
      scale: 0.95,
      y: 20
    },
    animate: {
      opacity: 1,
      scale: 1,
      y: 0
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      y: -20
    }
  };

  const pulseAnimation = {
    initial: { boxShadow: "0 0 0 0 rgba(255, 255, 255, 0)" },
    animate: {
      boxShadow: [
        "0 0 0 0 rgba(255, 255, 255, 0.2)",
        "0 0 0 10px rgba(255, 255, 255, 0)",
      ],
      transition: {
        duration: 1.5,
        ease: "easeInOut",
        times: [0, 1],
        repeat: 1
      },
    }
  };

  return (
    <div className="flex flex-col h-full">
        <>
          <ScrollArea className="flex-1 px-4 py-2">
            <div className="space-y-4 min-h-full">
              <AnimatePresence mode="popLayout">
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className={`flex ${
                      message.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[80%] px-4 py-2 rounded-2xl ${
                        message.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {sendMessage.isPending && (
                <motion.div
                  className="flex justify-start"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="max-w-[80%] px-4 py-2 rounded-2xl bg-muted">
                    <p className="text-sm">Akiba is typing...</p>
                  </div>
                </motion.div>
              )}
            </div>
          </ScrollArea>

          <div className="p-4 border-t bg-background/50">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message..."
                className="flex-1"
                disabled={sendMessage.isPending}
                aria-label="Chat message"
                ref={inputRef}
              />
              <Button
                type="submit"
                size="icon"
                disabled={sendMessage.isPending}
                aria-label="Send message"
              >
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </div>
        </>
    </div>
  );
}