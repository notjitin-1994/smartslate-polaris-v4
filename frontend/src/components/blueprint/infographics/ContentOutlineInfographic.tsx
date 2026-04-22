/**
 * Content Outline Infographic
 * Enhanced visual representation of learning modules with timeline view
 */

'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  ChevronDown,
  Target,
  Clock,
  Activity,
  CheckCircle2,
  PlayCircle,
} from 'lucide-react';

interface Module {
  module_id?: string;
  title: string;
  description: string;
  topics?: string[];
  duration?: string;
  delivery_method?: string;
  learning_activities?: Array<{
    activity: string;
    type: string;
    duration?: string;
  }>;
  assessment?: {
    type: string;
    description: string;
  };
}

interface ContentOutlineInfographicProps {
  modules: Module[];
}

export function ContentOutlineInfographic({
  modules,
}: ContentOutlineInfographicProps): React.JSX.Element {
  const [expandedModules, setExpandedModules] = useState<Set<number>>(new Set([0]));
  const [viewMode, setViewMode] = useState<'cards' | 'timeline'>('cards');

  const toggleModule = (index: number) => {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const expandAll = () => {
    setExpandedModules(new Set(modules.map((_, i) => i)));
  };

  const collapseAll = () => {
    setExpandedModules(new Set());
  };

  // Calculate total duration
  const totalDuration = modules.reduce((sum, module) => {
    const duration = module.duration || '';
    const weeks = duration.match(/(\d+)\s*(?:week|weeks|wk|w)\b/i);
    const days = duration.match(/(\d+)\s*(?:day|days|d)\b/i);
    const hours = duration.match(/(\d+)\s*(?:hour|hours|hr|h)\b/i);
    const minutes = duration.match(/(\d+)\s*(?:minute|minutes|min|m)\b/i);

    // Convert to learning hours (not calendar hours):
    // 1 week = 10 study hours, 1 day = 2 study hours
    const totalHours =
      (weeks ? parseInt(weeks[1]) * 10 : 0) +
      (days ? parseInt(days[1]) * 2 : 0) +
      (hours ? parseInt(hours[1]) : 0) +
      (minutes ? parseInt(minutes[1]) / 60 : 0);

    return sum + totalHours;
  }, 0);

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="bg-primary/20 rounded-xl p-3"
          >
            <BookOpen className="text-primary h-6 w-6" />
          </motion.div>
          <div>
            <h3 className="text-xl font-bold text-white">{modules.length} Learning Modules</h3>
            <p className="text-text-secondary text-sm">
              {totalDuration.toFixed(0)} hours total •{' '}
              {modules.reduce((sum, m) => sum + (m.learning_activities?.length || 0), 0)} activities
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={expandAll}
            className="border-primary/30 bg-primary/10 hover:bg-primary/20 flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium text-white transition-all"
          >
            <CheckCircle2 className="h-4 w-4" />
            Expand All
          </button>
          <button
            onClick={collapseAll}
            className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-white transition-all hover:bg-white/10"
          >
            Collapse All
          </button>
        </div>
      </div>

      {/* Progress Overview - Desktop layout on all screen sizes */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-4 gap-4"
      >
        {modules.slice(0, 4).map((module, index) => (
          <motion.div
            key={index}
            whileHover={{ scale: 1.05, y: -5 }}
            className="glass-card rounded-xl border border-white/10 p-4"
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="bg-primary/20 text-primary flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold">
                {index + 1}
              </span>
              <Clock className="text-text-secondary h-4 w-4" />
            </div>
            <h4 className="mb-1 line-clamp-2 text-sm font-semibold text-white">{module.title}</h4>
            <p className="text-primary text-xs">{module.duration}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Module Cards with Timeline Connection */}
      <div className="relative space-y-4">
        {/* Timeline Line */}
        <div className="bg-primary absolute top-8 bottom-8 left-6 w-0.5" />

        {modules.map((module, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="relative"
          >
            {/* Timeline Node */}
            <motion.div
              whileHover={{ scale: 1.2 }}
              className="bg-primary absolute top-6 left-0 z-10 flex h-12 w-12 items-center justify-center rounded-full"
            >
              <span className="text-primary-foreground text-lg font-bold">{index + 1}</span>
            </motion.div>

            {/* Module Card */}
            <div className="ml-20">
              <motion.div
                whileHover={{ x: 5 }}
                className="glass-strong overflow-hidden rounded-xl border border-white/10 transition-all"
              >
                {/* Module Header */}
                <button
                  onClick={() => toggleModule(index)}
                  className="flex w-full items-start justify-between p-6 text-left transition-all hover:bg-white/5"
                >
                  <div className="flex-1">
                    <div className="mb-2 flex items-center gap-3">
                      <h4 className="flex-1 text-lg font-bold text-white">{module.title}</h4>
                      <span className="bg-primary/20 text-primary rounded-full px-4 py-1 text-sm font-medium whitespace-nowrap">
                        {module.duration}
                      </span>
                    </div>
                    <p className="text-text-secondary text-sm">{module.description}</p>
                    {module.delivery_method && (
                      <div className="mt-2 flex items-center gap-2">
                        <PlayCircle className="text-primary h-4 w-4" />
                        <span className="text-primary text-xs">{module.delivery_method}</span>
                      </div>
                    )}
                  </div>
                  <motion.div
                    animate={{ rotate: expandedModules.has(index) ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                    className="ml-4 rounded-full bg-white/5 p-2"
                  >
                    <ChevronDown className="text-text-secondary h-4 w-4" />
                  </motion.div>
                </button>

                {/* Expandable Content */}
                <AnimatePresence>
                  {expandedModules.has(index) && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden border-t border-white/10"
                    >
                      <div className="space-y-4 p-6 pt-4">
                        {/* Topics */}
                        {module.topics && module.topics.length > 0 && (
                          <div>
                            <p className="text-text-secondary mb-2 text-sm font-semibold">
                              Topics Covered:
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {module.topics.map((topic, tIndex) => (
                                <motion.span
                                  key={tIndex}
                                  initial={{ opacity: 0, scale: 0.8 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  transition={{ delay: tIndex * 0.05 }}
                                  className="rounded-lg bg-white/5 px-3 py-1.5 text-sm text-white"
                                >
                                  {topic}
                                </motion.span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Learning Activities */}
                        {module.learning_activities && module.learning_activities.length > 0 && (
                          <div>
                            <p className="text-text-secondary mb-3 text-sm font-semibold">
                              Learning Activities:
                            </p>
                            <div className="space-y-2">
                              {module.learning_activities.map((activity, aIndex) => (
                                <motion.div
                                  key={aIndex}
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: aIndex * 0.1 }}
                                  className="flex items-start gap-3 rounded-lg bg-white/5 p-4"
                                >
                                  <div className="bg-primary/20 text-primary mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold">
                                    {aIndex + 1}
                                  </div>
                                  <div className="flex-1">
                                    <div className="mb-1 flex items-center gap-2">
                                      <span className="text-primary text-sm font-medium">
                                        {activity.type}
                                      </span>
                                      {activity.duration && (
                                        <>
                                          <span className="text-text-secondary text-xs">•</span>
                                          <span className="text-primary text-xs">
                                            {activity.duration}
                                          </span>
                                        </>
                                      )}
                                    </div>
                                    <p className="text-text-secondary text-sm">
                                      {activity.activity}
                                    </p>
                                  </div>
                                </motion.div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Assessment */}
                        {module.assessment && (
                          <div className="border-success/30 bg-success/5 rounded-lg border p-4">
                            <div className="mb-2 flex items-center gap-2">
                              <Target className="text-success h-5 w-5" />
                              <p className="text-success text-sm font-semibold">
                                Assessment: {module.assessment.type}
                              </p>
                            </div>
                            <p className="text-text-secondary text-sm">
                              {module.assessment.description}
                            </p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
