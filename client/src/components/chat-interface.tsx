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
  const [apiKey, setApiKey] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { setMood } = useMood();

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
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-google-api-key": apiKey
        },
        body: JSON.stringify({ message }),
      });

      if (!res.ok) {
        const error = await res.text();
        throw new Error(error);
      }

      return res.json();
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput("");

    const userMessageId = `msg-${Date.now()}-user`;
    setMessages((prev) => [...prev, { 
      role: "user", 
      content: userMessage,
      id: userMessageId
    }]);

    await sendMessage.mutate(userMessage, {
      onSuccess: async (data) => {
        try {
          const emotionResponse = await fetch("/api/analyze-emotion", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-google-api-key": apiKey,
            },
            body: JSON.stringify({ message: data.message })
          });

          if (!emotionResponse.ok) {
            throw new Error(`Error analyzing emotion: ${emotionResponse.status}`);
          }

          const emotionData = await emotionResponse.json();
          if (emotionData && emotionData.mood) {
            setMood(emotionData.mood);
          } else {
            console.error("Invalid emotion data format:", emotionData);
            setMood("energetic");
          }
        } catch (error) {
          console.error("Error analyzing emotion:", error);
          setMood("kawaii"); // Default to kawaii on error
        }

        const assistantMessageId = `msg-${Date.now()}-assistant`;
        setMessages((prev) => [
          ...prev,
          { 
            role: "assistant", 
            content: data.message,
            id: assistantMessageId
          },
        ]);

        // Ensure input focus after response
        setTimeout(() => {
          inputRef.current?.focus();
        }, 0);
      },
      onError: (error) => {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
        inputRef.current?.focus();
      }
    });
  };

  const handleApiKeySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim()) return;

    setIsAuthenticated(true);
    toast({
      title: "Success",
      description: "API Key saved! You can now chat with Akiba",
    });

    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
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
      {!isAuthenticated ? (
        <div className="flex-1 flex items-center justify-center p-4">
          <form onSubmit={handleApiKeySubmit} className="w-full max-w-md space-y-4">
            <div className="text-center mb-4">
              <p className="text-sm text-muted-foreground">
                Enter your Google API key to chat with Akiba
              </p>
            </div>
            <div className="flex gap-2">
              <Input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your Google API key"
                className="flex-1"
                aria-label="Google API Key"
                ref={inputRef}
              />
              <Button type="submit">
                Start Chat
              </Button>
            </div>
          </form>
        </div>
      ) : (
        <>
          <ScrollArea className="flex-1 px-4 py-2">
            <div className="space-y-4 min-h-full">
              <AnimatePresence mode="popLayout">
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    variants={messageVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    layout
                    className={`flex ${
                      message.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <motion.div
                      variants={pulseAnimation}
                      initial="initial"
                      animate="animate"
                      className={`max-w-[80%] px-4 py-2 rounded-2xl ${
                        message.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                    </motion.div>
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
      )}
    </div>
  );
}