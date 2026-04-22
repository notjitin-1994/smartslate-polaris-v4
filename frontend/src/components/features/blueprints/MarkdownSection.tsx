/**
 * Markdown Section Component
 * Enhanced markdown rendering with syntax highlighting
 */

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import remarkGfm from 'remark-gfm';
import { formatSectionTitle } from './utils';
import 'highlight.js/styles/github-dark.css';

interface MarkdownSectionProps {
  sectionKey: string;
  data: any;
}

export function MarkdownSection({ sectionKey, data }: MarkdownSectionProps): React.JSX.Element {
  const content = extractMarkdownContent(data);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="glass rounded-2xl p-6 md:p-8"
    >
      <h2 className="text-title text-foreground mb-6">{formatSectionTitle(sectionKey)}</h2>

      <div className="prose prose-invert prose-slate max-w-none">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeHighlight]}
          components={{
            h1: ({ children }) => (
              <h1 className="text-foreground mt-6 mb-4 text-2xl font-bold">{children}</h1>
            ),
            h2: ({ children }) => (
              <h2 className="text-foreground mt-5 mb-3 text-xl font-semibold">{children}</h2>
            ),
            h3: ({ children }) => (
              <h3 className="text-foreground mt-4 mb-2 text-lg font-semibold">{children}</h3>
            ),
            p: ({ children }) => (
              <p className="text-body text-text-secondary mb-4 leading-relaxed">{children}</p>
            ),
            ul: ({ children }) => (
              <ul className="text-text-secondary mb-4 list-inside list-disc space-y-2">
                {children}
              </ul>
            ),
            ol: ({ children }) => (
              <ol className="text-text-secondary mb-4 list-inside list-decimal space-y-2">
                {children}
              </ol>
            ),
            li: ({ children }) => <li className="text-body">{children}</li>,
            blockquote: ({ children }) => (
              <blockquote className="border-primary text-text-secondary my-4 border-l-4 pl-4 italic">
                {children}
              </blockquote>
            ),
            code: ({ className, children }) => {
              const isInline = !className;
              return isInline ? (
                <code className="bg-surface text-primary rounded px-1.5 py-0.5 font-mono text-sm">
                  {children}
                </code>
              ) : (
                <code className={className}>{children}</code>
              );
            },
            pre: ({ children }) => (
              <pre className="bg-surface mb-4 overflow-x-auto rounded-lg p-4">{children}</pre>
            ),
            table: ({ children }) => (
              <div className="mb-4 overflow-x-auto">
                <table className="w-full border-collapse">{children}</table>
              </div>
            ),
            thead: ({ children }) => (
              <thead className="border-b-2 border-neutral-300">{children}</thead>
            ),
            tbody: ({ children }) => <tbody>{children}</tbody>,
            tr: ({ children }) => (
              <tr className="hover:bg-foreground/5 border-b border-neutral-200 transition-colors">
                {children}
              </tr>
            ),
            th: ({ children }) => (
              <th className="text-foreground px-4 py-2 text-left text-sm font-semibold">
                {children}
              </th>
            ),
            td: ({ children }) => (
              <td className="text-text-secondary px-4 py-2 text-sm">{children}</td>
            ),
            hr: () => <hr className="my-6 border-neutral-300" />,
            a: ({ href, children }) => (
              <a
                href={href}
                className="text-primary hover:text-primary/80 underline transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                {children}
              </a>
            ),
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    </motion.div>
  );
}

/**
 * Extract markdown content from various data structures
 */
function extractMarkdownContent(data: any): string {
  // Direct content field
  if (data.content && typeof data.content === 'string') {
    return data.content;
  }

  // Overview field
  if (data.overview && typeof data.overview === 'string') {
    return data.overview;
  }

  // If data is just a string
  if (typeof data === 'string') {
    return data;
  }

  // Convert object to markdown
  return convertObjectToMarkdown(data);
}

/**
 * Convert object to markdown format
 */
function convertObjectToMarkdown(obj: any): string {
  let md = '';

  for (const [key, value] of Object.entries(obj)) {
    if (key === 'displayType' || key === 'chartConfig') continue;

    md += `## ${formatSectionTitle(key)}\n\n`;

    if (typeof value === 'string') {
      md += `${value}\n\n`;
    } else if (Array.isArray(value)) {
      value.forEach((item) => {
        if (typeof item === 'string') {
          md += `- ${item}\n`;
        } else if (typeof item === 'object') {
          md += `- ${JSON.stringify(item, null, 2)}\n`;
        }
      });
      md += '\n';
    } else if (typeof value === 'object') {
      md += `\`\`\`json\n${JSON.stringify(value, null, 2)}\n\`\`\`\n\n`;
    } else {
      md += `${value}\n\n`;
    }
  }

  return md || 'No content available.';
}
