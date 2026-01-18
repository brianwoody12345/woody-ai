import { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bot, Sparkles } from 'lucide-react';
import { ChatMessage } from './ChatMessage';
import type { ChatMessage as ChatMessageType } from '@/types/chat';

interface ChatAreaProps {
  messages: ChatMessageType[];
  isTyping: boolean;
}

export function ChatArea({ messages, isTyping }: ChatAreaProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  return (
    <div 
      ref={scrollRef}
      className="flex-1 overflow-y-auto p-6 space-y-5 bg-grid-texture bg-circuit-texture"
    >
      {/* Empty State */}
      {messages.length === 0 && !isTyping && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center h-full text-center"
        >
          <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center mb-5 border border-primary/20">
            <Bot className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-lg font-semibold text-foreground mb-1.5 tracking-tight">
            Welcome to Woody Calculus Clone AI
          </h2>
          <p className="text-[13px] text-muted-foreground max-w-sm mb-6 leading-relaxed">
            Your AI Private Mathematics Professor. Ask about integration techniques, 
            series convergence, Vector Calculus, and more.
          </p>
          <div className="flex flex-wrap justify-center gap-2 max-w-lg">
            {[
              'Explain integration by parts',
              'How do I test for series convergence?',
              'What is a Taylor series?',
            ].map((suggestion, i) => (
              <button
                key={i}
                className="px-3.5 py-2 rounded-lg text-[12px] font-medium bg-surface-elevated border border-border/60 text-muted-foreground hover:border-primary/40 hover:text-foreground transition-all"
                style={{
                  backgroundColor: 'hsl(var(--surface-elevated))'
                }}
              >
                <Sparkles className="w-3 h-3 inline mr-1.5 text-primary/70" />
                {suggestion}
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Messages */}
      {messages.map((message) => (
        <ChatMessage key={message.id} message={message} />
      ))}

      {/* Typing Indicator */}
      {isTyping && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex gap-3"
        >
          <div className="w-8 h-8 rounded-lg bg-primary/12 border border-primary/20 flex items-center justify-center">
            <Bot className="w-4 h-4 text-primary" />
          </div>
          <div className="flex flex-col">
            <p className="text-[10px] font-semibold uppercase tracking-wider mb-1.5 px-0.5 text-primary/60">
              Professor Woody AI Clone
            </p>
            <div 
              className="px-4 py-3 rounded-xl rounded-tl-sm border border-border/60"
              style={{
                backgroundColor: 'hsl(var(--surface-elevated))'
              }}
            >
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
