/**
 * ChartSlide - Data Visualization Layout
 *
 * Displays data charts using Recharts library.
 * Supports bar, line, pie, radar, and area charts.
 */

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  RadarChart,
  Radar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from 'recharts';
import type { SlideProps, ChartSlideContent } from '@/types/presentation';

/**
 * Chart Slide Component
 */
export function ChartSlide({
  slide,
  isActive,
  isVisible,
  animationPreset = 'fade-in',
  onReady,
  className,
}: SlideProps<ChartSlideContent>): React.JSX.Element {
  React.useEffect(() => {
    if (isActive) {
      onReady?.();
    }
  }, [isActive, onReady]);

  const defaultColors = slide.colors || [
    '#14b8a6', // Brand teal
    '#3b82f6', // Blue
    '#8b5cf6', // Purple
    '#ec4899', // Pink
    '#f59e0b', // Amber
    '#10b981', // Green
  ];

  const renderChart = () => {
    const commonProps = {
      data: slide.data,
    };

    switch (slide.chartType) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis
                dataKey={slide.xAxis || 'name'}
                stroke="rgba(255,255,255,0.5)"
                tick={{ fill: 'rgba(255,255,255,0.7)' }}
              />
              <YAxis stroke="rgba(255,255,255,0.5)" tick={{ fill: 'rgba(255,255,255,0.7)' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(2, 12, 27, 0.95)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  color: '#fff',
                }}
              />
              {slide.legend && <Legend wrapperStyle={{ color: '#fff' }} />}
              {Object.keys(slide.data[0] || {})
                .filter((key) => key !== (slide.xAxis || 'name'))
                .map((key, index) => (
                  <Bar key={key} dataKey={key} fill={defaultColors[index % defaultColors.length]} />
                ))}
            </BarChart>
          </ResponsiveContainer>
        );

      case 'line':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis
                dataKey={slide.xAxis || 'name'}
                stroke="rgba(255,255,255,0.5)"
                tick={{ fill: 'rgba(255,255,255,0.7)' }}
              />
              <YAxis stroke="rgba(255,255,255,0.5)" tick={{ fill: 'rgba(255,255,255,0.7)' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(2, 12, 27, 0.95)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  color: '#fff',
                }}
              />
              {slide.legend && <Legend wrapperStyle={{ color: '#fff' }} />}
              {Object.keys(slide.data[0] || {})
                .filter((key) => key !== (slide.xAxis || 'name'))
                .map((key, index) => (
                  <Line
                    key={key}
                    type="monotone"
                    dataKey={key}
                    stroke={defaultColors[index % defaultColors.length]}
                    strokeWidth={2}
                    dot={{ fill: defaultColors[index % defaultColors.length], r: 4 }}
                  />
                ))}
            </LineChart>
          </ResponsiveContainer>
        );

      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={slide.data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => entry.name}
                outerRadius={140}
                fill="#8884d8"
                dataKey={slide.yAxis || 'value'}
              >
                {slide.data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={defaultColors[index % defaultColors.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(2, 12, 27, 0.95)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  color: '#fff',
                }}
              />
              {slide.legend && <Legend wrapperStyle={{ color: '#fff' }} />}
            </PieChart>
          </ResponsiveContainer>
        );

      case 'radar':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <RadarChart {...commonProps}>
              <PolarGrid stroke="rgba(255,255,255,0.2)" />
              <PolarAngleAxis
                dataKey={slide.xAxis || 'name'}
                tick={{ fill: 'rgba(255,255,255,0.7)' }}
              />
              <PolarRadiusAxis tick={{ fill: 'rgba(255,255,255,0.7)' }} />
              {Object.keys(slide.data[0] || {})
                .filter((key) => key !== (slide.xAxis || 'name'))
                .map((key, index) => (
                  <Radar
                    key={key}
                    name={key}
                    dataKey={key}
                    stroke={defaultColors[index % defaultColors.length]}
                    fill={defaultColors[index % defaultColors.length]}
                    fillOpacity={0.3}
                  />
                ))}
              {slide.legend && <Legend wrapperStyle={{ color: '#fff' }} />}
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(2, 12, 27, 0.95)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  color: '#fff',
                }}
              />
            </RadarChart>
          </ResponsiveContainer>
        );

      case 'area':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis
                dataKey={slide.xAxis || 'name'}
                stroke="rgba(255,255,255,0.5)"
                tick={{ fill: 'rgba(255,255,255,0.7)' }}
              />
              <YAxis stroke="rgba(255,255,255,0.5)" tick={{ fill: 'rgba(255,255,255,0.7)' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(2, 12, 27, 0.95)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  color: '#fff',
                }}
              />
              {slide.legend && <Legend wrapperStyle={{ color: '#fff' }} />}
              {Object.keys(slide.data[0] || {})
                .filter((key) => key !== (slide.xAxis || 'name'))
                .map((key, index) => (
                  <Area
                    key={key}
                    type="monotone"
                    dataKey={key}
                    stroke={defaultColors[index % defaultColors.length]}
                    fill={defaultColors[index % defaultColors.length]}
                    fillOpacity={0.6}
                  />
                ))}
            </AreaChart>
          </ResponsiveContainer>
        );

      default:
        return <div className="text-white/50">Unsupported chart type</div>;
    }
  };

  return (
    <div
      className={`chart-slide relative flex h-full w-full items-center justify-center p-12 ${className || ''}`}
    >
      <div className="w-full max-w-6xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: -20 }}
          transition={{ duration: 0.5 }}
          className="mb-8 text-center"
        >
          <h2 className="text-display text-primary mb-3 font-bold">{slide.title}</h2>
          {slide.subtitle && <p className="text-heading text-secondary">{slide.subtitle}</p>}
        </motion.div>

        {/* Chart Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={isVisible ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="glass-card p-8"
        >
          {renderChart()}
        </motion.div>

        {/* Annotations */}
        {slide.annotations && slide.annotations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="mt-6 space-y-2"
          >
            {slide.annotations.map((annotation, index) => (
              <div key={index} className="text-caption flex items-center gap-2 text-white/70">
                <span className="text-primary">•</span>
                <span>
                  {annotation.label} ({annotation.x}, {annotation.y})
                </span>
              </div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default ChartSlide;
