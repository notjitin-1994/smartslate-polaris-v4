/**
 * Additional Data Infographic
 * Generic component for rendering unknown/additional sections from blueprint JSON
 * Displays data in a clean markdown format
 */

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { FileText } from 'lucide-react';

interface AdditionalDataInfographicProps {
  data: any;
  sectionKey?: string;
}

/**
 * Formats a camelCase or snake_case key into Title Case
 */
function formatKey(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1') // Add space before capital letters
    .replace(/_/g, ' ') // Replace underscores with spaces
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
    .trim();
}

/**
 * Convert unknown data structure to clean markdown
 */
function convertToMarkdown(data: any, level: number = 2): string {
  let md = '';

  // If data is a string, return it directly
  if (typeof data === 'string') {
    return data;
  }

  // If data is a primitive, return it as string
  if (typeof data === 'number' || typeof data === 'boolean') {
    return String(data);
  }

  // If data is null or undefined, return placeholder
  if (data === null || data === undefined) {
    return '_No data available_';
  }

  // If data is an array
  if (Array.isArray(data)) {
    // If array of strings or primitives, create bullet list
    if (data.every((item) => typeof item === 'string' || typeof item === 'number')) {
      data.forEach((item) => {
        md += `- ${item}\n`;
      });
      md += '\n';
      return md;
    }

    // If array of objects, process each item
    data.forEach((item, index) => {
      if (typeof item === 'object' && item !== null) {
        md += `### Item ${index + 1}\n\n`;
        md += convertToMarkdown(item, level + 1);
      } else {
        md += `- ${item}\n`;
      }
    });
    md += '\n';
    return md;
  }

  // If data is an object
  if (typeof data === 'object' && data !== null) {
    // Skip displayType and chartConfig
    const filteredEntries = Object.entries(data).filter(
      ([key]) => key !== 'displayType' && key !== 'chartConfig'
    );

    for (const [key, value] of filteredEntries) {
      const formattedKey = formatKey(key);
      const headingLevel = Math.min(level, 4); // Cap at h4
      const heading = '#'.repeat(headingLevel);

      // If value is a simple string, display inline
      if (typeof value === 'string') {
        md += `${heading} ${formattedKey}\n\n${value}\n\n`;
      }
      // If value is a number or boolean
      else if (typeof value === 'number' || typeof value === 'boolean') {
        md += `**${formattedKey}:** ${value}\n\n`;
      }
      // If value is an array
      else if (Array.isArray(value)) {
        md += `${heading} ${formattedKey}\n\n`;
        md += convertToMarkdown(value, level + 1);
      }
      // If value is an object
      else if (typeof value === 'object' && value !== null) {
        md += `${heading} ${formattedKey}\n\n`;
        md += convertToMarkdown(value, level + 1);
      }
    }
  }

  return md || '_No data available_';
}

export function AdditionalDataInfographic({
  data,
  sectionKey,
}: AdditionalDataInfographicProps): React.JSX.Element {
  const markdownContent = convertToMarkdown(data);

  return (
    <div className="space-y-4">
      {/* Info Banner */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-4"
      >
        <div className="bg-primary/20 text-primary rounded-lg p-2">
          <FileText className="h-4 w-4" />
        </div>
        <div className="flex-1">
          <p className="text-text-secondary text-sm">
            {sectionKey
              ? `Additional data found in the "${formatKey(sectionKey)}" section`
              : 'Additional data found in blueprint'}
          </p>
        </div>
      </motion.div>

      {/* Markdown Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-strong rounded-xl border border-white/10 p-5 lg:p-6"
      >
        <div className="prose prose-invert prose-slate max-w-none">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
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
              h4: ({ children }) => (
                <h4 className="text-foreground mt-3 mb-2 text-base font-semibold">{children}</h4>
              ),
              p: ({ children }) => (
                <p className="text-text-primary mb-3 text-sm leading-relaxed lg:text-base">
                  {children}
                </p>
              ),
              ul: ({ children }) => (
                <ul className="text-text-primary mb-3 list-inside list-disc space-y-1.5 text-sm lg:text-base">
                  {children}
                </ul>
              ),
              ol: ({ children }) => (
                <ol className="text-text-primary mb-3 list-inside list-decimal space-y-1.5 text-sm lg:text-base">
                  {children}
                </ol>
              ),
              li: ({ children }) => <li className="text-sm lg:text-base">{children}</li>,
              strong: ({ children }) => (
                <strong className="text-foreground font-semibold">{children}</strong>
              ),
              em: ({ children }) => <em className="text-text-secondary italic">{children}</em>,
              blockquote: ({ children }) => (
                <blockquote className="border-primary text-text-secondary my-3 border-l-4 pl-4 italic">
                  {children}
                </blockquote>
              ),
              code: ({ className, children }) => {
                const isInline = !className;
                return isInline ? (
                  <code className="bg-primary/10 text-primary rounded px-1.5 py-0.5 font-mono text-xs">
                    {children}
                  </code>
                ) : (
                  <code className={className}>{children}</code>
                );
              },
              pre: ({ children }) => (
                <pre className="bg-surface mb-3 overflow-x-auto rounded-lg p-4 text-xs lg:text-sm">
                  {children}
                </pre>
              ),
              table: ({ children }) => (
                <div className="mb-4 overflow-x-auto">
                  <table className="w-full border-collapse text-sm">{children}</table>
                </div>
              ),
              thead: ({ children }) => (
                <thead className="border-b-2 border-white/20">{children}</thead>
              ),
              tbody: ({ children }) => <tbody>{children}</tbody>,
              tr: ({ children }) => (
                <tr className="hover:bg-foreground/5 border-b border-white/10 transition-colors">
                  {children}
                </tr>
              ),
              th: ({ children }) => (
                <th className="text-foreground px-3 py-2 text-left text-sm font-semibold">
                  {children}
                </th>
              ),
              td: ({ children }) => (
                <td className="text-text-secondary px-3 py-2 text-sm">{children}</td>
              ),
              hr: () => <hr className="my-4 border-white/10" />,
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
            {markdownContent}
          </ReactMarkdown>
        </div>
      </motion.div>
    </div>
  );
}
