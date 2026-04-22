/**
 * SlideRenderer - Renders slide content based on type
 *
 * Handles all slide types: cover, section, content, metrics, module, timeline, resources, chart
 */

'use client';

import React from 'react';
import type {
  SlideContent,
  BaseSlideContent,
  CoverSlideContent,
  SectionSlideContent,
  ContentSlideContent,
  MetricsSlideContent,
  ModuleSlideContent,
  TimelineSlideContent,
  ResourcesSlideContent,
  ChartSlideContent,
} from '@/types/presentation';
import { ArrowUpRight, CheckCircle2, Circle, ExternalLink } from 'lucide-react';
import { InfographicSlide } from './InfographicSlide';

interface SlideRendererProps {
  slide: SlideContent;
}

// ============================================================================
// Cover Slide Component
// ============================================================================

function CoverSlide({ slide }: { slide: CoverSlideContent }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center space-y-6 p-8 text-center md:p-12 lg:p-16">
      {slide.logo && (
        <div className="mb-4">
          <img src={slide.logo} alt="Logo" className="h-16 w-auto md:h-20" />
        </div>
      )}
      <h1 className="xl:text-display-xl text-primary max-w-4xl px-4 text-3xl leading-tight font-bold md:text-4xl lg:text-5xl">
        {slide.mainTitle}
      </h1>
      {slide.subtitle && (
        <p className="text-secondary max-w-3xl px-4 text-lg md:text-xl lg:text-2xl">
          {slide.subtitle}
        </p>
      )}
      <div className="text-text-tertiary mt-8 flex items-center gap-6 text-base md:text-lg">
        {slide.author && <span>{slide.author}</span>}
        {slide.author && slide.date && <span>•</span>}
        {slide.date && <span>{new Date(slide.date).toLocaleDateString()}</span>}
      </div>
    </div>
  );
}

// Note: Section slides are now deprecated - all slides should have content
// This component is kept for backward compatibility but should not be used

// ============================================================================
// Content Slide Component
// ============================================================================

function ContentSlide({ slide }: { slide: ContentSlideContent }) {
  // Check if content is infographic data
  const isInfographic = (() => {
    if (typeof slide.content === 'object' && slide.content !== null) {
      return (slide.content as any).displayType === 'infographic';
    }
    if (typeof slide.content === 'string') {
      try {
        const parsed = JSON.parse(slide.content);
        return parsed && parsed.displayType === 'infographic';
      } catch {
        return false;
      }
    }
    return false;
  })();

  // Use InfographicSlide for infographic content
  if (isInfographic) {
    return <InfographicSlide slide={slide} />;
  }

  // Regular content slide with proper padding
  return (
    <div className="flex h-full w-full flex-col p-8 md:p-10 lg:p-12">
      <div className="mb-6">
        <h1 className="lg:text-display text-primary mb-2 text-3xl font-bold md:text-4xl">
          {slide.title}
        </h1>
        {slide.subtitle && (
          <p className="lg:text-heading text-secondary text-lg md:text-xl">{slide.subtitle}</p>
        )}
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto pr-2">
        {typeof slide.content === 'string' && slide.content && (
          <p className="lg:text-body-lg text-primary text-base md:text-lg">{slide.content}</p>
        )}

        {slide.bullets && slide.bullets.length > 0 && (
          <ul className="space-y-3 md:space-y-4">
            {slide.bullets.map((bullet, index) => (
              <li
                key={index}
                className="lg:text-body-lg text-primary flex items-start gap-3 text-base md:text-lg"
              >
                <span className="text-accent-teal mt-1 flex-shrink-0 text-xl md:text-2xl">•</span>
                <span className="flex-1 break-words">{bullet}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Metrics Slide Component
// ============================================================================

function MetricsSlide({ slide }: { slide: MetricsSlideContent }) {
  return (
    <div className="glass-card h-full w-full space-y-8 p-12">
      <div>
        <h1 className="text-display text-primary mb-2 font-bold">{slide.title}</h1>
        {slide.subtitle && <p className="text-heading text-secondary">{slide.subtitle}</p>}
      </div>

      <div
        className={`grid gap-6 ${
          slide.layout === 'list' ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
        }`}
      >
        {slide.metrics.map((metric) => (
          <div
            key={metric.id}
            className="glass-card-nested space-y-3 p-6"
            style={
              metric.color
                ? {
                    borderTop: `4px solid ${metric.color}`,
                  }
                : undefined
            }
          >
            <div className="flex items-center justify-between">
              {metric.icon && <span className="text-4xl">{metric.icon}</span>}
              {metric.trend && (
                <span
                  className={`text-sm font-semibold ${
                    metric.trend === 'up'
                      ? 'text-success'
                      : metric.trend === 'down'
                        ? 'text-error'
                        : 'text-text-secondary'
                  }`}
                >
                  {metric.trend === 'up' ? '↑' : metric.trend === 'down' ? '↓' : '→'}{' '}
                  {metric.trendValue !== undefined && `${metric.trendValue}%`}
                </span>
              )}
            </div>
            <div className="text-text-secondary text-sm font-medium">{metric.label}</div>
            <div className="text-primary text-4xl font-bold">
              {metric.value}
              {metric.unit && (
                <span className="text-text-tertiary ml-2 text-2xl">{metric.unit}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Module Slide Component
// ============================================================================

function ModuleSlide({ slide }: { slide: ModuleSlideContent }) {
  return (
    <div className="glass-card h-full w-full space-y-8 p-12">
      <div>
        <div className="text-accent-teal mb-2 text-xl font-semibold">
          Module {slide.moduleNumber}
        </div>
        <h1 className="text-display text-primary mb-2 font-bold">{slide.title}</h1>
        {slide.subtitle && <p className="text-heading text-secondary">{slide.subtitle}</p>}
        {slide.estimatedDuration && (
          <p className="text-text-tertiary mt-2 text-lg">⏱️ Duration: {slide.estimatedDuration}</p>
        )}
      </div>

      {slide.objectives && slide.objectives.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-heading text-primary font-semibold">Learning Objectives</h2>
          <ul className="space-y-2">
            {slide.objectives.map((objective, index) => (
              <li key={index} className="text-body text-primary flex items-start gap-3">
                <CheckCircle2 className="text-success mt-1 h-5 w-5 flex-shrink-0" />
                <span>{objective}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {slide.topics && slide.topics.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-heading text-primary font-semibold">Topics Covered</h2>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {slide.topics.map((topic) => (
              <div
                key={topic.id}
                className={`glass-card-nested flex items-center gap-3 p-4 ${
                  topic.completed ? 'opacity-60' : ''
                }`}
              >
                {topic.completed ? (
                  <CheckCircle2 className="text-success h-5 w-5 flex-shrink-0" />
                ) : (
                  <Circle className="text-text-tertiary h-5 w-5 flex-shrink-0" />
                )}
                <span className="text-body text-primary">{topic.title}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Timeline Slide Component
// ============================================================================

function TimelineSlide({ slide }: { slide: TimelineSlideContent }) {
  const isHorizontal = slide.orientation !== 'vertical';

  return (
    <div className="glass-card h-full w-full space-y-8 p-12">
      <div>
        <h1 className="text-display text-primary mb-2 font-bold">{slide.title}</h1>
        {slide.subtitle && <p className="text-heading text-secondary">{slide.subtitle}</p>}
      </div>

      <div className={`${isHorizontal ? 'flex gap-4 overflow-x-auto pb-4' : 'space-y-6'}`}>
        {slide.items.map((item, index) => (
          <div
            key={item.id}
            className={`glass-card-nested relative ${
              isHorizontal ? 'min-w-[300px] flex-shrink-0' : 'w-full'
            } p-6`}
          >
            {/* Status indicator */}
            <div
              className={`absolute top-0 left-0 h-full w-1 ${
                item.status === 'completed'
                  ? 'bg-success'
                  : item.status === 'in-progress'
                    ? 'bg-accent-teal'
                    : 'bg-background-tertiary'
              }`}
            />

            <div className="ml-4 space-y-2">
              <div className="flex items-center gap-2">
                {item.phase && (
                  <span className="text-accent-teal text-sm font-semibold">{item.phase}</span>
                )}
                {item.date && <span className="text-text-tertiary text-sm">{item.date}</span>}
              </div>
              <h3 className="text-heading-sm text-primary font-semibold">{item.title}</h3>
              {item.description && <p className="text-body text-secondary">{item.description}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Resources Slide Component
// ============================================================================

function ResourcesSlide({ slide }: { slide: ResourcesSlideContent }) {
  return (
    <div className="glass-card h-full w-full space-y-8 p-12">
      <div>
        <h1 className="text-display text-primary mb-2 font-bold">{slide.title}</h1>
        {slide.subtitle && <p className="text-heading text-secondary">{slide.subtitle}</p>}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {slide.resources.map((resource) => (
          <div
            key={resource.id}
            className="glass-card-nested group p-6 transition-all hover:scale-105"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <span className="text-4xl">{resource.icon || '📎'}</span>
                {resource.url && (
                  <ExternalLink className="text-text-tertiary h-5 w-5 opacity-0 transition-opacity group-hover:opacity-100" />
                )}
              </div>
              <div>
                <h3 className="text-heading-sm text-primary font-semibold">{resource.title}</h3>
                {resource.description && (
                  <p className="text-body-sm text-secondary mt-1 line-clamp-2">
                    {resource.description}
                  </p>
                )}
              </div>
              <div className="text-text-tertiary text-xs tracking-wider uppercase">
                {resource.type}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Chart Slide Component (Placeholder)
// ============================================================================

function ChartSlide({ slide }: { slide: ChartSlideContent }) {
  return (
    <div className="glass-card h-full w-full space-y-8 p-12">
      <div>
        <h1 className="text-display text-primary mb-2 font-bold">{slide.title}</h1>
        {slide.subtitle && <p className="text-heading text-secondary">{slide.subtitle}</p>}
      </div>
      <div className="text-text-secondary flex h-96 items-center justify-center rounded-lg border border-dashed border-white/20 text-lg">
        Chart visualization: {slide.chartType} (Coming soon)
      </div>
    </div>
  );
}

// ============================================================================
// Main SlideRenderer Component
// ============================================================================

export function SlideRenderer({ slide }: SlideRendererProps): React.JSX.Element {
  switch (slide.type) {
    case 'cover':
      return <CoverSlide slide={slide} />;
    case 'section':
      // Convert section slides to content slides with proper formatting
      const sectionSlide = slide as SectionSlideContent;
      const contentSlide: ContentSlideContent = {
        ...sectionSlide,
        type: 'content',
        content: sectionSlide.icon ? sectionSlide.icon : undefined,
        bullets: undefined,
        layout: 'single-column',
      };
      return <ContentSlide slide={contentSlide} />;
    case 'content':
      return <ContentSlide slide={slide} />;
    case 'metrics':
      return <MetricsSlide slide={slide} />;
    case 'module':
      return <ModuleSlide slide={slide} />;
    case 'timeline':
      return <TimelineSlide slide={slide} />;
    case 'resources':
      return <ResourcesSlide slide={slide} />;
    case 'chart':
      return <ChartSlide slide={slide} />;
    default: {
      // Fallback for unknown slide types - use type assertion
      const unknownSlide = slide as BaseSlideContent;
      return (
        <div className="glass-card h-full w-full space-y-6 p-12">
          <h1 className="text-display text-primary font-bold">{unknownSlide.title}</h1>
          {unknownSlide.subtitle && (
            <p className="text-heading text-secondary">{unknownSlide.subtitle}</p>
          )}
        </div>
      );
    }
  }
}

export default SlideRenderer;
