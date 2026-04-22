'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Shield, ChevronRight } from 'lucide-react';

interface Risk {
  risk: string;
  probability: string;
  impact: string;
  mitigation_strategy: string;
}

interface RiskMitigationInfographicProps {
  risks: Risk[];
  contingency_plans?: string[];
}

const getProbabilityColor = (probability: string) => {
  const prob = probability.toLowerCase();
  if (prob === 'high') return 'text-error border-error/30 bg-error/10';
  if (prob === 'medium') return 'text-warning border-warning/30 bg-warning/10';
  return 'text-success border-success/30 bg-success/10';
};

const getImpactColor = (impact: string) => {
  const imp = impact.toLowerCase();
  if (imp === 'high') return 'text-error';
  if (imp === 'medium') return 'text-warning';
  return 'text-success';
};

export function RiskMitigationInfographic({
  risks,
  contingency_plans,
}: RiskMitigationInfographicProps): React.JSX.Element {
  return (
    <div className="space-y-6">
      {/* Risks Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {risks.map((risk, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="glass-strong group rounded-xl border border-white/10 p-6 transition-all hover:scale-[1.02]"
          >
            {/* Risk Header */}
            <div className="mb-4 flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className={`rounded-lg p-2 ${getProbabilityColor(risk.probability)}`}>
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h4 className="mb-2 font-semibold text-white">{risk.risk}</h4>
                  <div className="flex gap-3">
                    <span className="text-xs">
                      <span className="text-text-secondary">Probability: </span>
                      <span className={getProbabilityColor(risk.probability).split(' ')[0]}>
                        {risk.probability}
                      </span>
                    </span>
                    <span className="text-xs">
                      <span className="text-text-secondary">Impact: </span>
                      <span className={getImpactColor(risk.impact)}>{risk.impact}</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Mitigation Strategy */}
            <div className="rounded-lg bg-white/5 p-4">
              <div className="mb-2 flex items-center gap-2">
                <Shield className="text-primary h-4 w-4" />
                <p className="text-sm font-medium text-white">Mitigation Strategy</p>
              </div>
              <p className="text-text-secondary text-sm leading-relaxed">
                {risk.mitigation_strategy}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Contingency Plans */}
      {contingency_plans && contingency_plans.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="glass border-primary/30 rounded-xl border p-6"
        >
          <h4 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
            <Shield className="text-primary h-5 w-5" />
            Contingency Plans
          </h4>
          <div className="space-y-3">
            {contingency_plans.map((plan, index) => (
              <div key={index} className="flex items-start gap-3">
                <ChevronRight className="text-primary mt-0.5 h-4 w-4 flex-shrink-0" />
                <p className="text-text-secondary text-sm">{plan}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
