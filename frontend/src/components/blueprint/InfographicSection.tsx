/**
 * Infographic Section Component
 * Industry-leading infographic visualizations with motion graphics
 */

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ObjectivesInfographic } from './infographics/ObjectivesInfographic';
import { TargetAudienceInfographic } from './infographics/TargetAudienceInfographic';
import { AssessmentStrategyInfographic } from './infographics/AssessmentStrategyInfographic';
import { SuccessMetricsInfographic } from './infographics/SuccessMetricsInfographic';
import { formatSectionTitle } from './utils';
import type { BlueprintSectionProps } from './types';

export function InfographicSection({
  sectionKey,
  data,
}: Omit<BlueprintSectionProps, 'viewMode'>): React.JSX.Element {
  const sectionTitle = formatSectionTitle(sectionKey);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="glass rounded-2xl p-6 md:p-8"
    >
      <h2 className="text-title text-foreground mb-6">{sectionTitle}</h2>

      {/* Route to appropriate infographic based on data structure */}
      {data.objectives && (
        <ObjectivesInfographic objectives={data.objectives} chartConfig={data.chartConfig} />
      )}

      {data.demographics && <TargetAudienceInfographic data={data} />}

      {data.kpis && (
        <AssessmentStrategyInfographic
          kpis={data.kpis}
          overview={data.overview}
          evaluationMethods={data.evaluation_methods}
          chartConfig={data.chartConfig}
        />
      )}

      {data.metrics && (
        <SuccessMetricsInfographic
          metrics={data.metrics}
          reportingCadence={data.reporting_cadence}
        />
      )}

      {/* Fallback for unknown infographic structures */}
      {!data.objectives && !data.demographics && !data.kpis && !data.metrics && (
        <GenericInfographic data={data} sectionKey={sectionKey} />
      )}
    </motion.div>
  );
}

/**
 * Generic fallback infographic for unknown structures
 */
function GenericInfographic({
  data,
  sectionKey,
}: {
  data: any;
  sectionKey: string;
}): React.JSX.Element {
  return (
    <div className="space-y-4">
      <div className="border-warning bg-warning/5 rounded-xl border p-4">
        <p className="text-warning mb-2 text-sm">
          Custom visualization for "{formatSectionTitle(sectionKey)}" not yet implemented
        </p>
        <p className="text-text-secondary text-xs">
          Displaying data as structured cards. This section will be enhanced with specialized
          visualizations.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Object.entries(data)
          .filter(([key]) => key !== 'displayType' && key !== 'chartConfig')
          .map(([key, value], index) => (
            <motion.div
              key={key}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className="glass-strong rounded-xl p-4"
            >
              <h4 className="text-foreground mb-2 text-sm font-medium capitalize">
                {key.replace(/_/g, ' ')}
              </h4>
              <div className="text-text-secondary text-sm">
                {typeof value === 'object' ? (
                  <pre className="overflow-auto text-xs">{JSON.stringify(value, null, 2)}</pre>
                ) : (
                  <span>{String(value)}</span>
                )}
              </div>
            </motion.div>
          ))}
      </div>
    </div>
  );
}
