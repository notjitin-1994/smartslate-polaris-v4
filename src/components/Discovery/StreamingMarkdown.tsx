'use client';

import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion, AnimatePresence } from 'framer-motion';

interface StreamingMarkdownProps {
  content: string;
  isStreaming?: boolean;
}

export function StreamingMarkdown({ content, isStreaming }: StreamingMarkdownProps) {
  // Use a cursor only if we are actively streaming
  const displayContent = useMemo(() => {
    if (!isStreaming) return content;
    // Add an invisible character to help with trailing spaces in markdown
    return content + ' ';
  }, [content, isStreaming]);

  return (
    <div className="relative prose prose-invert prose-sm max-w-none prose-p:leading-[1.8] prose-p:mb-4 last:prose-p:mb-0 prose-pre:bg-white/[0.03] prose-pre:border prose-pre:border-white/5 prose-pre:rounded-xl prose-headings:font-heading prose-headings:font-semibold prose-headings:text-white/90 prose-headings:tracking-wide prose-a:text-primary-400 hover:prose-a:text-primary-300 prose-strong:text-white/90 prose-strong:font-semibold">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {displayContent}
      </ReactMarkdown>
      
      {isStreaming && (
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
          className="inline-block w-1.5 h-4 bg-primary-500 ml-1 translate-y-0.5 shadow-[0_0_8px_rgba(167,218,219,0.8)]"
        />
      )}
    </div>
  );
}
