import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

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
    },
    onSuccess: (data) => {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.message },
      ]);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    await sendMessage.mutate(userMessage);
  };

  const handleApiKeySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim()) return;

    setIsAuthenticated(true);
    toast({
      title: "Success",
      description: "API Key saved! You can now chat with Akiba",
    });
  };

  if (!isAuthenticated) {
    return (
      <Card className="w-full max-w-2xl mx-auto retro-container p-6">
        <div className="text-center space-y-4">
          <h3 className="text-lg font-bold glow-text">Google API Key Required</h3>
          <p className="text-sm text-muted-foreground">
            To chat with Akiba, you'll need a Google API key for the Gemini model.
          </p>
          <form onSubmit={handleApiKeySubmit} className="space-y-4">
            <Input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your Google API key"
              className="pixel-borders"
            />
            <Button type="submit" className="w-full retro-btn">
              Start Chatting
            </Button>
          </form>
        </div>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto retro-container p-4">
      <div className="flex flex-col h-[500px]">
        <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages.map((message, i) => (
              <div
                key={i}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] px-4 py-2 rounded-lg ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground ml-auto"
                      : "bg-muted"
                  } pixel-borders`}
                >
                  <p className="text-sm">{message.content}</p>
                </div>
              </div>
            ))}
            {sendMessage.isPending && (
              <div className="flex justify-start">
                <div className="max-w-[80%] px-4 py-2 rounded-lg bg-muted pixel-borders">
                  <p className="text-sm">Akiba is typing...</p>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <form onSubmit={handleSubmit} className="flex gap-2 mt-4">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 pixel-borders"
            disabled={sendMessage.isPending}
          />
          <Button 
            type="submit" 
            className="retro-btn"
            disabled={sendMessage.isPending}
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </Card>
  );
}