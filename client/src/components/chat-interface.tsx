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
import { translations } from "@/lib/translations";

interface Message {
  role: "user" | "assistant";
  content: string;
  id: string;
}

// Japanese characters for the code cascade effect
const japaneseChars = [
  'あ', 'い', 'う', 'え', 'お', 'か', 'き', 'く', 'け', 'こ',
  'さ', 'し', 'す', 'せ', 'そ', 'た', 'ち', 'つ', 'て', 'と',
  'な', 'に', 'ぬ', 'ね', 'の', 'は', 'ひ', 'ふ', 'へ', 'ほ',
  'ま', 'み', 'む', 'め', 'も', 'や', 'ゆ', 'よ', 'ら', 'り',
  'る', 'れ', 'ろ', 'わ', 'を', 'ん',
  '漢', '字', '日', '本', '語', '文', '化', '学', '習', '言',
  '愛', '平', '和', '美', '空', '海', '山', '川', '雨', '雪',
  '花', '鳥', '風', '月', '星', '夢', '希', '望', '未', '来'
];

// CodeCascade component for the matrix-like effect
function CodeCascade() {
  interface Column {
    chars: string[];
    speed: number;
    delay: number;
  }
  
  const [columns, setColumns] = useState<Column[]>([]);
  
  useEffect(() => {
    // Create columns based on available width
    const columnCount = Math.floor(Math.random() * 10) + 15; // 15-25 columns
    const newColumns: Column[] = [];
    
    for (let i = 0; i < columnCount; i++) {
      const charCount = Math.floor(Math.random() * 10) + 5; // 5-15 characters per column
      const chars = Array(charCount).fill(0).map(() => 
        japaneseChars[Math.floor(Math.random() * japaneseChars.length)]
      );
      
      newColumns.push({
        chars,
        speed: 0.5 + Math.random() * 2, // Random speed between 0.5-2.5s
        delay: Math.random() * 5 // Random delay between 0-5s
      });
    }
    
    setColumns(newColumns);
  }, []);
  
  return (
    <div className="absolute inset-0 overflow-hidden opacity-20 pointer-events-none">
      {columns.map((column, colIndex) => (
        <div 
          key={colIndex}
          className="absolute top-0 text-primary"
          style={{ 
            left: `${(colIndex / columns.length) * 100}%`,
            transform: 'translateX(-50%)'
          }}
        >
          {column.chars.map((char, charIndex) => (
            <motion.div
              key={`${colIndex}-${charIndex}`}
              initial={{ opacity: 0, y: -20 }}
              animate={{ 
                opacity: [0, 1, 0],
                y: [charIndex * -20, (charIndex + column.chars.length) * 20]
              }}
              transition={{
                duration: column.speed,
                delay: column.delay + (charIndex * 0.1),
                repeat: Infinity,
                repeatDelay: Math.random() * 2
              }}
              className="text-sm sm:text-base"
            >
              {char}
            </motion.div>
          ))}
        </div>
      ))}
    </div>
  );
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { setMood } = useMood();

  // Keep focus on input
  useEffect(() => {
    inputRef.current?.focus();
  }, [messages]);

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const formatMessagesForAPI = (messages: Message[]) => {
    return messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));
  };

  const analyzeConversationMood = async (messages: Message[]) => {
    if (messages.length < 2) return; // Only analyze if there's a conversation
    
    try {
      const lastMessages = messages.slice(-3).map(m => m.content).join("\n");
      const emotionRes = await fetch('/api/analyze-emotion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: lastMessages }),
      });

      if (emotionRes.ok) {
        const emotionData = await emotionRes.json();
        setMood(emotionData.mood);
      }
    } catch (error) {
      console.error("Error analyzing mood:", error);
      // Don't show error toast for mood analysis failures
    }
  };

  const sendMessage = useMutation({
    mutationFn: async (message: string) => {
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ 
            message,
            history: formatMessagesForAPI(messages)
          }),
          credentials: 'include'
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.details || `HTTP error! status: ${res.status}`);
        }

        const data = await res.json();
        
        if (!data || typeof data.message !== 'string') {
          throw new Error("Invalid response format from server");
        }

        return data;
      } catch (error) {
        console.error("Chat API error:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      const newMessage: Message = {
        role: "assistant",
        content: data.message,
        id: Date.now().toString(),
      };
      setMessages((prev) => [...prev, newMessage]);
      analyzeConversationMood([...messages, newMessage]);
    },
    onError: (error) => {
      toast({
        title: translations.general.error,
        description: translations.chat.errorSending,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || sendMessage.isPending) return;

    const userMessage = input.trim();
    setInput("");

    const userMessageObj = {
      role: "user" as const,
      content: userMessage,
      id: `msg-${Date.now()}-user`,
    };

    setMessages(prev => [...prev, userMessageObj]);

    try {
      const data = await sendMessage.mutateAsync(userMessage);

      const assistantMessage = {
        role: "assistant" as const,
        content: data.message,
        id: `msg-${Date.now()}-assistant`,
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      // Analyze mood after adding both messages
      await analyzeConversationMood([...messages, userMessageObj, assistantMessage]);
    } catch (error) {
      // Error handling is done in mutation's onError
    }
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
    <div className="flex flex-col h-[500px] border rounded-lg overflow-hidden bg-card/50 backdrop-blur-sm relative">
      <ScrollArea className="flex-1 p-4 relative" ref={scrollAreaRef}>
        {messages.length === 0 && <CodeCascade />}
        <div className="space-y-4 relative z-10">
          <AnimatePresence>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  {message.content}
                </div>
              </motion.div>
            ))}
            {sendMessage.isPending && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-start"
              >
                <div className="max-w-[80%] rounded-lg px-4 py-2 bg-muted">
                  <span className="text-sm opacity-70">{translations.chat.thinking}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </ScrollArea>
      <div className="p-4 border-t">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={translations.chat.placeholder}
            className="flex-1"
            disabled={sendMessage.isPending}
          />
          <Button type="submit" size="icon" disabled={sendMessage.isPending || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}