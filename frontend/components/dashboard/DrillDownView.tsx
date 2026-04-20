'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, X } from 'lucide-react';
import { useDrillDown } from './DrillDownProvider';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface DrillDownViewProps {
  className?: string;
}

export function DrillDownView({ className }: DrillDownViewProps): React.JSX.Element {
  const { drillDownState, drillUp, resetDrillDown } = useDrillDown();

  if (!drillDownState || drillDownState.path.length === 0) {
    return <div className={cn('hidden', className)} />;
  }

  const currentPath = drillDownState.path[drillDownState.path.length - 1];
  const pathString = drillDownState.path.join(' > ');

  return (
    <AnimatePresence>
      <motion.div
        className={cn(
          'bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black p-4',
          className
        )}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="glass-strong max-h-preview w-full max-w-4xl overflow-hidden rounded-xl shadow-2xl"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', duration: 0.3 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 p-6 dark:border-slate-700">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="small"
                onClick={drillUp}
                disabled={drillDownState.path.length <= 1}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                  {currentPath}
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">{pathString}</p>
              </div>
            </div>
            <Button variant="ghost" size="small" onClick={resetDrillDown}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="max-h-[calc(90vh-120px)] overflow-y-auto p-6">
            <DrillDownContent data={drillDownState.data} filters={drillDownState.filters} />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 p-6 dark:border-slate-700 dark:bg-slate-800">
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <span>Path: {pathString}</span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="small" onClick={drillUp}>
                Back
              </Button>
              <Button variant="secondary" size="small" onClick={resetDrillDown}>
                Close
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

interface DrillDownContentProps {
  data: unknown;
  filters: Record<string, unknown>;
}

function DrillDownContent({ data, filters }: DrillDownContentProps): React.JSX.Element {
  if (typeof data === 'object' && data !== null) {
    return (
      <div className="space-y-6">
        {/* Object properties */}
        {Object.entries(data).map(([key, value]) => (
          <motion.div
            key={key}
            className="rounded-lg bg-slate-50 p-4 dark:bg-slate-800"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h3 className="mb-2 font-medium text-slate-900 dark:text-slate-100">
              {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
            </h3>
            <div className="text-slate-700 dark:text-slate-300">
              {typeof value === 'object' && value !== null ? (
                <DrillDownContent data={value} filters={filters} />
              ) : (
                <p className="glass rounded p-2 font-mono text-sm">{String(value)}</p>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-800">
      <p className="glass rounded p-2 font-mono text-sm">{String(data)}</p>
    </div>
  );
}
