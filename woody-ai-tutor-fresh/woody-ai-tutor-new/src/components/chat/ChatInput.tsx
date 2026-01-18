import { useState, useRef, useCallback } from 'react';
import { Send, Plus } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { FileChip } from './FileChip';
import type { UploadedFile } from '@/types/chat';

interface ChatInputProps {
  onSend: (message: string, files: UploadedFile[]) => void;
  isLoading: boolean;
}

export function ChatInput({ onSend, isLoading }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);

    const newFiles: UploadedFile[] = selectedFiles
      .filter((file) => {
        const isPdf = file.type === 'application/pdf';
        const isImage = file.type.startsWith('image/');
        return isPdf || isImage;
      })
      .map((file) => {
        const isPdf = file.type === 'application/pdf';
        return {
          id: crypto.randomUUID(),
          file,
          name: file.name,
          type: isPdf ? ('pdf' as const) : ('image' as const),
          preview: !isPdf ? URL.createObjectURL(file) : undefined,
        };
      });

    setFiles((prev) => [...prev, ...newFiles]);

    // reset file input so selecting the same file again triggers change
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const handleRemoveFile = useCallback((id: string) => {
    setFiles((prev) => {
      const file = prev.find((f) => f.id === id);
      if (file?.preview) {
        URL.revokeObjectURL(file.preview);
      }
      return prev.filter((f) => f.id !== id);
    });
  }, []);

  const handleSend = useCallback(() => {
    if (isLoading) return;

    const trimmedMessage = message.trim();
    if (!trimmedMessage && files.length === 0) return;

    onSend(trimmedMessage, files);

    // ✅ Clear only the message. Keep files attached until the student removes them.
    setMessage('');

    textareaRef.current?.focus();
  }, [message, files, onSend, isLoading]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        if (isLoading) return;
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend, isLoading]
  );

  return (
    <div className="border-t border-border bg-card/90 backdrop-blur-md p-4">
      {/* File Chips */}
      <AnimatePresence>
        {files.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3 pb-3 border-b border-border/40">
            {files.map((file) => (
              <FileChip key={file.id} file={file} onRemove={handleRemoveFile} />
            ))}

            {/* ✅ Small hint so students understand files stay attached */}
            <div className="w-full">
              <p className="text-[10px] text-muted-foreground/60 mt-1.5 font-medium">
                Files stay attached for follow-up questions until you remove them.
              </p>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Input Area */}
      <div className="flex items-end gap-2.5">
        {/* Upload Button */}
        <div className="flex-shrink-0">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,image/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            id="file-upload"
            disabled={isLoading}
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => {
              if (isLoading) return;
              fileInputRef.current?.click();
            }}
            disabled={isLoading}
            className="h-11 w-11 rounded-lg border-border/80 bg-surface-elevated hover:bg-surface-hover hover:border-primary/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor: 'hsl(var(--surface-elevated))',
            }}
          >
            <Plus className="w-4 h-4 text-muted-foreground" />
          </Button>
        </div>

        {/* Text Input */}
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about integration, series, Taylor expansions..."
            disabled={isLoading}
            className="min-h-[44px] max-h-[180px] resize-none rounded-lg border-border/80 bg-input text-foreground placeholder:text-muted-foreground/60 focus-visible:ring-1 focus-visible:ring-primary/50 focus-visible:ring-offset-0 focus-visible:border-primary/50 pr-4 py-2.5 text-[14px] leading-relaxed font-medium"
            style={{
              backgroundColor: 'hsl(var(--input))',
            }}
            rows={1}
          />
        </div>

        {/* Send Button */}
        <Button
          type="button"
          size="icon"
          onClick={handleSend}
          disabled={isLoading || (!message.trim() && files.length === 0)}
          className="h-11 w-11 rounded-lg bg-primary hover:bg-primary/85 text-primary-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-all font-semibold"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>

      {/* Helper Text */}
      <p className="text-[10px] text-muted-foreground/50 mt-2.5 text-center font-medium tracking-wide">
        Shift + Enter for new line • LaTeX supported: $\int f(x)\,dx$
      </p>
    </div>
  );
}
