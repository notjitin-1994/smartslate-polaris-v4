/**
 * ContentSlide - General Content Slide Layout
 *
 * Flexible layout for text content, bullets, and images.
 * Supports multiple layout modes: single-column, two-column, centered.
 */

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import type { SlideProps, ContentSlideContent } from '@/types/presentation';

/**
 * Content Slide Component
 */
export function ContentSlide({
  slide,
  isActive,
  isVisible,
  animationPreset = 'fade-in',
  onReady,
  className,
}: SlideProps<ContentSlideContent>): React.JSX.Element {
  React.useEffect(() => {
    if (isActive) {
      onReady?.();
    }
  }, [isActive, onReady]);

  const layout = slide.layout || 'single-column';

  const renderContent = () => {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="space-y-6"
      >
        {/* Main Content */}
        {typeof slide.content === 'string' ? (
          <div className="prose prose-invert max-w-none">
            <p className="text-body text-text-secondary leading-relaxed">{slide.content}</p>
          </div>
        ) : (
          <div className="text-text-secondary">{slide.content}</div>
        )}

        {/* Bullet Points */}
        {slide.bullets && slide.bullets.length > 0 && (
          <ul className="space-y-4">
            {slide.bullets.map((bullet, index) => (
              <motion.li
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={isVisible ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
                transition={{ delay: 0.4 + index * 0.1, duration: 0.4 }}
                className="flex gap-3"
              >
                <span className="text-primary mt-1 flex-shrink-0 text-xl">▸</span>
                <span className="text-body text-text-secondary leading-relaxed">{bullet}</span>
              </motion.li>
            ))}
          </ul>
        )}
      </motion.div>
    );
  };

  const renderImage = () => {
    if (!slide.image) return null;

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={isVisible ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="flex items-center justify-center"
      >
        <img
          src={slide.image.src}
          alt={slide.image.alt}
          className="h-auto max-h-96 w-auto max-w-full rounded-lg object-contain shadow-lg"
        />
      </motion.div>
    );
  };

  return (
    <div
      className={`content-slide relative flex h-full w-full items-center justify-center p-12 ${className || ''}`}
    >
      <div className="w-full max-w-6xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: -20 }}
          transition={{ duration: 0.5 }}
          className="mb-12 space-y-3"
        >
          <h2 className="text-display text-primary font-bold">{slide.title}</h2>
          {slide.subtitle && <p className="text-heading text-secondary">{slide.subtitle}</p>}
        </motion.div>

        {/* Content Layout */}
        {layout === 'single-column' && (
          <div className="space-y-8">
            {renderContent()}
            {slide.image && slide.image.position !== 'background' && renderImage()}
          </div>
        )}

        {layout === 'two-column' && (
          <div className="grid grid-cols-2 gap-12">
            <div>{renderContent()}</div>
            {slide.image && <div>{renderImage()}</div>}
          </div>
        )}

        {layout === 'centered' && (
          <div className="mx-auto max-w-3xl space-y-8 text-center">
            {renderContent()}
            {slide.image && renderImage()}
          </div>
        )}
      </div>

      {/* Background Image */}
      {slide.image && slide.image.position === 'background' && (
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url(${slide.image.src})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
      )}
    </div>
  );
}

export default ContentSlide;
