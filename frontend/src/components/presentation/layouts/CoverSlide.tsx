/**
 * CoverSlide - Title/Introduction Slide Layout
 *
 * Displays the presentation title, subtitle, author, date, and optional
 * background image or logo. Used for opening slides.
 */

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import type { SlideProps, CoverSlideContent } from '@/types/presentation';

/**
 * Cover Slide Component
 */
export function CoverSlide({
  slide,
  isActive,
  isVisible,
  animationPreset = 'fade-in',
  onReady,
  className,
}: SlideProps<CoverSlideContent>): React.JSX.Element {
  React.useEffect(() => {
    if (isActive) {
      onReady?.();
    }
  }, [isActive, onReady]);

  const containerVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.6, ease: 'easeOut' },
    },
  } as const;

  // Use inline animation instead of dynamic variants for staggered effect

  return (
    <div
      className={`cover-slide relative flex h-full w-full items-center justify-center ${className || ''}`}
      style={
        slide.backgroundImage
          ? {
              backgroundImage: `linear-gradient(rgba(2, 12, 27, 0.8), rgba(2, 12, 27, 0.8)), url(${slide.backgroundImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }
          : undefined
      }
    >
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate={isVisible ? 'visible' : 'hidden'}
        className="max-w-5xl space-y-12 p-12 text-center"
      >
        {/* Logo */}
        {slide.logo && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ delay: 0, duration: 0.5, ease: 'easeOut' }}
            className="flex justify-center"
          >
            <img src={slide.logo} alt="Logo" className="h-16 w-auto opacity-90" />
          </motion.div>
        )}

        {/* Main Title */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ delay: 0.15, duration: 0.5, ease: 'easeOut' }}
          className="font-heading text-10xl lg:text-11xl font-bold tracking-tight text-white"
        >
          {slide.mainTitle}
        </motion.h1>

        {/* Subtitle */}
        {slide.subtitle && (
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ delay: 0.3, duration: 0.5, ease: 'easeOut' }}
            className="text-heading mx-auto max-w-3xl leading-relaxed text-white/80"
          >
            {slide.subtitle}
          </motion.p>
        )}

        {/* Metadata Row */}
        {(slide.author || slide.date) && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ delay: 0.45, duration: 0.5, ease: 'easeOut' }}
            className="flex items-center justify-center gap-8 pt-8"
          >
            {slide.author && (
              <div className="text-body text-text-secondary">
                <span className="text-white/50">By</span>{' '}
                <span className="text-primary font-medium">{slide.author}</span>
              </div>
            )}
            {slide.author && slide.date && <div className="h-1 w-1 rounded-full bg-white/30" />}
            {slide.date && (
              <div className="text-body text-text-secondary">
                {new Date(slide.date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* Decorative Accent */}
        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={isVisible ? { opacity: 1, scaleX: 1 } : { opacity: 0, scaleX: 0 }}
          transition={{ delay: 0.6, duration: 0.6, ease: 'easeOut' }}
          className="bg-primary mx-auto h-1 w-24 rounded-full"
        />
      </motion.div>
    </div>
  );
}

export default CoverSlide;
