'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, CheckCircle2, ArrowRight } from 'lucide-react';

interface Phase {
  phase: string;
  start_date: string;
  end_date: string;
  milestones: string[];
  dependencies?: string[];
}

interface TimelineInfographicProps {
  phases: Phase[];
  critical_path?: string[];
}

export function TimelineInfographic({
  phases,
  critical_path,
}: TimelineInfographicProps): React.JSX.Element {
  return (
    <div className="space-y-6">
      {/* Critical Path Indicator */}
      {critical_path && critical_path.length > 0 && (
        <div className="glass border-warning/30 bg-warning/5 rounded-xl border p-4">
          <h4 className="text-warning mb-2 flex items-center gap-2 text-sm font-semibold">
            <ArrowRight className="h-4 w-4" />
            Critical Path
          </h4>
          <p className="text-text-secondary text-sm">{critical_path.join(' → ')}</p>
        </div>
      )}

      {/* Timeline */}
      <div className="relative space-y-8">
        {/* Vertical Line */}
        <div className="bg-primary absolute top-4 bottom-4 left-6 w-0.5" />

        {phases.map((phase, index) => {
          const isCritical = critical_path?.includes(phase.phase);

          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="relative pl-16"
            >
              {/* Timeline Node */}
              <div
                className={`absolute top-2 left-3 h-6 w-6 rounded-full border-4 ${
                  isCritical ? 'border-warning bg-warning/20' : 'border-primary bg-primary/20'
                } backdrop-blur-sm`}
              />

              {/* Phase Card */}
              <div
                className={`glass-strong rounded-xl border p-6 transition-all hover:scale-[1.02] ${
                  isCritical ? 'border-warning/30' : 'border-white/10'
                }`}
              >
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <h4 className="mb-1 text-lg font-bold text-white">{phase.phase}</h4>
                    <div className="text-text-secondary flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {new Date(phase.start_date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}{' '}
                        -{' '}
                        {new Date(phase.end_date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>
                  {isCritical && (
                    <span className="bg-warning/20 text-warning rounded-full px-3 py-1 text-xs font-medium">
                      Critical
                    </span>
                  )}
                </div>

                {/* Milestones */}
                {phase.milestones && phase.milestones.length > 0 && (
                  <div>
                    <p className="text-text-secondary mb-2 text-sm font-medium">Milestones:</p>
                    <div className="space-y-2">
                      {phase.milestones.map((milestone, mIndex) => (
                        <div key={mIndex} className="flex items-start gap-2">
                          <CheckCircle2 className="text-success mt-0.5 h-4 w-4 flex-shrink-0" />
                          <span className="text-text-secondary text-sm">{milestone}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Dependencies */}
                {phase.dependencies && phase.dependencies.length > 0 && (
                  <div className="mt-4 rounded-lg bg-white/5 p-3">
                    <p className="text-text-secondary mb-1 text-xs font-medium">Dependencies:</p>
                    <p className="text-primary text-sm">{phase.dependencies.join(', ')}</p>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
