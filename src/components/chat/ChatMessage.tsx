import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { User, Bot, FileText, Image as ImageIcon } from 'lucide-react';
import 'katex/dist/katex.min.css';
import katex from 'katex';
import type { ChatMessage as ChatMessageType } from '@/types/chat';

interface ChatMessageProps {
  message: ChatMessageType;
}

function escapeHtml(s: string): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function renderCodeCard(codeRaw: string): string {
  const code = String(codeRaw ?? '').trim();

  return `
    <div style="
      margin: 12px 0;
      padding: 14px 14px;
      border-radius: 14px;
      border: 1px solid hsl(var(--border) / 0.7);
      background: hsl(var(--surface-elevated));
      box-shadow: 0 1px 0 hsl(var(--border) / 0.25) inset;
      overflow: hidden;
    ">
      <pre style="
        margin: 0;
        padding: 12px 12px;
        border-radius: 12px;
        border: 1px solid hsl(var(--border) / 0.55);
        background: hsl(var(--background) / 0.55);
        overflow-x: auto;
        font-size: 14px;
        line-height: 1.6;
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
        white-space: pre;
      "><code>${escapeHtml(code)}</code></pre>
    </div>
  `;
}

function isTableSeparatorRow(line: string): boolean {
  // matches: | ---- | --- | or ----|---|---- with optional spaces
  const s = line.trim().replace(/\s/g, '');
  return /^(\|?-{3,}\|)+-?\|?$/.test(s);
}

// Render LaTeX in a cell (handles both inline $ and display $$)
function renderCellWithLatex(cell: string): string {
  let processed = cell;
  
  // Handle display math $$...$$ first
  processed = processed.replace(/\$\$([\s\S]*?)\$\$/g, (_, math) => {
    try {
      return katex.renderToString(String(math).trim(), {
        displayMode: true,
        throwOnError: false,
      });
    } catch {
      return `<code>${escapeHtml(String(math))}</code>`;
    }
  });

  // Handle inline math $...$
  processed = processed.replace(/\$([^\$\n]+?)\$/g, (_, math) => {
    try {
      return katex.renderToString(String(math).trim(), {
        displayMode: false,
        throwOnError: false,
      });
    } catch {
      return `<code>${escapeHtml(String(math))}</code>`;
    }
  });

  // Handle \(...\) inline math
  processed = processed.replace(/\\\(([\s\S]*?)\\\)/g, (_, math) => {
    try {
      return katex.renderToString(String(math).trim(), {
        displayMode: false,
        throwOnError: false,
      });
    } catch {
      return `<code>${escapeHtml(String(math))}</code>`;
    }
  });

  // Handle \[...\] display math
  processed = processed.replace(/\\\[([\s\S]*?)\\\]/g, (_, math) => {
    try {
      return katex.renderToString(String(math).trim(), {
        displayMode: true,
        throwOnError: false,
      });
    } catch {
      return `<code>${escapeHtml(String(math))}</code>`;
    }
  });

  return processed;
}

function parseMarkdownTableBlock(lines: string[]): { html: string; consumed: number } | null {
  // need at least header + separator + 1 row
  if (lines.length < 3) return null;

  const header = lines[0];
  const sep = lines[1];
  if (!header.includes('|') || !isTableSeparatorRow(sep)) return null;

  const rows: string[] = [];
  let i = 2;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.includes('|')) break;
    if (line.trim() === '') break;
    rows.push(line);
    i++;
  }
  if (rows.length === 0) return null;

  // Improved split that handles empty first/last cells from leading/trailing pipes
  const splitRow = (row: string) => {
    // Remove leading/trailing pipes and split
    let trimmed = row.trim();
    if (trimmed.startsWith('|')) trimmed = trimmed.slice(1);
    if (trimmed.endsWith('|')) trimmed = trimmed.slice(0, -1);
    
    return trimmed.split('|').map((c) => c.trim());
  };

  const headers = splitRow(header);
  const body = rows.map(splitRow);

  const ths = headers
    .map(
      (h) => `<th style="
        text-align:center;
        padding:10px 12px;
        font-size:12px;
        font-weight:800;
        letter-spacing:0.08em;
        text-transform:uppercase;
        color:hsl(var(--muted-foreground));
        border-bottom:1px solid hsl(var(--border) / 0.6);
        border-right:1px solid hsl(var(--border) / 0.3);
      ">${renderCellWithLatex(h)}</th>`
    )
    .join('');

  const trs = body
    .map((r) => {
      const tds = r
        .map(
          (c, idx) => `<td style="
            padding:10px 12px;
            font-size:14px;
            color:hsl(var(--foreground));
            border-bottom:1px solid hsl(var(--border) / 0.35);
            border-right:1px solid hsl(var(--border) / 0.3);
            vertical-align:middle;
            text-align:${idx === 0 ? 'center' : 'left'};
            ${idx === 0 ? 'font-weight:600;' : ''}
          ">${renderCellWithLatex(c)}</td>`
        )
        .join('');
      return `<tr>${tds}</tr>`;
    })
    .join('');

  const tableHtml = `
    <div style="
      margin: 12px 0;
      border-radius: 14px;
      border: 1px solid hsl(var(--border) / 0.7);
      background: hsl(var(--surface-elevated));
      overflow: hidden;
    ">
      <table style="width:100%; border-collapse:collapse;">
        <thead><tr>${ths}</tr></thead>
        <tbody>${trs}</tbody>
      </table>
    </div>
  `;

  return { html: tableHtml, consumed: 2 + rows.length };
}

function renderMathContent(content: string): string {
  let processed = content ?? '';

  // 1) Extract fenced code blocks FIRST
  const codeBlocks: string[] = [];
  processed = processed.replace(/```([\s\S]*?)```/g, (_, code) => {
    const idx = codeBlocks.length;
    codeBlocks.push(String(code ?? ''));
    return `@@CODEBLOCK_${idx}@@`;
  });

  // 2) Convert markdown tables (outside code blocks)
  // Do this BEFORE KaTeX and BEFORE newline-><br>
  {
    const lines = processed.split('\n');
    const out: string[] = [];
    for (let i = 0; i < lines.length; ) {
      const remaining = lines.slice(i);
      const parsed = parseMarkdownTableBlock(remaining);
      if (parsed) {
        out.push(`@@HTMLBLOCK_START@@${parsed.html}@@HTMLBLOCK_END@@`);
        i += parsed.consumed;
        continue;
      }
      out.push(lines[i]);
      i++;
    }
    processed = out.join('\n');
  }

  // 3) Simple horizontal rules for lines that are just "---"
  processed = processed.replace(/^\s*---\s*$/gm, `@@HTMLBLOCK_START@@<hr style="border:none;border-top:1px solid hsl(var(--border) / 0.6); margin:14px 0;" />@@HTMLBLOCK_END@@`);

  // 4) KaTeX rendering (non-code only)
  processed = processed.replace(/\\\[([\s\S]*?)\\\]/g, (_, math) => {
    try {
      return `<div class="katex-display">${katex.renderToString(String(math).trim(), {
        displayMode: true,
        throwOnError: false,
      })}</div>`;
    } catch {
      return `<code>${escapeHtml(String(math))}</code>`;
    }
  });

  processed = processed.replace(/\$\$([\s\S]*?)\$\$/g, (_, math) => {
    try {
      return `<div class="katex-display">${katex.renderToString(String(math).trim(), {
        displayMode: true,
        throwOnError: false,
      })}</div>`;
    } catch {
      return `<code>${escapeHtml(String(math))}</code>`;
    }
  });

  processed = processed.replace(/\\\(([\s\S]*?)\\\)/g, (_, math) => {
    try {
      return katex.renderToString(String(math).trim(), {
        displayMode: false,
        throwOnError: false,
      });
    } catch {
      return `<code>${escapeHtml(String(math))}</code>`;
    }
  });

  processed = processed.replace(/\$([^\$\n]+?)\$/g, (_, math) => {
    try {
      return katex.renderToString(String(math).trim(), {
        displayMode: false,
        throwOnError: false,
      });
    } catch {
      return `<code>${escapeHtml(String(math))}</code>`;
    }
  });

  // Bold **text**
  processed = processed.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

  // Newlines -> <br>
  processed = processed.replace(/\n/g, '<br>');

  // Restore raw HTML blocks (tables/hr)
  processed = processed.replace(/@@HTMLBLOCK_START@@([\s\S]*?)@@HTMLBLOCK_END@@/g, (_, html) => String(html));

  // 5) Put code blocks back at the end
  processed = processed.replace(/@@CODEBLOCK_(\d+)@@/g, (_, nStr) => {
    const n = Number(nStr);
    const code = codeBlocks[n] ?? '';
    return renderCodeCard(code);
  });

  return processed;
}

export const ChatMessage = memo(function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';

  const renderedContent = useMemo(() => {
    return renderMathContent(message.content);
  }, [message.content]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
    >
      {/* Avatar */}
      <div
        className={`
          w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5
          ${isUser ? 'bg-secondary border border-border' : 'bg-primary/12 border border-primary/20'}
        `}
      >
        {isUser ? (
          <User className="w-4 h-4 text-muted-foreground" />
        ) : (
          <Bot className="w-4 h-4 text-primary" />
        )}
      </div>

      {/* Message Content */}
      <div className={`flex-1 max-w-[80%] ${isUser ? 'items-end' : 'items-start'}`}>
        {/* Role Label */}
        <p
          className={`text-[10px] font-semibold uppercase tracking-wider mb-1.5 px-0.5 ${
            isUser ? 'text-right text-muted-foreground/60' : 'text-left text-primary/60'
          }`}
        >
          {isUser ? 'You' : 'Professor Woody AI Clone'}
        </p>

        <div
          className={`
            rounded-xl px-4 py-3 message-content
            ${
              isUser
                ? 'bg-secondary border border-border text-secondary-foreground rounded-tr-sm'
                : 'bg-surface-elevated border border-border/60 text-foreground rounded-tl-sm'
            }
          `}
          style={{
            backgroundColor: isUser ? undefined : 'hsl(var(--surface-elevated))',
          }}
        >
          {/* Attached Files */}
          {message.files && message.files.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3 pb-2.5 border-b border-border/40">
              {message.files.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-background/60 text-[11px] font-medium border border-border/40"
                >
                  {file.type === 'pdf' ? (
                    <FileText className="w-3 h-3 text-primary" />
                  ) : (
                    <ImageIcon className="w-3 h-3 text-primary" />
                  )}
                  <span className="truncate max-w-[100px] text-muted-foreground">{file.name}</span>
                </div>
              ))}
            </div>
          )}

          {/* Message Text with Math */}
          <div
            className="text-[16px] leading-[1.8] tracking-[-0.01em]"
            dangerouslySetInnerHTML={{ __html: renderedContent }}
          />

          {/* Streaming indicator */}
          {message.isStreaming && (
            <span className="inline-flex gap-1 ml-1.5 align-middle">
              <span className="w-1 h-1 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1 h-1 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1 h-1 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
            </span>
          )}
        </div>

        {/* Timestamp */}
        <p
          className={`text-[9px] font-medium text-muted-foreground/50 mt-1.5 px-0.5 tracking-wide ${
            isUser ? 'text-right' : 'text-left'
          }`}
        >
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </motion.div>
  );
});
