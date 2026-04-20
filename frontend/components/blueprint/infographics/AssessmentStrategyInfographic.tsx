/**
 * Assessment Strategy Infographic Component
 * Visualizes KPIs and evaluation methods
 */

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ClipboardCheck, BarChart3 } from 'lucide-react';
import type { KPI, ChartConfig } from '../types';

interface AssessmentStrategyInfographicProps {
  kpis: KPI[];
  overview?: string;
  evaluationMethods?: Array<{
    method: string;
    timing: string;
    weight: string;
  }>;
  chartConfig?: ChartConfig;
}

export function AssessmentStrategyInfographic({
  kpis,
  overview,
  evaluationMethods,
}: AssessmentStrategyInfographicProps): React.JSX.Element {
  return (
    <div className="space-y-6">
      {/* Overview */}
      {overview && (
        <div className="glass-strong rounded-xl p-4">
          <p className="text-body text-text-secondary">{overview}</p>
        </div>
      )}

      {/* KPIs Grid */}
      <div>
        <div className="mb-4 flex items-center gap-2">
          <BarChart3 className="text-primary h-5 w-5" />
          <h3 className="text-heading text-foreground font-semibold">Key Performance Indicators</h3>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {kpis.map((kpi, index) => (
            <motion.div
              key={kpi.metric}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="glass-strong rounded-xl p-5"
            >
              <div className="mb-3 flex items-start justify-between">
                <h4 className="text-foreground text-sm font-semibold">{kpi.metric}</h4>
                <div className="text-primary text-2xl font-bold">{kpi.target}</div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-text-secondary">Method:</span>
                  <span className="text-foreground">{kpi.measurement_method}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-text-secondary">Frequency:</span>
                  <span className="text-foreground">{kpi.frequency}</span>
                </div>
              </div>

              {/* Animated indicator */}
              <motion.div
                className="bg-primary mt-3 h-1 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                transition={{ delay: index * 0.1 + 0.3, duration: 0.6 }}
              />
            </motion.div>
          ))}
        </div>
      </div>

      {/* Evaluation Methods */}
      {evaluationMethods && evaluationMethods.length > 0 && (
        <div>
          <div className="mb-4 flex items-center gap-2">
            <ClipboardCheck className="text-secondary h-5 w-5" />
            <h3 className="text-heading text-foreground font-semibold">Evaluation Methods</h3>
          </div>

          <div className="space-y-3">
            {evaluationMethods.map((method, index) => (
              <motion.div
                key={method.method}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.08 }}
                className="glass-strong flex items-center justify-between rounded-lg p-4"
              >
                <div className="flex-1">
                  <div className="text-foreground mb-1 text-sm font-medium">{method.method}</div>
                  <div className="text-text-secondary text-xs">{method.timing}</div>
                </div>
                <div className="text-primary text-lg font-bold">{method.weight}</div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
