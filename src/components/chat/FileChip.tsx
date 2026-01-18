import { X, FileText, Image as ImageIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import type { UploadedFile } from '@/types/chat';

interface FileChipProps {
  file: UploadedFile;
  onRemove: (id: string) => void;
}

export function FileChip({ file, onRemove }: FileChipProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-elevated border border-border group hover:border-primary/50 transition-colors"
      style={{
        backgroundColor: 'hsl(var(--surface-elevated))'
      }}
    >
      {/* File Icon */}
      <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center">
        {file.type === 'pdf' ? (
          <FileText className="w-4 h-4 text-primary" />
        ) : file.preview ? (
          <img 
            src={file.preview} 
            alt={file.name}
            className="w-full h-full object-cover rounded-md"
          />
        ) : (
          <ImageIcon className="w-4 h-4 text-primary" />
        )}
      </div>

      {/* File Info */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-foreground truncate max-w-[120px]">
          {file.name}
        </p>
        <p className="text-[10px] text-muted-foreground uppercase">
          {file.type}
        </p>
      </div>

      {/* Remove Button */}
      <button
        type="button"
        onClick={() => onRemove(file.id)}
        className="w-5 h-5 rounded-full bg-muted/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/20 hover:text-destructive"
      >
        <X className="w-3 h-3" />
      </button>
    </motion.div>
  );
}
