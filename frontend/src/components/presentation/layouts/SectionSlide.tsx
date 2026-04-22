/**
 * SectionSlide - Section Divider Slide Layout
 *
 * Used to introduce new sections or chapters in the presentation.
 * Features section number, title, subtitle, and optional icon/accent color.
 */

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import type { SlideProps, SectionSlideContent } from '@/types/presentation';

/**
 * Section Slide Component
 */
export function SectionSlide({
  slide,
  isActive,
  isVisible,
  animationPreset = 'fade-in',
  onReady,
  className,
}: SlideProps<SectionSlideContent>): React.JSX.Element {
  React.useEffect(() => {
    if (isActive) {
      onReady?.();
    }
  }, [isActive, onReady]);

  const accentColor = slide.accentColor || '#14b8a6'; // Default to brand teal

  return (
    <div
      className={`section-slide relative flex h-full w-full items-center justify-center ${className || ''}`}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, ${accentColor} 1px, transparent 0)`,
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={isVisible ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative max-w-4xl space-y-8 p-12 text-center"
      >
        {/* Section Number */}
        {slide.sectionNumber !== undefined && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: -20 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="flex items-center justify-center gap-4"
          >
            <div className="h-px w-16 bg-gradient-to-r from-transparent via-white/30 to-white/30" />
            <span className="text-body font-medium" style={{ color: accentColor }}>
              Section {slide.sectionNumber}
            </span>
            <div className="h-px w-16 bg-gradient-to-l from-transparent via-white/30 to-white/30" />
          </motion.div>
        )}

        {/* Icon */}
        {slide.icon && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={isVisible ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="flex justify-center"
          >
            <div
              className="flex h-20 w-20 items-center justify-center rounded-2xl text-4xl"
              style={{
                backgroundColor: `${accentColor}20`,
                color: accentColor,
              }}
            >
              {slide.icon}
            </div>
          </motion.div>
        )}

        {/* Title */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="font-heading text-9xl font-bold tracking-tight text-white"
        >
          {slide.title}
        </motion.h2>

        {/* Subtitle */}
        {slide.subtitle && (
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="text-heading mx-auto max-w-2xl text-white/70"
          >
            {slide.subtitle}
          </motion.p>
        )}

        {/* Accent Line */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={isVisible ? { scaleX: 1 } : { scaleX: 0 }}
          transition={{ delay: 0.6, duration: 0.6, ease: 'easeOut' }}
          className="mx-auto h-1 w-32 rounded-full"
          style={{ backgroundColor: accentColor }}
        />
      </motion.div>
    </div>
  );
}

export default SectionSlide;
