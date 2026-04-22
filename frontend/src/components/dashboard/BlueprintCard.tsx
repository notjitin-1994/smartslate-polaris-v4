'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import {
  Clock,
  CheckCircle,
  AlertCircle,
  Pencil,
  Play,
  Eye,
  Calendar,
  Sparkles,
  TrendingUp,
  Trash2,
  CheckSquare,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { BlueprintRow } from '@/lib/db/blueprints';
import { formatCurrency } from '@/lib/utils/currencyFormatter';

interface BlueprintCardProps {
  blueprint: BlueprintRow;
  index: number;
  onRename: (blueprint: BlueprintRow) => void;
  onResume: (blueprintId: string) => void;
  onDelete: (blueprintId: string) => void;
  questionnaireComplete: boolean;
  isResuming?: boolean;
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onSelect?: (blueprintId: string) => void;
}

export function BlueprintCard({
  blueprint,
  index,
  onRename,
  onResume,
  onDelete,
  questionnaireComplete,
  isResuming = false,
  isSelectionMode = false,
  isSelected = false,
  onSelect,
}: BlueprintCardProps): React.JSX.Element {
  const router = useRouter();
  const [isHovered, setIsHovered] = useState(false);

  // Mouse tracking for interactive spotlight
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);
  };

  // Status configuration
  const statusConfig = {
    draft: {
      icon: Clock,
      label: 'Draft',
      color: 'text-warning',
      bgColor: 'bg-warning/10',
      borderColor: 'border-warning/30',
      glowColor: 'rgba(245, 158, 11, 0.2)',
    },
    generating: {
      icon: Sparkles,
      label: 'Generating',
      color: 'text-secondary',
      bgColor: 'bg-secondary/10',
      borderColor: 'border-secondary/30',
      glowColor: 'rgba(79, 70, 229, 0.2)',
    },
    completed: {
      icon: CheckCircle,
      label: 'Completed',
      color: 'text-success',
      bgColor: 'bg-success/10',
      borderColor: 'border-success/30',
      glowColor: 'rgba(16, 185, 129, 0.2)',
    },
    error: {
      icon: AlertCircle,
      label: 'Error',
      color: 'text-error',
      bgColor: 'bg-error/10',
      borderColor: 'border-error/30',
      glowColor: 'rgba(239, 68, 68, 0.2)',
    },
  };

  const status = statusConfig[blueprint.status as keyof typeof statusConfig] || statusConfig.draft;
  const StatusIcon = status.icon;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZoneName: 'short',
    });
  };

  // Calculate completion percentage (mock for now, can be enhanced with actual data)
  const completionPercentage =
    blueprint.status === 'completed'
      ? 100
      : blueprint.status === 'generating'
        ? 65
        : questionnaireComplete
          ? 40
          : 15;

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: index * 0.08,
        duration: 0.5,
        ease: [0.22, 1, 0.36, 1],
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative"
    >
      {/* Main Card Container - Mobile Responsive Heights */}
      <motion.div
        className={cn(
          'relative overflow-hidden rounded-2xl transition-all duration-300',
          'glass-card min-h-[32rem] border sm:min-h-[34rem] lg:min-h-[36rem]', // Flexible min-heights: allow content to expand naturally
          isSelected && isSelectionMode
            ? 'border-primary bg-primary/5 shadow-primary/20 shadow-lg'
            : isHovered
              ? 'border-primary/30'
              : 'border-white/10'
        )}
        whileHover={{
          y: -4,
          transition: { duration: 0.2 },
        }}
        onClick={() => isSelectionMode && onSelect?.(blueprint.id)}
      >
        {/* Selection Checkbox - Touch-friendly size on mobile */}
        {isSelectionMode && (
          <motion.div
            className="absolute top-3 left-3 z-30"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.button
              onClick={(e) => {
                e.stopPropagation();
                onSelect?.(blueprint.id);
              }}
              className={cn(
                'flex h-9 w-9 items-center justify-center rounded-lg border-2 shadow-sm transition-all duration-200 sm:h-7 sm:w-7',
                isSelected
                  ? 'bg-primary border-primary text-primary-foreground shadow-primary/30'
                  : 'bg-background/90 hover:border-primary/60 hover:bg-background/95 border-white/40 backdrop-blur-sm'
              )}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.15 }}
                >
                  <CheckSquare className="h-5 w-5 sm:h-4 sm:w-4" />
                </motion.div>
              )}
            </motion.button>
          </motion.div>
        )}

        {/* Animated Gradient Background */}
        <motion.div
          className="absolute inset-0 opacity-0 transition-opacity duration-500"
          style={{
            background: `radial-gradient(600px circle at ${mouseX}px ${mouseY}px, ${status.glowColor}, transparent 40%)`,
          }}
          animate={{ opacity: isHovered ? 1 : 0 }}
        />

        {/* Interactive Spotlight */}
        <div className="interactive-spotlight" aria-hidden="true" />

        {/* Card Content - Mobile responsive padding */}
        <div
          className={cn(
            'relative flex min-h-full flex-col space-y-4 sm:space-y-5',
            isSelectionMode ? 'p-4 pl-12 sm:p-6 sm:pl-12' : 'p-4 sm:p-6'
          )}
        >
          {/* Header Section */}
          <div className="flex items-start justify-between gap-4">
            {/* Status Info & Title */}
            <div className="min-w-0 flex-1">
              {/* Status Badge - Mobile responsive sizing */}
              <div className="mb-2 sm:mb-3">
                <motion.div
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold sm:gap-2 sm:px-3 sm:py-2 sm:text-sm',
                    status.bgColor,
                    status.color,
                    'border',
                    status.borderColor
                  )}
                  whileHover={{ scale: 1.05 }}
                >
                  <StatusIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span>{status.label}</span>
                </motion.div>
              </div>

              {/* Title with Edit Button */}
              <div className="group/title relative">
                <div className="flex items-start gap-2">
                  {/* Expandable Title Container - Mobile responsive text size */}
                  <div className="min-w-0 flex-1">
                    <motion.h3
                      className={cn(
                        'font-heading text-base leading-tight font-bold sm:text-lg',
                        'text-white/95',
                        'cursor-pointer select-none',
                        'w-full'
                      )}
                      initial={{ maxHeight: '1.5rem' }}
                      animate={{
                        maxHeight: '1.5rem',
                        lineHeight: '1.25rem',
                      }}
                      whileHover={{
                        maxHeight: '4rem',
                        lineHeight: '1.25rem',
                        scale: [1, 1.02, 1],
                        transition: {
                          duration: 0.4,
                          ease: [0.25, 0.46, 0.45, 0.94],
                          scale: {
                            duration: 0.6,
                            ease: [0.25, 0.46, 0.45, 0.94],
                          },
                        },
                      }}
                      title={blueprint.title || `Blueprint #${blueprint.id.slice(0, 8)}`}
                    >
                      <span className="block w-full truncate group-hover/title:hidden">
                        {blueprint.title || `Blueprint #${blueprint.id.slice(0, 8)}`}
                      </span>
                      <span className="hidden w-full leading-tight break-words group-hover/title:block">
                        {blueprint.title || `Blueprint #${blueprint.id.slice(0, 8)}`}
                      </span>
                    </motion.h3>
                  </div>

                  {/* Edit Title Button - Touch-friendly on mobile */}
                  <motion.button
                    type="button"
                    className={cn(
                      'mt-0.5 flex flex-shrink-0 items-center justify-center',
                      'h-8 w-8 rounded-md sm:h-6 sm:w-6',
                      'text-slate-400 hover:text-slate-300',
                      'hover:bg-slate-700/50',
                      'transition-all duration-200',
                      'opacity-60 hover:opacity-100'
                    )}
                    onClick={() => onRename(blueprint)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    title="Edit title"
                    aria-label="Edit title"
                  >
                    <Pencil className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
                  </motion.button>
                </div>
              </div>
            </div>
          </div>

          {/* Executive Summary Highlight - Mobile responsive */}
          <motion.div
            className="relative"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08 + 0.5, duration: 0.4 }}
          >
            {/* Highlight Container - Responsive height and padding */}
            <div className="glass border-primary/20 min-h-[160px] rounded-xl border p-3 shadow-lg transition-all duration-300 hover:shadow-xl sm:min-h-[170px] sm:p-5">
              {/* Executive Summary Icon & Label - Mobile responsive */}
              <div className="mb-3 flex items-center gap-2 sm:mb-4 sm:gap-3">
                <div className="bg-primary/20 flex h-6 w-6 items-center justify-center rounded-full sm:h-8 sm:w-8">
                  <div className="bg-primary h-2 w-2 animate-pulse rounded-full sm:h-3 sm:w-3" />
                </div>
                <div>
                  <span className="text-primary/80 text-[10px] font-semibold tracking-wider uppercase sm:text-xs">
                    Executive Summary
                  </span>
                  <div className="bg-primary/30 mt-0.5 h-0.5 w-12 sm:mt-1 sm:w-16" />
                </div>
              </div>

              {/* Executive Summary Content - Responsive text size */}
              <div className="space-y-2 sm:space-y-3">
                {/* Executive Summary Text with Inline Continue Reading */}
                <div className="text-xs leading-relaxed text-white/80 sm:text-sm">
                  {(() => {
                    // Extract and truncate executive summary content to 3 lines
                    try {
                      const blueprintData = blueprint.blueprint_json as any;
                      let content = '';

                      if (blueprintData?.executive_summary?.content) {
                        const summaryContent = blueprintData.executive_summary.content;
                        // Ensure it's a string before calling split
                        if (typeof summaryContent === 'string') {
                          content = summaryContent.split('\n\n')[0]?.trim() || '';
                        } else if (typeof summaryContent === 'object') {
                          // If it's an object, try to extract text or convert to string
                          content =
                            summaryContent.text ||
                            summaryContent.summary ||
                            JSON.stringify(summaryContent);
                        }
                      } else if (blueprintData?.executive_summary?.overview) {
                        const overview = blueprintData.executive_summary.overview;
                        content = typeof overview === 'string' ? overview : String(overview);
                      } else if (
                        blueprintData?.executive_summary &&
                        typeof blueprintData.executive_summary === 'string'
                      ) {
                        content = blueprintData.executive_summary;
                      } else if (blueprintData?.description) {
                        const description = blueprintData.description;
                        content =
                          typeof description === 'string' ? description : String(description);
                      } else {
                        content =
                          'This is a placeholder executive summary. The full summary will be available as soon as your learning design is created with AI-Assisted insights.';
                      }

                      // Truncate to exactly 3 lines of text ending with "..."
                      const lines = content.split('\n');
                      let truncatedContent = '';

                      if (lines.length > 3) {
                        // Take first 3 lines and ensure proper truncation
                        const firstThreeLines = lines.slice(0, 3);
                        truncatedContent = firstThreeLines.join('\n');

                        // If the last line is too long, truncate it with "..."
                        const lastLineIndex = truncatedContent.lastIndexOf('\n');
                        if (lastLineIndex !== -1) {
                          const lastLine = truncatedContent.substring(lastLineIndex + 1);
                          if (lastLine.length > 50) {
                            // Approximate characters per line
                            truncatedContent =
                              truncatedContent.substring(0, lastLineIndex + 1) +
                              lastLine.substring(0, 47) +
                              '...';
                          } else {
                            truncatedContent += '...';
                          }
                        }
                      } else if (content.length > 200) {
                        // For single long lines, truncate to 200 chars with "..."
                        truncatedContent = content.substring(0, 197).replace(/\s+\S*$/, '') + '...';
                      } else {
                        truncatedContent = content;
                      }

                      // Check if content ends with "..." to show continue reading, or if it's a draft placeholder
                      const needsContinueReading = truncatedContent.endsWith('...');
                      const isDraftPlaceholder =
                        content ===
                        'This is a placeholder executive summary. The full summary will be available as soon as your learning design is created with AI-Assisted insights.';

                      return (
                        <p className="leading-relaxed">
                          {truncatedContent}
                          {needsContinueReading && (
                            <motion.button
                              className={cn(
                                'ml-1 inline-flex items-center gap-1',
                                'text-primary hover:text-primary-dark text-xs font-medium',
                                'group transition-all duration-200',
                                'hover:underline hover:underline-offset-2'
                              )}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              <span>Continue reading</span>
                              <svg
                                className="h-3 w-3 transition-transform duration-200 group-hover:translate-x-0.5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 5l7 7-7 7"
                                />
                              </svg>
                            </motion.button>
                          )}
                          {isDraftPlaceholder && blueprint.status === 'draft' && (
                            <motion.button
                              className={cn(
                                'ml-1 inline-flex items-center gap-1',
                                'text-primary hover:text-primary-dark text-xs font-medium',
                                'group transition-all duration-200',
                                'hover:underline hover:underline-offset-2'
                              )}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => onResume(blueprint.id)}
                            >
                              <span>Complete blueprint</span>
                              <svg
                                className="h-3 w-3 transition-transform duration-200 group-hover:translate-x-0.5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 5l7 7-7 7"
                                />
                              </svg>
                            </motion.button>
                          )}
                        </p>
                      );
                    } catch {
                      const isDraftPlaceholder = true; // Always show complete button for draft placeholders

                      return (
                        <p className="leading-relaxed">
                          This is a placeholder executive summary. The full summary will be
                          available as soon as your learning design is created with AI-Assisted
                          insights.
                          {isDraftPlaceholder && blueprint.status === 'draft' && (
                            <motion.button
                              className={cn(
                                'ml-1 inline-flex items-center gap-1',
                                'text-primary hover:text-primary-dark text-xs font-medium',
                                'group transition-all duration-200',
                                'hover:underline hover:underline-offset-2'
                              )}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => onResume(blueprint.id)}
                            >
                              <span>Complete blueprint</span>
                              <svg
                                className="h-3 w-3 transition-transform duration-200 group-hover:translate-x-0.5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 5l7 7-7 7"
                                />
                              </svg>
                            </motion.button>
                          )}
                        </p>
                      );
                    }
                  })()}
                </div>

                {/* Summary Metrics */}
                <div className="flex items-start justify-between gap-3 border-t border-white/10 pt-2">
                  <div className="flex flex-shrink-0 items-center gap-2">
                    <div
                      className={cn(
                        'h-2 w-2 animate-pulse rounded-full',
                        blueprint.status === 'completed' ? 'bg-primary' : 'bg-warning'
                      )}
                    />
                    <span className="text-xs font-medium text-white/60">Scope</span>
                  </div>
                  {(() => {
                    // Extract scope information from blueprint data for completed blueprints
                    if (blueprint.status === 'completed' && blueprint.blueprint_json) {
                      try {
                        const blueprintData = blueprint.blueprint_json as any;

                        // Try to find scope information in various sections
                        let scopeInfo = '';

                        // Check target audience for demographic scope
                        if (blueprintData.target_audience?.demographics) {
                          const demographics = blueprintData.target_audience.demographics;
                          const roles = demographics.roles || [];
                          const experienceLevels = demographics.experience_levels || [];
                          const departments = demographics.department_distribution || [];

                          if (roles.length > 0) {
                            scopeInfo += `${roles.length} roles`;
                          }
                          if (experienceLevels.length > 0) {
                            if (scopeInfo) scopeInfo += ', ';
                            scopeInfo += `${experienceLevels.length} exp levels`;
                          }
                          if (departments.length > 0) {
                            if (scopeInfo) scopeInfo += ', ';
                            scopeInfo += `${departments.length} depts`;
                          }
                        }

                        // Check content outline for module count
                        if (blueprintData.content_outline?.modules) {
                          const moduleCount = blueprintData.content_outline.modules.length;
                          if (scopeInfo) scopeInfo += ', ';
                          scopeInfo += `${moduleCount} modules`;
                        }

                        // Check resources for budget/scope indicators
                        if (blueprintData.resources?.budget) {
                          const budget = blueprintData.resources.budget;
                          if (budget.total && scopeInfo) scopeInfo += ', ';
                          if (budget.total) {
                            const currencyCode = budget.currency || 'USD';
                            const formattedBudget = formatCurrency(budget.total, currencyCode);
                            scopeInfo += `${formattedBudget} budget`;
                          }
                        }

                        // If no specific scope info found, try to infer from available sections
                        if (!scopeInfo) {
                          const sections = Object.keys(blueprintData).filter(
                            (key) => key !== 'metadata' && key !== 'executive_summary'
                          );
                          scopeInfo = `${sections.length} sections`;
                        }

                        return (
                          <span className="text-primary min-w-0 text-right text-xs font-bold break-words">
                            {scopeInfo || 'Available'}
                          </span>
                        );
                      } catch {
                        return (
                          <span className="text-warning min-w-0 text-right text-xs font-bold">
                            Unavailable
                          </span>
                        );
                      }
                    }

                    return (
                      <span className="text-warning min-w-0 text-right text-xs font-bold">
                        Unavailable
                      </span>
                    );
                  })()}
                </div>
              </div>

              {/* Subtle Background Pattern */}
              <div className="absolute inset-0 rounded-xl opacity-5">
                <div className="from-primary/10 to-secondary/10 h-full w-full bg-gradient-to-br via-transparent" />
              </div>
            </div>
          </motion.div>

          {/* Spacer to push content to bottom */}
          <div className="flex-1" />

          {/* Blueprint Info - Mobile responsive layout */}
          <div className="mt-auto">
            <div className="flex flex-wrap items-center gap-2 text-[10px] sm:gap-4 sm:text-xs">
              {/* Version */}
              <div className="flex items-center gap-1 sm:gap-1.5">
                <div className="bg-primary h-1 w-1 animate-pulse rounded-full sm:h-1.5 sm:w-1.5" />
                <span
                  className="cursor-help font-medium text-white/60"
                  title={`Version ${blueprint.version}`}
                >
                  v{blueprint.version}
                </span>
              </div>

              {/* Created Date - Shorter format on mobile */}
              <div className="flex items-center gap-1 sm:gap-1.5">
                <div
                  className="cursor-help"
                  title={`Created at ${new Date(blueprint.created_at).toLocaleString()}`}
                >
                  <Calendar className="h-2.5 w-2.5 text-white/40 sm:h-3 sm:w-3" />
                </div>
                <span className="hidden font-medium text-white/60 sm:inline">
                  {formatDate(blueprint.created_at)}
                </span>
                <span className="font-medium text-white/60 sm:hidden">
                  {new Date(blueprint.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </div>

              {/* Updated Date - Hidden on very small screens */}
              {blueprint.updated_at && blueprint.updated_at !== blueprint.created_at && (
                <div className="hidden items-center gap-1 sm:flex sm:gap-1.5">
                  <div
                    className="cursor-help"
                    title={`Updated at ${new Date(blueprint.updated_at).toLocaleString()}`}
                  >
                    <Clock className="h-3 w-3 text-white/40" />
                  </div>
                  <span className="font-medium text-white/60">
                    {formatDate(blueprint.updated_at)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Progress Bar - Now in normal flow */}
          <div className="w-full">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-white/60">Progress</span>
                <motion.span
                  className="text-primary font-bold"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.08 + 0.3 }}
                >
                  {completionPercentage}%
                </motion.span>
              </div>

              <div className="relative h-1.5 overflow-hidden rounded-full bg-white/5">
                <motion.div
                  className="bg-primary absolute inset-y-0 left-0 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${completionPercentage}%` }}
                  transition={{
                    delay: index * 0.08 + 0.4,
                    duration: 1,
                    ease: 'easeOut',
                  }}
                />

                {/* Shimmer effect */}
                <motion.div
                  className="absolute inset-0 bg-white/10"
                  animate={{
                    x: ['-100%', '200%'],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'linear',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Action Buttons - Touch-friendly sizing on mobile */}
          <div className="flex items-end justify-end gap-2 pb-0.5">
            {/* Delete Button - Larger on mobile */}
            <motion.button
              type="button"
              className={cn(
                'flex items-center justify-center',
                'h-11 w-11 rounded-lg sm:h-10 sm:w-10',
                'border-error/30 bg-error/10 border',
                'text-error hover:bg-error/90 hover:border-error hover:text-white',
                'transition-all duration-200'
              )}
              onClick={() => onDelete(blueprint.id)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title="Delete blueprint"
              aria-label="Delete blueprint"
            >
              <Trash2 className="h-4.5 w-4.5 sm:h-4 sm:w-4" />
            </motion.button>

            {/* Status-specific action buttons - Larger touch targets */}
            {blueprint.status === 'draft' && (
              <motion.button
                type="button"
                className={cn(
                  'flex items-center justify-center',
                  'h-11 w-11 rounded-lg sm:h-10 sm:w-10',
                  'bg-secondary hover:bg-secondary-dark',
                  'text-white',
                  'transition-all duration-200',
                  'shadow-secondary/20 hover:shadow-secondary/30 shadow-lg',
                  'disabled:cursor-not-allowed disabled:opacity-50'
                )}
                onClick={() => onResume(blueprint.id)}
                disabled={isResuming}
                whileHover={!isResuming ? { scale: 1.05 } : {}}
                whileTap={!isResuming ? { scale: 0.95 } : {}}
                title={isResuming ? 'Loading...' : 'Resume blueprint'}
                aria-label={isResuming ? 'Loading blueprint' : 'Resume blueprint'}
              >
                {isResuming ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: 'linear',
                    }}
                    className="h-4.5 w-4.5 sm:h-4 sm:w-4"
                  >
                    <Sparkles className="h-4.5 w-4.5 sm:h-4 sm:w-4" />
                  </motion.div>
                ) : (
                  <Play className="h-4.5 w-4.5 sm:h-4 sm:w-4" />
                )}
              </motion.button>
            )}

            {blueprint.status === 'completed' && blueprint.blueprint_markdown && (
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                  href={`/blueprint/${blueprint.id}`}
                  className={cn(
                    'flex items-center justify-center',
                    'h-11 w-11 rounded-lg sm:h-10 sm:w-10',
                    'border border-indigo-400/30 bg-indigo-500/10',
                    'text-indigo-400 hover:border-indigo-400 hover:bg-indigo-500 hover:text-white',
                    'transition-all duration-200'
                  )}
                  title="View Blueprint"
                  aria-label="View Blueprint"
                >
                  <Eye className="h-4.5 w-4.5 sm:h-4 sm:w-4" />
                </Link>
              </motion.div>
            )}

            {blueprint.status === 'generating' && (
              <div
                className={cn(
                  'flex items-center justify-center',
                  'h-11 w-11 rounded-lg sm:h-10 sm:w-10',
                  'border-secondary/30 bg-secondary/10 border',
                  'text-secondary',
                  'transition-all duration-200'
                )}
                title="Processing..."
                aria-label="Blueprint is processing"
              >
                <Sparkles className="h-4.5 w-4.5 sm:h-4 sm:w-4" />
              </div>
            )}
          </div>
        </div>

        {/* Bottom accent line */}
        <motion.div
          className={cn(
            'h-1',
            blueprint.status === 'completed'
              ? 'bg-success'
              : blueprint.status === 'generating'
                ? 'bg-secondary'
                : 'bg-primary'
          )}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: isHovered ? 1 : 0 }}
          transition={{ duration: 0.3 }}
          style={{ originX: 0.5 }}
        />
      </motion.div>

      {/* Hover elevation shadow */}
      <motion.div
        className="absolute inset-0 -z-10 rounded-2xl"
        animate={{
          opacity: isHovered ? 1 : 0,
          scale: isHovered ? 1.02 : 1,
        }}
        transition={{ duration: 0.3 }}
        style={{
          boxShadow: `0 20px 60px -15px ${status.glowColor}`,
          filter: 'blur(20px)',
        }}
      />
    </motion.div>
  );
}
