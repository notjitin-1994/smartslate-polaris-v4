/**
 * Timeline Section Component
 * Visualizes sequential/temporal data with interactive timeline
 */

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, CheckCircle2, Circle } from 'lucide-react';
import { formatDate } from './utils';
import type { Phase, Module } from './types';

interface TimelineSectionProps {
  sectionKey: string;
  data: any;
}

export function TimelineSection({ sectionKey, data }: TimelineSectionProps): React.JSX.Element {
  // Handle both phases (implementation timeline) and modules (content outline)
  const items: Array<Phase | Module> = data.phases || data.modules || [];

  if (items.length === 0) {
    return (
      <div className="glass rounded-2xl p-8 text-center">
        <p className="text-text-secondary">No timeline data available</p>
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl p-6 md:p-8">
      <h2 className="text-title text-foreground mb-8">
        {sectionKey
          .split('_')
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ')}
      </h2>

      <div className="relative">
        {/* Timeline Line */}
        <div className="bg-primary absolute top-0 bottom-0 left-6 w-0.5" />

        {/* Timeline Items */}
        <div className="space-y-8">
          {items.map((item, index) => (
            <TimelineItem key={index} item={item} index={index} />
          ))}
        </div>
      </div>
    </div>
  );
}

function TimelineItem({ item, index }: { item: Phase | Module; index: number }): React.JSX.Element {
  const isPhase = 'start_date' in item;
  const title = isPhase ? (item as Phase).phase : (item as Module).title;
  const description = isPhase ? '' : (item as Module).description;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      className="relative flex gap-6"
    >
      {/* Timeline Dot */}
      <div className="relative z-10">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: index * 0.1 + 0.2, type: 'spring' }}
          className="bg-primary flex h-12 w-12 items-center justify-center rounded-full shadow-lg"
        >
          <CheckCircle2 className="h-6 w-6 text-white" />
        </motion.div>
      </div>

      {/* Content Card */}
      <div className="flex-1 pb-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 + 0.3 }}
          className="glass-strong rounded-xl p-5"
        >
          {/* Header */}
          <div className="mb-3 flex items-start justify-between">
            <h3 className="text-heading text-foreground font-semibold">{title}</h3>
            {isPhase && (
              <div className="text-text-secondary bg-surface rounded-full px-3 py-1 text-xs">
                {formatDate((item as Phase).start_date)} - {formatDate((item as Phase).end_date)}
              </div>
            )}
          </div>

          {/* Description */}
          {description && <p className="text-body text-text-secondary mb-4">{description}</p>}

          {/* Phase-specific: Milestones */}
          {isPhase && (item as Phase).milestones && (item as Phase).milestones.length > 0 && (
            <div className="mt-4">
              <h4 className="text-foreground mb-2 text-sm font-medium">Milestones:</h4>
              <ul className="space-y-1">
                {(item as Phase).milestones.map((milestone, idx) => (
                  <li key={idx} className="text-text-secondary flex items-start gap-2 text-sm">
                    <Circle className="text-primary mt-0.5 h-3 w-3 flex-shrink-0" />
                    <span>{milestone}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Module-specific: Topics */}
          {!isPhase && (item as Module).topics && (item as Module).topics.length > 0 && (
            <div className="mt-4">
              <div className="flex flex-wrap gap-2">
                {(item as Module).topics.map((topic, idx) => (
                  <span
                    key={idx}
                    className="bg-secondary/10 text-secondary inline-block rounded-md px-3 py-1 text-xs"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Module-specific: Duration & Delivery */}
          {!isPhase && (
            <div className="text-text-secondary mt-4 flex gap-4 text-xs">
              {(item as Module).duration && (
                <div>
                  <span className="font-medium">Duration:</span> {(item as Module).duration}
                </div>
              )}
              {(item as Module).delivery_method && (
                <div>
                  <span className="font-medium">Delivery:</span> {(item as Module).delivery_method}
                </div>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}
