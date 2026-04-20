'use client';

import React, { useState, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import rehypeHighlight from 'rehype-highlight';
import { ChevronLeft, ChevronRight, List } from 'lucide-react';
import 'highlight.js/styles/tokyo-night-dark.css';
import { MarkdownEditor } from './MarkdownEditor';
import { motion, AnimatePresence } from 'framer-motion';

interface BlueprintRendererProps {
  markdown: string;
  isEditMode?: boolean;
  onSaveMarkdown?: (newMarkdown: string) => Promise<void>;
  onCancelEdit?: () => void;
}

interface MarkdownSection {
  title: string;
  content: string;
  index: number;
}

// Split markdown into logical sections based on H1 and H2 headers
function splitMarkdownIntoSections(markdown: string): MarkdownSection[] {
  const sections: MarkdownSection[] = [];

  // Split by H1 or H2 headers (# or ##)
  const lines = markdown.split('\n');
  let currentSection: { title: string; content: string[] } | null = null;
  let sectionIndex = 0;

  for (const line of lines) {
    // Match H1 (# Title) or H2 (## Title)
    const headerMatch = line.match(/^(#{1,2})\s+(.+)$/);

    if (headerMatch) {
      // Save previous section if exists
      if (currentSection) {
        sections.push({
          title: currentSection.title,
          content: currentSection.content.join('\n'),
          index: sectionIndex++,
        });
      }

      // Start new section
      currentSection = {
        title: headerMatch[2],
        content: [line], // Include the header in the content
      };
    } else if (currentSection) {
      // Add line to current section
      currentSection.content.push(line);
    } else {
      // Before first header - create a default section
      if (!currentSection) {
        currentSection = {
          title: 'Overview',
          content: [line],
        };
      }
    }
  }

  // Save the last section
  if (currentSection) {
    sections.push({
      title: currentSection.title,
      content: currentSection.content.join('\n'),
      index: sectionIndex,
    });
  }

  // If no sections were found, return entire markdown as one section
  if (sections.length === 0) {
    sections.push({
      title: 'Content',
      content: markdown,
      index: 0,
    });
  }

  return sections;
}

export function BlueprintRenderer({
  markdown,
  isEditMode = false,
  onSaveMarkdown,
  onCancelEdit,
}: BlueprintRendererProps): React.JSX.Element {
  const [currentPage, setCurrentPage] = useState(0);
  const [showSectionNav, setShowSectionNav] = useState(false);

  // Split markdown into sections for pagination
  const sections = useMemo(() => splitMarkdownIntoSections(markdown), [markdown]);

  // Reset to first page when markdown changes
  React.useEffect(() => {
    setCurrentPage(0);
  }, [markdown]);

  // Get current section to display
  const currentSection = sections[currentPage] || sections[0];
  const totalPages = sections.length;
  const hasPagination = totalPages > 1;

  // Navigation handlers
  const goToNextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
      // Scroll to top of content
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
      // Scroll to top of content
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const goToPage = (pageIndex: number) => {
    if (pageIndex >= 0 && pageIndex < totalPages) {
      setCurrentPage(pageIndex);
      setShowSectionNav(false);
      // Scroll to top of content
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <article className="blueprint-content">
      {/* Markdown Content with Enhanced Animations */}
      <AnimatePresence mode="wait">
        {isEditMode ? (
          <motion.div
            key="editor"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <MarkdownEditor
              initialMarkdown={markdown}
              onSave={onSaveMarkdown}
              onCancel={onCancelEdit}
            />
          </motion.div>
        ) : (
          <motion.div
            key={`markdown-page-${currentPage}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-8"
          >
            {/* Section Navigation */}
            {hasPagination && (
              <div className="mb-8 flex items-center justify-between gap-4">
                {/* Previous Button */}
                <button
                  onClick={goToPreviousPage}
                  disabled={currentPage === 0}
                  className="group flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white/70 backdrop-blur-xl transition-all hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Previous section"
                >
                  <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
                  <span className="hidden sm:inline">Previous</span>
                </button>

                {/* Section Selector */}
                <div className="relative flex-1">
                  <button
                    onClick={() => setShowSectionNav(!showSectionNav)}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white backdrop-blur-xl transition-all hover:bg-white/10"
                    aria-label="Section navigation"
                  >
                    <List className="h-4 w-4" />
                    <span className="hidden sm:inline">{currentSection.title}</span>
                    <span className="text-text-secondary">
                      {currentPage + 1} / {totalPages}
                    </span>
                  </button>

                  {/* Dropdown */}
                  <AnimatePresence>
                    {showSectionNav && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute top-full right-0 left-0 z-10 mt-2 max-h-80 overflow-y-auto rounded-xl border border-white/10 bg-black/90 backdrop-blur-xl"
                      >
                        {sections.map((section, index) => (
                          <button
                            key={section.index}
                            onClick={() => goToPage(index)}
                            className={`flex w-full items-start gap-3 px-4 py-3 text-left text-sm transition-all hover:bg-white/10 ${
                              index === currentPage
                                ? 'bg-primary/20 text-primary'
                                : 'text-text-secondary'
                            }`}
                          >
                            <span className="text-text-disabled font-mono text-xs">
                              {index + 1}
                            </span>
                            <span className="flex-1">{section.title}</span>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Next Button */}
                <button
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages - 1}
                  className="group flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white/70 backdrop-blur-xl transition-all hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Next section"
                >
                  <span className="hidden sm:inline">Next</span>
                  <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </button>
              </div>
            )}

            {/* Markdown Content */}
            <div className="prose prose-invert prose-lg max-w-none">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw, rehypeSanitize, rehypeHighlight]}
              >
                {currentSection.content}
              </ReactMarkdown>
            </div>

            {/* Bottom Navigation (Duplicate for convenience) */}
            {hasPagination && totalPages > 3 && (
              <div className="mt-12 flex items-center justify-center gap-4">
                <button
                  onClick={goToPreviousPage}
                  disabled={currentPage === 0}
                  className="group flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white/70 backdrop-blur-xl transition-all hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Previous section"
                >
                  <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
                  <span>Previous</span>
                </button>

                <span className="text-text-secondary text-sm">
                  {currentPage + 1} / {totalPages}
                </span>

                <button
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages - 1}
                  className="group flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white/70 backdrop-blur-xl transition-all hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Next section"
                >
                  <span>Next</span>
                  <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </article>
  );
}
