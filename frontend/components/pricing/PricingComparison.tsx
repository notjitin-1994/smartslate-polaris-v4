/**
 * Pricing Comparison Component
 */

'use client';

import React from 'react';
import { Check, X } from 'lucide-react';

interface PricingComparisonProps {
  plans: any[];
  planType: 'personal' | 'team';
}

export function PricingComparison({ plans, planType }: PricingComparisonProps): React.JSX.Element {
  const features = [
    'AI-Assisted Learning Experience Design',
    'Professional templates & formatting',
    'Export capabilities',
    'Support level',
    'Cost per creation',
    'Advanced features',
  ];

  return (
    <div className="glass-card overflow-hidden rounded-2xl border border-white/10">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="border-b border-white/10">
            <tr>
              <th className="text-foreground p-4 text-left text-sm font-medium">Features</th>
              {plans.map((plan) => (
                <th key={plan.id} className="text-foreground p-4 text-center text-sm font-medium">
                  {plan.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {features.map((feature, index) => (
              <tr key={feature} className={index % 2 === 0 ? 'bg-white/[0.02]' : ''}>
                <td className="text-text-secondary p-4 text-sm">{feature}</td>
                {plans.map((plan) => (
                  <td key={plan.id} className="p-4 text-center">
                    <Check className="text-success mx-auto h-4 w-4" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
