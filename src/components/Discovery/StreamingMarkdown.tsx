'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Streamdown } from 'streamdown';
import { code } from '@streamdown/code';

interface StreamingMarkdownProps {
  content: string;
  isStreaming?: boolean;
}

/**
 * Claude-Grade Perceptual Renderer
 * Instead of dumping raw chunks, it uses a high-frequency leak buffer
 * to simulate character-by-character typing regardless of network jitter.
 */
export function StreamingMarkdown({ content, isStreaming = false }: StreamingMarkdownProps) {
  const [displayContent, setDisplayContent] = useState(content);
  const contentRef = useRef(content);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // If not streaming, sync immediately
    if (!isStreaming) {
      setDisplayContent(content);
      contentRef.current = content;
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    // Update target content
    contentRef.current = content;

    // Start or maintain the 'leak' timer
    if (!timerRef.current) {
      timerRef.current = setInterval(() => {
        setDisplayContent(prev => {
          if (prev.length < contentRef.current.length) {
            // Leak 1-3 characters based on how far behind we are
            const diff = contentRef.current.length - prev.length;
            const leakSize = diff > 20 ? 3 : 1; 
            return prev + contentRef.current.slice(prev.length, prev.length + leakSize);
          }
          return prev;
        });
      }, 15); // ~60fps cadence
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [content, isStreaming]);

  return (
    <div className="relative prose prose-invert prose-sm max-w-none prose-p:leading-[1.8] prose-p:mb-4 last:prose-p:mb-0 prose-pre:bg-white/[0.03] prose-pre:border prose-pre:border-white/5 prose-pre:rounded-xl prose-headings:font-heading prose-headings:font-semibold prose-headings:text-white/90 prose-headings:tracking-wide prose-a:text-primary-400 hover:prose-a:text-primary-300 prose-strong:text-white/90 prose-strong:font-semibold">
      <Streamdown
        mode={isStreaming ? 'streaming' : 'static'}
        isAnimating={isStreaming}
        plugins={{ code }}
      >
        {displayContent}
      </Streamdown>
      
      {isStreaming && (
        <span className="inline-block w-[2px] h-[1.1em] bg-primary-500/80 ml-1 animate-pulse align-middle shadow-[0_0_8px_rgba(167,218,219,0.5)]" />
      )}
    </div>
  );
}
