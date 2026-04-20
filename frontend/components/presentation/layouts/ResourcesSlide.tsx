/**
 * ResourcesSlide - Resources and References Layout
 *
 * Displays links, documents, videos, tools, and other learning resources
 * with categorization and type icons.
 */

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Link2, FileText, Video, Wrench, ExternalLink } from 'lucide-react';
import type { SlideProps, ResourcesSlideContent } from '@/types/presentation';

/**
 * Resources Slide Component
 */
export function ResourcesSlide({
  slide,
  isActive,
  isVisible,
  animationPreset = 'fade-in',
  onReady,
  className,
}: SlideProps<ResourcesSlideContent>): React.JSX.Element {
  React.useEffect(() => {
    if (isActive) {
      onReady?.();
    }
  }, [isActive, onReady]);

  const getTypeIcon = (type: 'link' | 'document' | 'video' | 'tool' | 'other') => {
    const iconClass = 'h-5 w-5';
    switch (type) {
      case 'link':
        return <Link2 className={iconClass} />;
      case 'document':
        return <FileText className={iconClass} />;
      case 'video':
        return <Video className={iconClass} />;
      case 'tool':
        return <Wrench className={iconClass} />;
      default:
        return <Link2 className={iconClass} />;
    }
  };

  const getTypeColor = (type: 'link' | 'document' | 'video' | 'tool' | 'other') => {
    switch (type) {
      case 'link':
        return '#3b82f6'; // Blue
      case 'document':
        return '#8b5cf6'; // Purple
      case 'video':
        return '#ec4899'; // Pink
      case 'tool':
        return '#14b8a6'; // Teal (brand color)
      default:
        return '#6b7280'; // Gray
    }
  };

  // Group resources by type if categories exist
  const groupedResources = slide.categories
    ? slide.categories.reduce(
        (acc, category) => {
          acc[category] = slide.resources.filter((r) => r.type === category);
          return acc;
        },
        {} as Record<string, typeof slide.resources>
      )
    : { All: slide.resources };

  return (
    <div
      className={`resources-slide relative flex h-full w-full items-center justify-center p-12 ${className || ''}`}
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

        {/* Resources Grid */}
        {!slide.categories && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {slide.resources.map((resource, index) => (
              <motion.a
                key={resource.id}
                href={resource.url || '#'}
                target={resource.url ? '_blank' : undefined}
                rel={resource.url ? 'noopener noreferrer' : undefined}
                initial={{ opacity: 0, y: 20 }}
                animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{ delay: 0.3 + index * 0.1, duration: 0.5 }}
                className={`glass-card group flex gap-4 p-6 transition-all ${
                  resource.url
                    ? 'hover:border-primary/50 cursor-pointer hover:scale-105'
                    : 'cursor-default'
                }`}
              >
                {/* Icon */}
                <div
                  className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg"
                  style={{
                    backgroundColor: `${getTypeColor(resource.type)}20`,
                    color: getTypeColor(resource.type),
                  }}
                >
                  {resource.icon || getTypeIcon(resource.type)}
                </div>

                {/* Content */}
                <div className="flex-1 space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-body group-hover:text-primary font-semibold text-white">
                      {resource.title}
                    </h3>
                    {resource.url && (
                      <ExternalLink className="group-hover:text-primary h-4 w-4 flex-shrink-0 text-white/40 transition-colors" />
                    )}
                  </div>
                  {resource.description && (
                    <p className="text-caption text-text-secondary line-clamp-2">
                      {resource.description}
                    </p>
                  )}
                  <div
                    className="text-caption font-medium capitalize"
                    style={{ color: getTypeColor(resource.type) }}
                  >
                    {resource.type}
                  </div>
                </div>
              </motion.a>
            ))}
          </div>
        )}

        {/* Categorized Resources */}
        {slide.categories && (
          <div className="space-y-8">
            {Object.entries(groupedResources).map(([category, resources], categoryIndex) => (
              <motion.div
                key={category}
                initial={{ opacity: 0, y: 30 }}
                animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                transition={{ delay: 0.2 + categoryIndex * 0.15, duration: 0.5 }}
                className="space-y-4"
              >
                <h3 className="text-heading text-primary font-semibold">{category}</h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {resources.map((resource, index) => (
                    <motion.a
                      key={resource.id}
                      href={resource.url || '#'}
                      target={resource.url ? '_blank' : undefined}
                      rel={resource.url ? 'noopener noreferrer' : undefined}
                      initial={{ opacity: 0, x: -20 }}
                      animate={isVisible ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
                      transition={{
                        delay: 0.3 + categoryIndex * 0.15 + index * 0.08,
                        duration: 0.4,
                      }}
                      className={`glass-card group flex gap-4 p-4 transition-all ${
                        resource.url
                          ? 'hover:border-primary/50 cursor-pointer hover:scale-105'
                          : 'cursor-default'
                      }`}
                    >
                      <div
                        className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg"
                        style={{
                          backgroundColor: `${getTypeColor(resource.type)}20`,
                          color: getTypeColor(resource.type),
                        }}
                      >
                        {resource.icon || getTypeIcon(resource.type)}
                      </div>
                      <div className="flex-1 space-y-1">
                        <h4 className="text-body group-hover:text-primary font-medium text-white">
                          {resource.title}
                        </h4>
                        {resource.description && (
                          <p className="text-caption text-text-secondary line-clamp-1">
                            {resource.description}
                          </p>
                        )}
                      </div>
                      {resource.url && (
                        <ExternalLink className="group-hover:text-primary h-4 w-4 flex-shrink-0 text-white/40 transition-colors" />
                      )}
                    </motion.a>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ResourcesSlide;
