/**
 * ImpactMetricCard - Premium Analytics Widget for Impact Metrics
 *
 * Features:
 * - High-end glassmorphism with depth
 * - Contextual data visualizations
 * - Smooth micro-interactions
 * - WCAG AA compliant
 * - Touch-friendly (48px+ targets)
 */

'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface ImpactMetricCardProps {
  value: string | number;
  suffix?: string;
  label: string;
  index: number;
}

export function ImpactMetricCard({ value, suffix, label, index }: ImpactMetricCardProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Determine visualization type based on metric context
  const metricType = label.toLowerCase();
  const isSpeedMetric = metricType.includes('faster') || metricType.includes('speed');
  const isTimeMetric = metricType.includes('time') && !metricType.includes('faster');
  const isQualityMetric = metricType.includes('quality') || metricType.includes('consistency');
  const isCostMetric = metricType.includes('cost') || metricType.includes('savings');
  const isOnboardingMetric = metricType.includes('onboarding');
  const isContentMetric =
    metricType.includes('questions') ||
    metricType.includes('activities') ||
    metricType.includes('content');
  const isFormatMetric = metricType.includes('export') || metricType.includes('format');

  // Extract numeric value for visualizations
  const numericValue = typeof value === 'string' ? parseInt(value) : value;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{
        opacity: mounted ? 1 : 0,
        y: mounted ? 0 : 20,
        scale: mounted ? 1 : 0.95,
      }}
      transition={{
        delay: 0.1 + index * 0.08,
        duration: 0.5,
        ease: [0.16, 1, 0.3, 1], // Custom easing for premium feel
      }}
      whileHover={{
        scale: 1.02,
        transition: { duration: 0.2 },
      }}
      className="group relative cursor-default overflow-hidden rounded-xl"
      style={{
        background: 'linear-gradient(135deg, rgba(13, 27, 42, 0.6) 0%, rgba(13, 27, 42, 0.4) 100%)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        boxShadow: `
          0 8px 32px rgba(0, 0, 0, 0.3),
          0 1px 0 rgba(167, 218, 219, 0.1) inset,
          0 -1px 0 rgba(167, 218, 219, 0.05) inset
        `,
        border: '1px solid rgba(167, 218, 219, 0.12)',
      }}
    >
      {/* Ambient Glow Effect */}
      <div
        className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background:
            'radial-gradient(circle at 50% 0%, rgba(167, 218, 219, 0.08), transparent 70%)',
        }}
        aria-hidden="true"
      />

      {/* Gradient Border Shine */}
      <div
        className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background:
            'linear-gradient(135deg, rgba(167, 218, 219, 0.2) 0%, transparent 50%, rgba(79, 70, 229, 0.1) 100%)',
          maskImage: 'linear-gradient(to bottom, black, transparent)',
          WebkitMaskImage: 'linear-gradient(to bottom, black, transparent)',
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 p-5">
        {/* Value Display */}
        <div className="mb-4">
          <motion.div
            className="font-heading text-4xl leading-none font-extrabold tracking-tight"
            style={{
              background: 'linear-gradient(135deg, #a7dadb 0%, #d0edf0 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              filter: 'drop-shadow(0 2px 8px rgba(167, 218, 219, 0.25))',
            }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: mounted ? 1 : 0, y: mounted ? 0 : 10 }}
            transition={{ delay: 0.2 + index * 0.08, duration: 0.6 }}
          >
            {value}
            {suffix && <span className="ml-0.5 text-2xl font-bold">{suffix}</span>}
          </motion.div>
          <div
            className="mt-1.5 text-[11px] font-semibold tracking-widest uppercase"
            style={{ color: 'rgba(176, 197, 198, 0.9)' }}
          >
            {label}
          </div>
        </div>

        {/* Contextual Visualization */}
        <div className="relative h-16" aria-hidden="true">
          {/* SPEED METRICS: Velocity Wave */}
          {isSpeedMetric && (
            <svg
              className="h-full w-full"
              viewBox="0 0 120 64"
              fill="none"
              style={{ overflow: 'visible' }}
            >
              <defs>
                <linearGradient id={`speedGradient-${index}`} x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="rgba(167, 218, 219, 0.1)" />
                  <stop offset="50%" stopColor="rgba(167, 218, 219, 0.4)" />
                  <stop offset="100%" stopColor="rgba(167, 218, 219, 0.8)" />
                </linearGradient>
                <filter id={`glow-${index}`}>
                  <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Speed trails */}
              {[0, 1, 2].map((trail) => (
                <motion.path
                  key={trail}
                  d={`M 0 ${32 + trail * 6} Q 30 ${28 + trail * 6}, 60 ${32 + trail * 6} T 120 ${32 + trail * 6}`}
                  stroke={`url(#speedGradient-${index})`}
                  strokeWidth={2 - trail * 0.3}
                  strokeLinecap="round"
                  fill="none"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 0.8 - trail * 0.2 }}
                  transition={{
                    delay: 0.3 + index * 0.08 + trail * 0.1,
                    duration: 1.2,
                    ease: 'easeOut',
                  }}
                  style={{ filter: `url(#glow-${index})` }}
                />
              ))}

              {/* Velocity indicator */}
              <motion.circle
                cx="100"
                cy="32"
                r="4"
                fill="#a7dadb"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.8 + index * 0.08, duration: 0.4 }}
                style={{ filter: `url(#glow-${index})` }}
              />
            </svg>
          )}

          {/* TIME METRICS: Hourglass Flow */}
          {isTimeMetric && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative flex h-full w-full items-center justify-center">
                {/* Time blocks cascade */}
                <div className="flex gap-1">
                  {[...Array(8)].map((_, idx) => {
                    const progress = (idx / 8) * 100;
                    const isSaved = progress <= numericValue;
                    return (
                      <motion.div
                        key={idx}
                        className="h-10 w-1.5 rounded-full"
                        style={{
                          background: isSaved
                            ? 'linear-gradient(180deg, #a7dadb 0%, #7bc5c7 100%)'
                            : 'rgba(255, 255, 255, 0.08)',
                          boxShadow: isSaved ? '0 0 8px rgba(167, 218, 219, 0.4)' : 'none',
                        }}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 40, opacity: 1 }}
                        transition={{
                          delay: 0.3 + index * 0.08 + idx * 0.05,
                          duration: 0.4,
                          ease: 'easeOut',
                        }}
                      />
                    );
                  })}
                </div>

                {/* Flow effect */}
                <motion.div
                  className="absolute bottom-0 h-1 w-full opacity-40"
                  style={{
                    background: 'linear-gradient(90deg, transparent, #a7dadb, transparent)',
                  }}
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{
                    delay: 0.6 + index * 0.08,
                    duration: 0.8,
                    ease: 'easeOut',
                  }}
                />
              </div>
            </div>
          )}

          {/* QUALITY METRICS: Precision Grid */}
          {isQualityMetric && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative">
                {/* Grid pattern showing alignment */}
                <div className="grid grid-cols-5 gap-2">
                  {[...Array(15)].map((_, idx) => (
                    <motion.div
                      key={idx}
                      className="h-2.5 w-2.5 rounded-sm"
                      style={{
                        background: 'linear-gradient(135deg, #a7dadb, #7bc5c7)',
                        boxShadow: '0 0 6px rgba(167, 218, 219, 0.3)',
                      }}
                      initial={{ scale: 0, rotate: -90 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{
                        delay: 0.3 + index * 0.08 + (idx % 5) * 0.03 + Math.floor(idx / 5) * 0.08,
                        duration: 0.5,
                        type: 'spring',
                        stiffness: 200,
                        damping: 12,
                      }}
                    />
                  ))}
                </div>

                {/* Alignment indicator */}
                <motion.div
                  className="absolute inset-0 rounded-md border-2"
                  style={{
                    borderColor: 'rgba(167, 218, 219, 0.3)',
                  }}
                  initial={{ scale: 1.2, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.8 + index * 0.08, duration: 0.4 }}
                />
              </div>
            </div>
          )}

          {/* COST METRICS: Descending Bar Chart */}
          {isCostMetric && (
            <div className="absolute inset-0 flex items-end justify-between px-2">
              {[...Array(7)].map((_, idx) => {
                const height = 100 - idx * 14;
                const isReduced = idx >= 4;
                return (
                  <motion.div
                    key={idx}
                    className="mx-0.5 flex-1 rounded-t-md"
                    style={{
                      background: isReduced
                        ? 'linear-gradient(180deg, #a7dadb 0%, #7bc5c7 100%)'
                        : 'rgba(255, 255, 255, 0.12)',
                      boxShadow: isReduced ? '0 0 8px rgba(167, 218, 219, 0.3)' : 'none',
                    }}
                    initial={{ height: 0 }}
                    animate={{ height: `${height}%` }}
                    transition={{
                      delay: 0.3 + index * 0.08 + idx * 0.06,
                      duration: 0.6,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                  />
                );
              })}

              {/* Trend line */}
              <svg
                className="pointer-events-none absolute inset-0 h-full w-full"
                viewBox="0 0 100 64"
                style={{ overflow: 'visible' }}
              >
                <motion.path
                  d="M 10 10 L 90 60"
                  stroke="#ef4444"
                  strokeWidth="1.5"
                  strokeDasharray="3 3"
                  fill="none"
                  opacity="0.4"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ delay: 0.7 + index * 0.08, duration: 0.8 }}
                />
              </svg>
            </div>
          )}

          {/* ONBOARDING METRICS: Learning Curve */}
          {isOnboardingMetric && (
            <svg className="h-full w-full" viewBox="0 0 120 64" fill="none">
              <defs>
                <linearGradient id={`curveGradient-${index}`} x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="rgba(255, 255, 255, 0.15)" />
                  <stop offset="100%" stopColor="rgba(167, 218, 219, 0.4)" />
                </linearGradient>
              </defs>

              {/* Traditional steep curve */}
              <motion.path
                d="M 10 55 Q 30 20, 60 10 T 110 5"
                stroke="rgba(255, 255, 255, 0.15)"
                strokeWidth="2"
                strokeDasharray="4 4"
                fill="none"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{
                  delay: 0.3 + index * 0.08,
                  duration: 1,
                  ease: 'easeInOut',
                }}
              />

              {/* Accelerated flat curve */}
              <motion.path
                d="M 10 40 L 110 30"
                stroke="#a7dadb"
                strokeWidth="3"
                strokeLinecap="round"
                fill="none"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{
                  delay: 0.6 + index * 0.08,
                  duration: 1,
                  ease: 'easeOut',
                }}
                style={{ filter: 'drop-shadow(0 0 6px rgba(167, 218, 219, 0.5))' }}
              />

              {/* Success indicator */}
              <motion.circle
                cx="110"
                cy="30"
                r="3"
                fill="#10b981"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  delay: 1.2 + index * 0.08,
                  duration: 0.4,
                  type: 'spring',
                }}
                style={{ filter: 'drop-shadow(0 0 4px rgba(16, 185, 129, 0.6))' }}
              />
            </svg>
          )}

          {/* CONTENT METRICS: Network Graph */}
          {isContentMetric && (
            <div className="absolute inset-0 flex items-center justify-center">
              <svg className="h-full w-full" viewBox="0 0 120 64" fill="none">
                {/* Connection lines */}
                {[...Array(8)].map((_, idx) => {
                  const angle = (idx * 45 * Math.PI) / 180;
                  const x = 60 + Math.cos(angle) * 35;
                  const y = 32 + Math.sin(angle) * 20;
                  return (
                    <motion.line
                      key={idx}
                      x1="60"
                      y1="32"
                      x2={x}
                      y2={y}
                      stroke="rgba(167, 218, 219, 0.2)"
                      strokeWidth="1"
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{ pathLength: 1, opacity: 1 }}
                      transition={{
                        delay: 0.3 + index * 0.08 + idx * 0.04,
                        duration: 0.4,
                      }}
                    />
                  );
                })}

                {/* Outer nodes */}
                {[...Array(8)].map((_, idx) => {
                  const angle = (idx * 45 * Math.PI) / 180;
                  const x = 60 + Math.cos(angle) * 35;
                  const y = 32 + Math.sin(angle) * 20;
                  return (
                    <motion.circle
                      key={idx}
                      cx={x}
                      cy={y}
                      r="2.5"
                      fill="rgba(167, 218, 219, 0.6)"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{
                        delay: 0.5 + index * 0.08 + idx * 0.04,
                        duration: 0.3,
                        type: 'spring',
                      }}
                    />
                  );
                })}

                {/* Central hub */}
                <motion.circle
                  cx="60"
                  cy="32"
                  r="5"
                  fill="#a7dadb"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{
                    delay: 0.3 + index * 0.08,
                    duration: 0.5,
                    type: 'spring',
                    stiffness: 200,
                  }}
                  style={{ filter: 'drop-shadow(0 0 8px rgba(167, 218, 219, 0.6))' }}
                />
              </svg>
            </div>
          )}

          {/* FORMAT METRICS: Export Badges */}
          {isFormatMetric && (
            <div className="absolute inset-0 flex items-center justify-center gap-3">
              {['PDF', 'MD', 'JSON'].map((format, idx) => (
                <motion.div
                  key={format}
                  className="relative overflow-hidden rounded-md px-3 py-1.5 text-[10px] font-bold tracking-wider uppercase"
                  style={{
                    background:
                      'linear-gradient(135deg, rgba(167, 218, 219, 0.9), rgba(123, 197, 199, 0.9))',
                    color: '#020C1B',
                    boxShadow: '0 2px 8px rgba(167, 218, 219, 0.3)',
                  }}
                  initial={{ scale: 0, rotate: -180, opacity: 0 }}
                  animate={{ scale: 1, rotate: 0, opacity: 1 }}
                  transition={{
                    delay: 0.3 + index * 0.08 + idx * 0.15,
                    duration: 0.6,
                    type: 'spring',
                    stiffness: 150,
                    damping: 12,
                  }}
                  whileHover={{ scale: 1.1 }}
                >
                  {/* Shine effect */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30"
                    initial={{ x: '-100%' }}
                    animate={{ x: '100%' }}
                    transition={{
                      delay: 0.8 + index * 0.08 + idx * 0.15,
                      duration: 0.8,
                      ease: 'easeInOut',
                    }}
                  />
                  <span className="relative z-10">{format}</span>
                </motion.div>
              ))}
            </div>
          )}

          {/* DEFAULT: Pulse Wave (fallback) */}
          {!isSpeedMetric &&
            !isTimeMetric &&
            !isQualityMetric &&
            !isCostMetric &&
            !isOnboardingMetric &&
            !isContentMetric &&
            !isFormatMetric && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative flex h-full w-full items-center justify-center">
                  {[...Array(5)].map((_, idx) => (
                    <motion.div
                      key={idx}
                      className="absolute h-3 w-3 rounded-full"
                      style={{
                        background: 'radial-gradient(circle, #a7dadb, transparent)',
                        left: `${20 + idx * 15}%`,
                      }}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{
                        scale: [0, 1, 1, 0],
                        opacity: [0, 0.6, 0.6, 0],
                      }}
                      transition={{
                        delay: 0.3 + index * 0.08 + idx * 0.1,
                        duration: 1.5,
                        repeat: Infinity,
                        repeatDelay: 0.5,
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
        </div>
      </div>

      {/* Bottom accent line */}
      <motion.div
        className="absolute right-0 bottom-0 left-0 h-[1px]"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(167, 218, 219, 0.3), transparent)',
        }}
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: 0.5 + index * 0.08, duration: 0.8 }}
      />
    </motion.div>
  );
}
