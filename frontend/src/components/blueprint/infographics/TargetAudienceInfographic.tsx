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
  const { demographics, learning_preferences } = data;

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
        {demographics.roles && demographics.roles.length > 0 && (
          <div className="mb-6">
            <h4 className="text-text-secondary mb-3 text-sm font-medium">Target Roles</h4>
            <div className="flex flex-wrap gap-2">
              {demographics.roles.map((role, index) => {
                // Handle both string and object formats
                const roleText =
                  typeof role === 'string' ? role : role.role || role.name || String(role);
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
        {demographics.experience_levels && demographics.experience_levels.length > 0 && (
          <div className="mb-6">
            <h4 className="text-text-secondary mb-3 text-sm font-medium">Experience Levels</h4>
            <div className="flex flex-wrap gap-2">
              {demographics.experience_levels.map((level, index) => {
                // Handle both string and object formats
                const levelText =
                  typeof level === 'string' ? level : level.level || level.name || String(level);
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

        {/* Department Distribution - Modern Implementation */}
        {demographics.department_distribution &&
          demographics.department_distribution.length > 0 && (
            <div>
              <h4 className="text-text-secondary mb-4 text-sm font-medium">
                Department Distribution
              </h4>

              {/* Custom Horizontal Bar Chart for Departments */}
              <div className="space-y-3">
                {demographics.department_distribution.map((dept, index) => {
                  const isLargest =
                    Math.max(...demographics.department_distribution.map((d) => d.percentage)) ===
                    dept.percentage;

                  return (
                    <motion.div
                      key={dept.department}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1, duration: 0.6 }}
                      className="group"
                    >
                      <div className="glass-strong hover:glass-strong hover:border-primary/20 overflow-hidden rounded-xl border border-white/10 transition-all hover:shadow-lg">
                        <div className="flex items-center justify-between p-4">
                          {/* Department Info */}
                          <div className="flex items-center gap-3">
                            <div
                              className={`flex h-10 w-10 items-center justify-center rounded-lg transition-all group-hover:scale-110 ${
                                isLargest
                                  ? 'bg-primary/20 text-primary'
                                  : 'bg-surface text-text-secondary'
                              }`}
                              style={{
                                backgroundColor: isLargest
                                  ? 'rgba(167, 218, 219, 0.2)'
                                  : 'rgba(13, 27, 42, 0.4)',
                              }}
                            >
                              <div
                                className="h-3 w-3 rounded-full"
                                style={{ backgroundColor: COLORS[index % COLORS.length] }}
                              />
                            </div>
                            <div>
                              <div
                                className={`font-medium transition-colors ${
                                  isLargest ? 'text-primary' : 'text-foreground'
                                }`}
                              >
                                {dept.department}
                              </div>
                              <div className="text-text-secondary text-xs">
                                {dept.percentage}% of total
                              </div>
                            </div>
                          </div>

                          {/* Percentage Badge */}
                          <div
                            className={`rounded-full px-3 py-1 text-sm font-bold transition-all ${
                              isLargest
                                ? 'bg-primary/20 text-primary border-primary/30 border'
                                : 'bg-surface text-text-secondary'
                            }`}
                          >
                            {dept.percentage}%
                          </div>
                        </div>

                        {/* Animated Progress Bar */}
                        <div className="relative">
                          <div className="bg-surface/50 h-2">
                            <motion.div
                              className={`h-full rounded-full transition-all duration-1000 ease-out`}
                              style={{
                                backgroundColor: COLORS[index % COLORS.length],
                                boxShadow: isLargest
                                  ? `0 0 20px ${COLORS[index % COLORS.length]}40`
                                  : 'none',
                              }}
                              initial={{ width: 0 }}
                              animate={{ width: `${dept.percentage}%` }}
                              transition={{
                                delay: index * 0.1 + 0.3,
                                duration: 1.2,
                                ease: 'easeOut',
                              }}
                            />
                          </div>

                          {/* Shimmer effect for largest department */}
                          {isLargest && (
                            <motion.div
                              className="absolute inset-0 rounded-full opacity-30"
                              animate={{
                                background: [
                                  `linear-gradient(90deg, transparent, ${COLORS[index % COLORS.length]}40, transparent)`,
                                ],
                              }}
                              transition={{
                                duration: 2,
                                repeat: Infinity,
                                repeatDelay: 1,
                              }}
                            />
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Summary Stats */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: demographics.department_distribution.length * 0.1 + 0.3 }}
                className="mt-4 grid grid-cols-3 gap-3"
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
      {learning_preferences?.modalities && learning_preferences.modalities.length > 0 && (
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

          {/* Custom Horizontal Bar Chart */}
          <div className="space-y-4">
            {learning_preferences.modalities.map((modality, index) => {
              const Icon = getModalityIcon(modality.type);
              const isHighest =
                Math.max(...learning_preferences.modalities.map((m) => m.percentage)) ===
                modality.percentage;

              return (
                <motion.div
                  key={modality.type}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.6 }}
                  className="group"
                >
                  <div className="glass-strong hover:glass-strong hover:border-primary/20 mb-3 overflow-hidden rounded-xl border border-white/10 transition-all hover:shadow-lg">
                    <div className="flex items-center justify-between p-4">
                      {/* Modality Info */}
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-lg transition-all group-hover:scale-110 ${
                            isHighest
                              ? 'bg-primary/20 text-primary'
                              : 'bg-surface text-text-secondary'
                          }`}
                        >
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <div
                            className={`font-medium transition-colors ${
                              isHighest ? 'text-primary' : 'text-foreground'
                            }`}
                          >
                            {modality.type}
                          </div>
                          <div className="text-text-secondary text-xs">
                            {modality.percentage}% preference
                          </div>
                        </div>
                      </div>

                      {/* Percentage Badge */}
                      <div
                        className={`rounded-full px-3 py-1 text-sm font-bold transition-all ${
                          isHighest
                            ? 'bg-primary/20 text-primary border-primary/30 border'
                            : 'bg-surface text-text-secondary'
                        }`}
                      >
                        {modality.percentage}%
                      </div>
                    </div>

                    {/* Animated Progress Bar */}
                    <div className="relative">
                      <div className="bg-surface/50 h-2">
                        <motion.div
                          className={`h-full rounded-full transition-all duration-1000 ease-out ${
                            isHighest
                              ? 'from-primary/60 via-primary to-primary/80 bg-gradient-to-r'
                              : 'from-primary/40 to-primary/60 bg-gradient-to-r'
                          }`}
                          initial={{ width: 0 }}
                          animate={{ width: `${modality.percentage}%` }}
                          transition={{
                            delay: index * 0.1 + 0.3,
                            duration: 1.2,
                            ease: 'easeOut',
                          }}
                          style={{
                            boxShadow: isHighest ? '0 0 20px rgba(167, 218, 219, 0.3)' : 'none',
                          }}
                        />
                      </div>

                      {/* Shimmer effect for highest value */}
                      {isHighest && (
                        <motion.div
                          className="absolute inset-0 rounded-full opacity-30"
                          animate={{
                            background: [
                              'linear-gradient(90deg, transparent, rgba(167, 218, 219, 0.4), transparent)',
                            ],
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            repeatDelay: 1,
                          }}
                        />
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Summary Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: learning_preferences.modalities.length * 0.1 + 0.3 }}
            className="mt-6 grid grid-cols-3 gap-4"
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
