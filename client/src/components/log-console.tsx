import { useEffect, useRef, useState } from 'react';
import { ScrollArea } from './ui/scroll-area';
import { translations } from '@/lib/translations';

interface Log {
  message: string;
  timestamp: string;
  type: 'info' | 'error' | 'success';
}

interface LogConsoleProps {
  logs: Log[];
  isProcessing?: boolean;
}

export function LogConsole({ logs, isProcessing = false }: LogConsoleProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showCursor, setShowCursor] = useState(true);

  // Flashing cursor effect
  useEffect(() => {
    const cursorInterval = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 530);

    return () => clearInterval(cursorInterval);
  }, []);

  // Time counter
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isProcessing) {
      interval = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    } else {
      setElapsedTime(0);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isProcessing]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  // Format elapsed time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="border-2 border-primary/50 rounded-lg bg-black/90 p-2 font-mono text-sm">
      <div className="flex items-center justify-between mb-2 px-2">
        <div className="text-primary/70">{translations.logs.systemLog}</div>
        <div className="flex items-center gap-4">
          {isProcessing && (
            <span className="text-xs text-primary/70">
              {translations.logs.time}: {formatTime(elapsedTime)}
            </span>
          )}
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500/70"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500/70"></div>
            <div className="w-3 h-3 rounded-full bg-green-500/70"></div>
          </div>
        </div>
      </div>
      <ScrollArea className="h-40">
        <div className="space-y-1 p-2">
          {logs.map((log, i) => (
            <div
              key={i}
              className={`font-mono text-xs ${
                log.type === 'error' ? 'text-red-400' :
                log.type === 'success' ? 'text-green-400' :
                'text-primary/80'
              }`}
            >
              <span className="text-muted-foreground">[{log.timestamp}]</span>{' '}
              {log.message}
            </div>
          ))}
          {isProcessing && (
            <div className="font-mono text-xs text-primary/80 flex items-center">
              <span className="text-muted-foreground">[{new Date().toLocaleTimeString()}]</span>{' '}
              {translations.logs.generating}{'.'.repeat(elapsedTime % 4)}
              <span className={`ml-1 ${showCursor ? 'opacity-100' : 'opacity-0'}`}>▊</span>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
} 