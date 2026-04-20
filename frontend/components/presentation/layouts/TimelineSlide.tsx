/**
 * TimelineSlide - Chronological Timeline Layout
 *
 * Displays events, milestones, or phases in chronological order
 * with horizontal or vertical orientation.
 */

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, CheckCircle2, Clock, Circle } from 'lucide-react';
import type { SlideProps, TimelineSlideContent } from '@/types/presentation';

/**
 * Timeline Slide Component
 */
export function TimelineSlide({
  slide,
  isActive,
  isVisible,
  animationPreset = 'fade-in',
  onReady,
  className,
}: SlideProps<TimelineSlideContent>): React.JSX.Element {
  React.useEffect(() => {
    if (isActive) {
      onReady?.();
    }
  }, [isActive, onReady]);

  const orientation = slide.orientation || 'horizontal';

  const getStatusIcon = (status?: 'completed' | 'in-progress' | 'upcoming') => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-6 w-6 text-green-400" />;
      case 'in-progress':
        return <Clock className="h-6 w-6 text-yellow-400" />;
      case 'upcoming':
        return <Circle className="h-6 w-6 text-white/30" />;
      default:
        return <Circle className="h-6 w-6 text-white/50" />;
    }
  };

  const getStatusColor = (status?: 'completed' | 'in-progress' | 'upcoming') => {
    switch (status) {
      case 'completed':
        return 'border-green-400 bg-green-400/20';
      case 'in-progress':
        return 'border-yellow-400 bg-yellow-400/20';
      case 'upcoming':
        return 'border-white/20 bg-white/5';
      default:
        return 'border-white/30 bg-white/10';
    }
  };

  return (
    <div
      className={`timeline-slide relative flex h-full w-full items-center justify-center p-12 ${className || ''}`}
    >
      <div className="w-full max-w-6xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: -20 }}
          transition={{ duration: 0.5 }}
          className="mb-12 text-center"
        >
          <h2 className="text-display text-primary mb-3 font-bold">{slide.title}</h2>
          {slide.subtitle && <p className="text-heading text-secondary">{slide.subtitle}</p>}
        </motion.div>

        {/* Timeline */}
        {orientation === 'horizontal' ? (
          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute top-8 right-0 left-0 h-0.5 bg-white/20" />

            {/* Timeline Items */}
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {slide.items.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                  transition={{ delay: 0.3 + index * 0.15, duration: 0.5 }}
                  className="relative"
                >
                  {/* Icon */}
                  <div className="mb-4 flex justify-center">
                    <div
                      className={`flex h-16 w-16 items-center justify-center rounded-full border-2 ${getStatusColor(item.status)}`}
                    >
                      {getStatusIcon(item.status)}
                    </div>
                  </div>

                  {/* Content Card */}
                  <div className="glass-card space-y-2 p-4 text-center">
                    {/* Date/Phase */}
                    {(item.date || item.phase) && (
                      <div className="text-caption text-primary flex items-center justify-center gap-2 font-medium">
                        <Calendar className="h-4 w-4" />
                        <span>{item.date || item.phase}</span>
                      </div>
                    )}

                    {/* Title */}
                    <h3 className="text-body font-semibold text-white">{item.title}</h3>

                    {/* Description */}
                    {item.description && (
                      <p className="text-caption text-text-secondary">{item.description}</p>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        ) : (
          /* Vertical Timeline */
          <div className="mx-auto max-w-3xl">
            <div className="relative space-y-8">
              {/* Timeline Line */}
              <div className="absolute top-0 bottom-0 left-8 w-0.5 bg-white/20" />

              {/* Timeline Items */}
              {slide.items.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -30 }}
                  animate={isVisible ? { opacity: 1, x: 0 } : { opacity: 0, x: -30 }}
                  transition={{ delay: 0.3 + index * 0.15, duration: 0.5 }}
                  className="relative flex gap-6"
                >
                  {/* Icon */}
                  <div
                    className={`flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full border-2 ${getStatusColor(item.status)}`}
                  >
                    {getStatusIcon(item.status)}
                  </div>

                  {/* Content Card */}
                  <div className="glass-card flex-1 space-y-2 p-6">
                    {/* Date/Phase */}
                    {(item.date || item.phase) && (
                      <div className="text-caption text-primary flex items-center gap-2 font-medium">
                        <Calendar className="h-4 w-4" />
                        <span>{item.date || item.phase}</span>
                      </div>
                    )}

                    {/* Title */}
                    <h3 className="text-heading font-semibold text-white">{item.title}</h3>

                    {/* Description */}
                    {item.description && (
                      <p className="text-body text-text-secondary">{item.description}</p>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default TimelineSlide;
