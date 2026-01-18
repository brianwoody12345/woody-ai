export interface UploadedFile {
  id: string;
  file: File;
  name: string;
  type: 'pdf' | 'image';
  preview?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  files?: UploadedFile[];
  timestamp: Date;
  isStreaming?: boolean;
}

export type TopicId = 
  | 'techniques-integration'
  | 'series'
  | 'power-series-taylor'
  | 'applications-integration'
  | 'calc-iii'
  | 'differential-equations';

export interface Topic {
  id: TopicId;
  label: string;
  disabled?: boolean;
  comingSoon?: boolean;
}
