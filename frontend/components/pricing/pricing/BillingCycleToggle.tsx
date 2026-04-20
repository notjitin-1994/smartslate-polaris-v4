'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, CalendarClock } from 'lucide-react';

export type BillingCycle = 'monthly' | 'yearly';

interface BillingCycleToggleProps {
  billingCycle: BillingCycle;
  onBillingCycleChange: (cycle: BillingCycle) => void;
}

const BillingCycleToggle: React.FC<BillingCycleToggleProps> = ({
  billingCycle,
  onBillingCycleChange,
}) => {
  return (
    <div className="inline-flex items-center gap-4">
      <div className="inline-flex rounded-lg border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.05)] p-1">
        <button
          onClick={() => onBillingCycleChange('monthly')}
          className={`flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-semibold transition-all duration-300 ${
            billingCycle === 'monthly'
              ? 'border border-[rgb(167,218,219)] bg-[rgba(167,218,219,0.15)] text-[rgb(167,218,219)]'
              : 'border-none bg-transparent text-[rgb(176,197,198)] hover:bg-[rgba(255,255,255,0.05)]'
          }`}
        >
          <Calendar className="h-4 w-4" />
          Monthly
        </button>

        <button
          onClick={() => onBillingCycleChange('yearly')}
          className={`flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-semibold transition-all duration-300 ${
            billingCycle === 'yearly'
              ? 'border border-[rgb(167,218,219)] bg-[rgba(167,218,219,0.15)] text-[rgb(167,218,219)]'
              : 'border-none bg-transparent text-[rgb(176,197,198)] hover:bg-[rgba(255,255,255,0.05)]'
          }`}
        >
          <CalendarClock className="h-4 w-4" />
          Annual
        </button>
      </div>

      {/* Savings Badge */}
      <AnimatePresence>
        {billingCycle === 'yearly' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            className="rounded-full bg-[rgba(167,218,219,0.15)] px-3 py-1 text-xs font-bold text-[rgb(167,218,219)]"
          >
            Save 17% annually
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BillingCycleToggle;
