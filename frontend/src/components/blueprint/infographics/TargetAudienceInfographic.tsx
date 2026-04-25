/**
 * Target Audience Infographic Component
 * Visualizes demographics and learning preferences
 */

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Users, BookOpen, Hand, Eye, Users as UsersIcon, FileText, Zap } from 'lucide-react';
// Removed Recharts imports as we're using custom implementation
import type { TargetAudienceSection } from '../types';

interface TargetAudienceInfographicProps {
  data: TargetAudienceSection;
}

const COLORS = ['#0ea5e9', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

// Get icon for each learning modality
const getModalityIcon = (modalityType: string) => {
  const type = modalityType.toLowerCase();
  if (type.includes('hands-on') || type.includes('practice')) return Hand;
  if (type.includes('visual')) return Eye;
  if (type.includes('collaborative') || type.includes('group')) return UsersIcon;
  if (type.includes('reading') || type.includes('documentation')) return FileText;
  return BookOpen;
};

export function TargetAudienceInfographic({
  data,
}: TargetAudienceInfographicProps): React.JSX.Element {
  // Handle cases where data might include questionnaire fields instead of expected blueprint structure
  // Add validation to ensure data has the expected structure
  if (!data || typeof data !== 'object') {
    return <div>No target audience data available</div>;
  }

  const demographics = data.demographics || {};
  const learning_preferences = data.learning_preferences || {};

  // Ensure demographics and learning_preferences are objects
  if (typeof demographics !== 'object' || demographics === null) {
    console.warn('TargetAudienceInfographic: Invalid demographics data', demographics);
    return <div>Invalid demographics data</div>;
  }

  if (typeof learning_preferences !== 'object' || learning_preferences === null) {
    console.warn(
      'TargetAudienceInfographic: Invalid learning_preferences data',
      learning_preferences
    );
    return <div>Invalid learning preferences data</div>;
  }

  return (
    <div className="space-y-8">
      {/* Demographics Section */}
      <div>
        <div className="mb-4 flex items-center gap-2">
          <Users
            className="text-primary h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
          />
          <h3 className="text-heading text-foreground font-semibold">Demographics</h3>
        </div>

        {/* Roles */}
        {Array.isArray(demographics.roles) && demographics.roles.length > 0 && (
          <div className="mb-6">
            <h4 className="text-text-secondary mb-3 text-sm font-medium">Target Roles</h4>
            <div className="flex flex-col gap-2 lg:flex-row lg:flex-wrap">
              {demographics.roles.map((role, index) => {
                // Handle both string and object formats
                let roleText = '';
                if (typeof role === 'string') {
                  roleText = role;
                } else if (typeof role === 'object' && role !== null) {
                  roleText = role.role || role.name || '';
                  if (typeof roleText !== 'string') {
                    roleText = String(roleText);
                  }
                } else {
                  roleText = String(role);
                }
                const roleKey =
                  typeof role === 'string'
                    ? role
                    : role.role || role.name || `${index}-${roleText}`;

                return (
                  <motion.div
                    key={roleKey}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="glass-strong text-foreground rounded-lg px-4 py-2 text-sm"
                  >
                    {roleText}
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* Experience Levels */}
        {Array.isArray(demographics.experience_levels) &&
          demographics.experience_levels.length > 0 && (
            <div className="mb-6">
              <h4 className="text-text-secondary mb-3 text-sm font-medium">Experience Levels</h4>
              <div className="flex flex-col gap-2 lg:flex-row lg:flex-wrap">
                {demographics.experience_levels.map((level, index) => {
                  // Handle both string and object formats
                  let levelText = '';
                  if (typeof level === 'string') {
                    levelText = level;
                  } else if (typeof level === 'object' && level !== null) {
                    levelText = level.level || level.name || '';
                    if (typeof levelText !== 'string') {
                      levelText = String(levelText);
                    }
                  } else {
                    levelText = String(level);
                  }
                  const levelKey =
                    typeof level === 'string'
                      ? level
                      : level.level || level.name || `${index}-${levelText}`;

                  return (
                    <motion.div
                      key={levelKey}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-primary/30 bg-primary/5 text-primary rounded-lg border px-4 py-2 text-sm"
                    >
                      {levelText}
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

        {/* Department Distribution - Pie Chart Only */}
        {Array.isArray(demographics.department_distribution) &&
          demographics.department_distribution.length > 0 && (
            <div>
              <div className="mt-8">
                <h4 className="text-text-secondary mb-4 text-sm font-medium">Distribution</h4>
                <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                  {/* Pie Chart */}
                  <div className="glass-strong rounded-xl border border-white/10 p-6">
                    <div className="relative h-64 w-full">
                      {/* SVG Pie Chart */}
                      <svg viewBox="0 0 200 200" className="h-full w-full">
                        <g transform="translate(100,100)">
                          {(() => {
                            let currentAngle = 0;
                            const total = demographics.department_distribution.reduce(
                              (sum, d) => sum + d.percentage,
                              0
                            );

                            return demographics.department_distribution.map((dept, index) => {
                              const percentage = dept.percentage;
                              const angle = (percentage / total) * 360;
                              const startAngle = currentAngle;
                              const endAngle = currentAngle + angle;
                              currentAngle = endAngle;

                              const startRad = (startAngle * Math.PI) / 180;
                              const endRad = (endAngle * Math.PI) / 180;

                              const x1 = Math.cos(startRad) * 80;
                              const y1 = Math.sin(startRad) * 80;
                              const x2 = Math.cos(endRad) * 80;
                              const y2 = Math.sin(endRad) * 80;

                              const largeArc = angle > 180 ? 1 : 0;

                              return (
                                <g key={dept.department}>
                                  <motion.path
                                    d={`M 0 0 L ${x1} ${y1} A 80 80 0 ${largeArc} 1 ${x2} ${y2} Z`}
                                    fill={COLORS[index % COLORS.length]}
                                    stroke="rgba(255,255,255,0.1)"
                                    strokeWidth="2"
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{
                                      delay: 0.5 + index * 0.1,
                                      duration: 0.6,
                                      ease: 'easeOut',
                                    }}
                                    transformOrigin="0 0"
                                  />
                                  {/* Percentage Labels */}
                                  {percentage > 5 &&
                                    (() => {
                                      const labelAngle = (startAngle + endAngle) / 2;
                                      const labelRad = (labelAngle * Math.PI) / 180;
                                      const labelX = Math.cos(labelRad) * 55;
                                      const labelY = Math.sin(labelRad) * 55;

                                      return (
                                        <motion.text
                                          x={labelX}
                                          y={labelY}
                                          fill="white"
                                          fontSize="12"
                                          fontWeight="bold"
                                          textAnchor="middle"
                                          dominantBaseline="middle"
                                          initial={{ opacity: 0 }}
                                          animate={{ opacity: 1 }}
                                          transition={{ delay: 1 + index * 0.1 }}
                                        >
                                          {`${percentage}%`}
                                        </motion.text>
                                      );
                                    })()}
                                </g>
                              );
                            });
                          })()}
                        </g>
                      </svg>
                    </div>
                  </div>

                  {/* Legend */}
                  <div className="space-y-3">
                    <h5 className="text-foreground text-sm font-medium">Departments</h5>
                    <div className="grid grid-cols-1 gap-2">
                      {demographics.department_distribution.map((dept, index) => (
                        <motion.div
                          key={dept.department}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.8 + index * 0.1 }}
                          className="flex items-center gap-3"
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className="h-3 w-3 rounded-full"
                              style={{ backgroundColor: COLORS[index % COLORS.length] }}
                            />
                            <span className="text-foreground text-sm font-medium">
                              {dept.department}
                            </span>
                          </div>
                          <div className="text-text-secondary ml-auto text-sm">
                            {dept.percentage}%
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Summary Stats */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: demographics.department_distribution.length * 0.1 + 0.3 }}
                className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3"
              >
                <div className="glass-card rounded-lg p-3 text-center">
                  <div className="text-primary text-lg font-bold">
                    {Math.max(...demographics.department_distribution.map((d) => d.percentage))}%
                  </div>
                  <div className="text-text-secondary text-xs">Largest Dept</div>
                </div>
                <div className="glass-card rounded-lg p-3 text-center">
                  <div className="text-primary text-lg font-bold">
                    {Math.round(
                      demographics.department_distribution.reduce(
                        (sum, d) => sum + d.percentage,
                        0
                      ) / demographics.department_distribution.length
                    )}
                    %
                  </div>
                  <div className="text-text-secondary text-xs">Average</div>
                </div>
                <div className="glass-card rounded-lg p-3 text-center">
                  <div className="text-primary text-lg font-bold">
                    {demographics.department_distribution.length}
                  </div>
                  <div className="text-text-secondary text-xs">Departments</div>
                </div>
              </motion.div>
            </div>
          )}
      </div>

      {/* Learning Preferences - Modern Implementation */}
      {Array.isArray(learning_preferences?.modalities) &&
        learning_preferences.modalities.length > 0 && (
          <div>
            <div className="mb-6 flex items-center gap-3">
              <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-xl">
                <BookOpen
                  className="text-primary h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                />
              </div>
              <h3 className="text-heading text-foreground font-semibold">Learning Preferences</h3>
            </div>

            {/* Pie Chart for Learning Preferences */}
            <div className="mt-8">
              <h4 className="text-text-secondary mb-4 text-sm font-medium">Learning Preferences</h4>
              <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                {/* Pie Chart */}
                <div className="glass-strong rounded-xl border border-white/10 p-6">
                  <div className="relative h-64 w-full">
                    {/* SVG Pie Chart */}
                    <svg viewBox="0 0 200 200" className="h-full w-full">
                      <g transform="translate(100,100)">
                        {(() => {
                          let currentAngle = 0;
                          const total = learning_preferences.modalities.reduce(
                            (sum, m) => sum + m.percentage,
                            0
                          );

                          return learning_preferences.modalities.map((modality, index) => {
                            const percentage = modality.percentage;
                            const angle = (percentage / total) * 360;
                            const startAngle = currentAngle;
                            const endAngle = currentAngle + angle;
                            currentAngle = endAngle;

                            const startRad = (startAngle * Math.PI) / 180;
                            const endRad = (endAngle * Math.PI) / 180;

                            const x1 = Math.cos(startRad) * 80;
                            const y1 = Math.sin(startRad) * 80;
                            const x2 = Math.cos(endRad) * 80;
                            const y2 = Math.sin(endRad) * 80;

                            const largeArc = angle > 180 ? 1 : 0;

                            return (
                              <g key={modality.type}>
                                <motion.path
                                  d={`M 0 0 L ${x1} ${y1} A 80 80 0 ${largeArc} 1 ${x2} ${y2} Z`}
                                  fill={COLORS[index % COLORS.length]}
                                  stroke="rgba(255,255,255,0.1)"
                                  strokeWidth="2"
                                  initial={{ scale: 0, opacity: 0 }}
                                  animate={{ scale: 1, opacity: 1 }}
                                  transition={{
                                    delay: 0.5 + index * 0.1,
                                    duration: 0.6,
                                    ease: 'easeOut',
                                  }}
                                  transformOrigin="0 0"
                                />
                                {/* Percentage Labels */}
                                {percentage > 5 &&
                                  (() => {
                                    const labelAngle = (startAngle + endAngle) / 2;
                                    const labelRad = (labelAngle * Math.PI) / 180;
                                    const labelX = Math.cos(labelRad) * 55;
                                    const labelY = Math.sin(labelRad) * 55;

                                    return (
                                      <motion.text
                                        x={labelX}
                                        y={labelY}
                                        fill="white"
                                        fontSize="12"
                                        fontWeight="bold"
                                        textAnchor="middle"
                                        dominantBaseline="middle"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 1 + index * 0.1 }}
                                      >
                                        {`${percentage}%`}
                                      </motion.text>
                                    );
                                  })()}
                              </g>
                            );
                          });
                        })()}
                      </g>
                    </svg>
                  </div>
                </div>

                {/* Legend */}
                <div className="space-y-3">
                  <h5 className="text-foreground text-sm font-medium">Learning Modalities</h5>
                  <div className="grid grid-cols-1 gap-2">
                    {learning_preferences.modalities.map((modality, index) => {
                      const Icon = getModalityIcon(modality.type);
                      return (
                        <motion.div
                          key={modality.type}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.8 + index * 0.1 }}
                          className="flex items-center gap-3"
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className="h-3 w-3 rounded-full"
                              style={{ backgroundColor: COLORS[index % COLORS.length] }}
                            />
                            <Icon className="text-foreground mr-1 h-4 w-4" />
                            <span className="text-foreground text-sm font-medium">
                              {modality.type}
                            </span>
                          </div>
                          <div className="text-text-secondary ml-auto text-sm">
                            {modality.percentage}%
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Summary Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: learning_preferences.modalities.length * 0.1 + 0.3 }}
              className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3"
            >
              <div className="glass-card rounded-lg p-4 text-center">
                <div className="text-primary text-xl font-bold">
                  {Math.max(...learning_preferences.modalities.map((m) => m.percentage))}%
                </div>
                <div className="text-text-secondary text-xs">Highest Preference</div>
              </div>
              <div className="glass-card rounded-lg p-4 text-center">
                <div className="text-primary text-xl font-bold">
                  {Math.round(
                    learning_preferences.modalities.reduce((sum, m) => sum + m.percentage, 0) /
                      learning_preferences.modalities.length
                  )}
                  %
                </div>
                <div className="text-text-secondary text-xs">Average</div>
              </div>
              <div className="glass-card rounded-lg p-4 text-center">
                <div className="text-primary text-xl font-bold">
                  {learning_preferences.modalities.length}
                </div>
                <div className="text-text-secondary text-xs">Modalities</div>
              </div>
            </motion.div>
          </div>
        )}
    </div>
  );
}
