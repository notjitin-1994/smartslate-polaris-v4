/**
 * ModuleSlide - Learning Module Overview Layout
 *
 * Displays module/chapter information with objectives, estimated duration,
 * and topic list with completion tracking.
 */

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Clock, CheckCircle2, Circle } from 'lucide-react';
import type { SlideProps, ModuleSlideContent } from '@/types/presentation';

/**
 * Module Slide Component
 */
export function ModuleSlide({
  slide,
  isActive,
  isVisible,
  animationPreset = 'fade-in',
  onReady,
  className,
}: SlideProps<ModuleSlideContent>): React.JSX.Element {
  React.useEffect(() => {
    if (isActive) {
      onReady?.();
    }
  }, [isActive, onReady]);

  return (
    <div
      className={`module-slide relative flex h-full w-full items-center justify-center p-12 ${className || ''}`}
    >
      <div className="w-full max-w-5xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: -20 }}
          transition={{ duration: 0.5 }}
          className="mb-12 space-y-4"
        >
          {/* Module Number Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={isVisible ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="bg-primary/20 border-primary/30 inline-flex items-center gap-2 rounded-lg border px-4 py-2"
          >
            <BookOpen className="text-primary h-5 w-5" />
            <span className="text-primary text-sm font-medium">Module {slide.moduleNumber}</span>
          </motion.div>

          {/* Title */}
          <h2 className="text-display text-primary font-bold">{slide.title}</h2>

          {/* Subtitle & Duration */}
          <div className="flex items-center gap-6">
            {slide.subtitle && <p className="text-heading text-secondary">{slide.subtitle}</p>}
            {slide.estimatedDuration && (
              <div className="flex items-center gap-2 text-white/60">
                <Clock className="h-4 w-4" />
                <span className="text-caption">{slide.estimatedDuration}</span>
              </div>
            )}
          </div>
        </motion.div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Learning Objectives */}
          {slide.objectives && slide.objectives.length > 0 && (
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={isVisible ? { opacity: 1, x: 0 } : { opacity: 0, x: -30 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="glass-card space-y-4 p-6"
            >
              <h3 className="text-heading text-primary flex items-center gap-2 font-semibold">
                <span className="bg-primary/20 flex h-8 w-8 items-center justify-center rounded-lg">
                  🎯
                </span>
                Learning Objectives
              </h3>
              <ul className="space-y-3">
                {slide.objectives.map((objective, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={isVisible ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
                    transition={{ delay: 0.4 + index * 0.1, duration: 0.4 }}
                    className="flex gap-3"
                  >
                    <span className="text-primary mt-1 flex-shrink-0">▸</span>
                    <span className="text-body text-text-secondary">{objective}</span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          )}

          {/* Topics */}
          {slide.topics && slide.topics.length > 0 && (
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={isVisible ? { opacity: 1, x: 0 } : { opacity: 0, x: 30 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="glass-card space-y-4 p-6"
            >
              <h3 className="text-heading text-primary flex items-center gap-2 font-semibold">
                <span className="bg-primary/20 flex h-8 w-8 items-center justify-center rounded-lg">
                  📚
                </span>
                Topics Covered
              </h3>
              <ul className="space-y-3">
                {slide.topics.map((topic, index) => (
                  <motion.li
                    key={topic.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
                    transition={{ delay: 0.4 + index * 0.1, duration: 0.4 }}
                    className="flex items-center gap-3"
                  >
                    {topic.completed ? (
                      <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-green-400" />
                    ) : (
                      <Circle className="h-5 w-5 flex-shrink-0 text-white/30" />
                    )}
                    <span
                      className={`text-body ${
                        topic.completed ? 'text-white/90' : 'text-text-secondary'
                      }`}
                    >
                      {topic.title}
                    </span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ModuleSlide;
