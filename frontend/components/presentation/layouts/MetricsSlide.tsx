/**
 * MetricsSlide - KPI and Metrics Display Layout
 *
 * Displays key performance indicators, statistics, and metrics
 * with trend indicators and custom colors.
 */

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { SlideProps, MetricsSlideContent } from '@/types/presentation';

/**
 * Metrics Slide Component
 */
export function MetricsSlide({
  slide,
  isActive,
  isVisible,
  animationPreset = 'fade-in',
  onReady,
  className,
}: SlideProps<MetricsSlideContent>): React.JSX.Element {
  React.useEffect(() => {
    if (isActive) {
      onReady?.();
    }
  }, [isActive, onReady]);

  const layout = slide.layout || 'grid';

  const renderTrendIcon = (trend?: 'up' | 'down' | 'neutral') => {
    if (!trend) return null;

    const iconClass = 'h-5 w-5';
    switch (trend) {
      case 'up':
        return <TrendingUp className={`${iconClass} text-green-400`} />;
      case 'down':
        return <TrendingDown className={`${iconClass} text-red-400`} />;
      case 'neutral':
        return <Minus className={`${iconClass} text-yellow-400`} />;
    }
  };

  const renderMetricCard = (metric: (typeof slide.metrics)[0], index: number) => {
    const bgColor = metric.color || '#14b8a6';

    return (
      <motion.div
        key={metric.id}
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={isVisible ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 30, scale: 0.95 }}
        transition={{ delay: 0.3 + index * 0.1, duration: 0.5 }}
        className="glass-card group relative overflow-hidden p-6 transition-all hover:scale-105"
      >
        {/* Accent Bar */}
        <div className="absolute top-0 left-0 h-full w-1" style={{ backgroundColor: bgColor }} />

        {/* Icon */}
        {metric.icon && (
          <div
            className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg text-2xl"
            style={{
              backgroundColor: `${bgColor}20`,
              color: bgColor,
            }}
          >
            {metric.icon}
          </div>
        )}

        {/* Label */}
        <div className="text-caption text-text-secondary mb-2 tracking-wide uppercase">
          {metric.label}
        </div>

        {/* Value */}
        <div className="mb-2 flex items-baseline gap-2">
          <span className="text-display font-bold text-white">
            {typeof metric.value === 'number' ? metric.value.toLocaleString() : metric.value}
          </span>
          {metric.unit && <span className="text-heading text-text-secondary">{metric.unit}</span>}
        </div>

        {/* Trend */}
        {metric.trend && (
          <div className="flex items-center gap-2">
            {renderTrendIcon(metric.trend)}
            {metric.trendValue !== undefined && (
              <span
                className={`text-caption font-medium ${
                  metric.trend === 'up'
                    ? 'text-green-400'
                    : metric.trend === 'down'
                      ? 'text-red-400'
                      : 'text-yellow-400'
                }`}
              >
                {metric.trend === 'up' ? '+' : metric.trend === 'down' ? '-' : ''}
                {Math.abs(metric.trendValue)}%
              </span>
            )}
          </div>
        )}
      </motion.div>
    );
  };

  return (
    <div
      className={`metrics-slide relative flex h-full w-full items-center justify-center p-12 ${className || ''}`}
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

        {/* Metrics Grid */}
        {layout === 'grid' && (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {slide.metrics.map((metric, index) => renderMetricCard(metric, index))}
          </div>
        )}

        {/* Metrics List */}
        {layout === 'list' && (
          <div className="mx-auto max-w-3xl space-y-4">
            {slide.metrics.map((metric, index) => renderMetricCard(metric, index))}
          </div>
        )}
      </div>
    </div>
  );
}

export default MetricsSlide;
