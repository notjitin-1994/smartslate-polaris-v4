/**
 * Instructional Strategy Infographic
 * Visual representation of learning approach and modalities
 */

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { GraduationCap, Users, Accessibility, Layers, PieChart } from 'lucide-react';

interface Modality {
  type: string;
  rationale: string;
  allocation_percent: number;
  tools?: string[];
}

interface InstructionalStrategyInfographicProps {
  overview: string;
  modalities: Modality[];
  cohort_model?: string;
  accessibility_considerations?: string[];
}

export function InstructionalStrategyInfographic({
  overview,
  modalities,
  cohort_model,
  accessibility_considerations,
}: InstructionalStrategyInfographicProps): React.JSX.Element {
  // Calculate total allocation
  const totalAllocation = modalities.reduce((sum, m) => sum + (m.allocation_percent || 0), 0);

  // Generate colors for each modality
  const colors = [
    { bg: 'bg-primary/20', text: 'text-primary', bar: 'bg-primary' },
    { bg: 'bg-primary/20', text: 'text-primary', bar: 'bg-primary' },
    { bg: 'bg-success/20', text: 'text-success', bar: 'bg-success' },
    { bg: 'bg-warning/20', text: 'text-warning', bar: 'bg-warning' },
  ];

  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-xl border border-white/10 p-6"
      >
        <div className="mb-4 flex items-center gap-3">
          <div className="bg-primary/20 rounded-xl p-3">
            <GraduationCap className="text-primary h-6 w-6" />
          </div>
          <h3 className="text-lg font-bold text-white">Strategic Approach</h3>
        </div>
        <p className="text-text-primary text-sm leading-relaxed">{overview}</p>
      </motion.div>

      {/* Learning Modalities */}
      <div className="space-y-4">
        <div className="mb-4 flex items-center gap-3">
          <div className="bg-primary/20 rounded-xl p-3">
            <Layers className="text-primary h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Learning Modalities</h3>
            <p className="text-text-primary text-sm">Distribution across learning methods</p>
          </div>
        </div>

        {/* Modality Distribution Bars */}
        <div className="space-y-3">
          {modalities.map((modality, index) => {
            const color = colors[index % colors.length];
            const percentage =
              totalAllocation > 0 ? (modality.allocation_percent / totalAllocation) * 100 : 0;

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`glass hover:border-primary/30 rounded-xl border border-white/10 p-5 transition-all`}
              >
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="mb-1 text-base font-semibold text-white">{modality.type}</h4>
                    <p className="text-text-primary text-sm">{modality.rationale}</p>
                  </div>
                  <div className="ml-4 flex flex-col items-end">
                    <span className={`text-2xl font-bold ${color.text}`}>
                      {modality.allocation_percent}%
                    </span>
                  </div>
                </div>

                {/* Percentage Bar */}
                <div className="mb-3 h-2 overflow-hidden rounded-full bg-white/5">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 1, delay: index * 0.1 + 0.3 }}
                    className={`h-full ${color.bar}`}
                  />
                </div>

                {/* Tools */}
                {modality.tools && modality.tools.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {modality.tools.map((tool, tIndex) => (
                      <motion.span
                        key={tIndex}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.1 + tIndex * 0.05 + 0.5 }}
                        className={`rounded-full ${color.bg} px-3 py-1 text-xs font-medium ${color.text}`}
                      >
                        {tool}
                      </motion.span>
                    ))}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Cohort Model */}
      {cohort_model && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass rounded-xl border border-white/10 p-6"
        >
          <div className="mb-3 flex items-center gap-3">
            <div className="bg-success/20 rounded-xl p-3">
              <Users className="text-success h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Cohort Model</h3>
          </div>
          <p className="text-text-primary text-sm leading-relaxed">{cohort_model}</p>
        </motion.div>
      )}

      {/* Accessibility Considerations */}
      {accessibility_considerations && accessibility_considerations.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass rounded-xl border border-white/10 p-6"
        >
          <div className="mb-4 flex items-center gap-3">
            <div className="bg-warning/20 rounded-xl p-3">
              <Accessibility className="text-warning h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Accessibility Considerations</h3>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {accessibility_considerations.map((consideration, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 + index * 0.05 }}
                className="flex items-start gap-3 rounded-lg bg-white/5 p-4"
              >
                <div className="bg-success mt-0.5 h-2 w-2 flex-shrink-0 rounded-full" />
                <span className="text-text-primary text-sm">{consideration}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
