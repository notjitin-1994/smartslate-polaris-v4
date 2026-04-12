'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Streamdown } from 'streamdown';
import { code } from '@streamdown/code';

interface StreamingMarkdownProps {
  content: string;
  isStreaming?: boolean;
}

/**
 * WORLD-CLASS PERCEPTUAL RENDERER (V2)
 * Uses requestAnimationFrame to leak characters at exactly 60fps.
 * Prevents "blocky" UI updates regardless of network jitter.
 */
export function StreamingMarkdown({ content, isStreaming = false }: StreamingMarkdownProps) {
  const [displayContent, setDisplayContent] = useState(content);
  const targetContentRef = useRef(content);
  const rafIdRef = useRef<number | null>(null);

  useEffect(() => {
    // If static, sync immediately
    if (!isStreaming) {
      setDisplayContent(content);
      targetContentRef.current = content;
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
      return;
    }

    targetContentRef.current = content;

    const tick = () => {
      setDisplayContent(prev => {
        if (prev.length < targetContentRef.current.length) {
          // Adaptive leak size: drain faster if we are falling behind
          const diff = targetContentRef.current.length - prev.length;
          const leakSize = diff > 50 ? 5 : diff > 20 ? 2 : 1;
          return prev + targetContentRef.current.slice(prev.length, prev.length + leakSize);
        }
        return prev;
      });
      rafIdRef.current = requestAnimationFrame(tick);
    };

    if (!rafIdRef.current) {
      rafIdRef.current = requestAnimationFrame(tick);
    }

    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, [content, isStreaming]);

  return (
    <div className="relative prose prose-invert prose-sm max-w-none prose-p:leading-[1.8] prose-p:mb-4 last:prose-p:mb-0">
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
