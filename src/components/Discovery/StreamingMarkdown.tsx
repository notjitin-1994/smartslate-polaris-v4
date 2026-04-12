'use client';

import { Streamdown } from 'streamdown';
import { code } from '@streamdown/code';

interface StreamingMarkdownProps {
  content: string;
  isStreaming?: boolean;
}

export function StreamingMarkdown({ content, isStreaming = false }: StreamingMarkdownProps) {
  return (
    <div className="relative prose prose-invert prose-sm max-w-none prose-p:leading-[1.8] prose-p:mb-4 last:prose-p:mb-0 prose-pre:bg-white/[0.03] prose-pre:border prose-pre:border-white/5 prose-pre:rounded-xl prose-headings:font-heading prose-headings:font-semibold prose-headings:text-white/90 prose-headings:tracking-wide prose-a:text-primary-400 hover:prose-a:text-primary-300 prose-strong:text-white/90 prose-strong:font-semibold">
      <Streamdown
        mode={isStreaming ? 'streaming' : 'static'}
        isAnimating={isStreaming}
        plugins={{ code }}
      >
        {content}
      </Streamdown>
    </div>
  );
}
