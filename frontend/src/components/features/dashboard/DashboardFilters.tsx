'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDashboardStore } from '@/store/dashboardStore';
import { DashboardFilters as FilterTypes } from '@/types/dashboard';

interface DashboardFiltersProps {
  className?: string;
}

export function DashboardFilters({ className }: DashboardFiltersProps): React.JSX.Element {
  const { filters, setFilters, resetFilters, settings, setSettings } = useDashboardStore();

  const updateDateRange = (key: 'start' | 'end', value: string) => {
    setFilters({
      dateRange: {
        ...filters.dateRange,
        [key]: value,
      },
    });
  };

  const toggleFilter = (filterType: keyof FilterTypes, value: string) => {
    const currentValues = filters[filterType] as string[];
    const newValues = currentValues.includes(value)
      ? currentValues.filter((v) => v !== value)
      : [...currentValues, value];

    setFilters({ [filterType]: newValues });
  };

  const clearFilter = (filterType: keyof FilterTypes, value: string) => {
    const currentValues = filters[filterType] as string[];
    setFilters({
      [filterType]: currentValues.filter((v) => v !== value),
    });
  };

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="glass-card p-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-slate-600 dark:text-slate-400" />
            <h3 className="text-foreground text-lg font-semibold">Dashboard Filters</h3>
          </div>
          <Button
            variant="outline"
            size="small"
            onClick={resetFilters}
            className="text-slate-600 dark:text-slate-400"
          >
            Reset All
          </Button>
        </div>

        {/* Date Range Filter */}
        <div className="mb-6">
          <div className="mb-3 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-slate-600 dark:text-slate-400" />
            <h4 className="text-foreground font-medium">Date Range</h4>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="text-foreground mb-1 block text-sm font-medium">Start Date</label>
              <input
                type="date"
                value={filters.dateRange.start}
                onChange={(e) => updateDateRange('start', e.target.value)}
                className="glass text-foreground placeholder:text-foreground/50 focus-visible:ring-primary/50 focus-visible:ring-offset-background w-full rounded-md px-3 py-2 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:opacity-50"
              />
            </div>
            <div>
              <label className="text-foreground mb-1 block text-sm font-medium">End Date</label>
              <input
                type="date"
                value={filters.dateRange.end}
                onChange={(e) => updateDateRange('end', e.target.value)}
                className="glass text-foreground placeholder:text-foreground/50 focus-visible:ring-primary/50 focus-visible:ring-offset-background w-full rounded-md px-3 py-2 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:opacity-50"
              />
            </div>
          </div>
        </div>

        {/* Module Status Filter */}
        <div className="mb-6">
          <h4 className="text-foreground mb-3 font-medium">Module Status</h4>
          <div className="flex flex-wrap gap-2">
            {['not_started', 'in_progress', 'completed'].map((status) => (
              <button
                key={status}
                onClick={() => toggleFilter('status', status)}
                className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                  filters.status.includes(status)
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-400 dark:hover:bg-slate-600'
                }`}
              >
                {status.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                {filters.status.includes(status) && (
                  <X
                    className="ml-1 inline h-3 w-3"
                    onClick={(e) => {
                      e.stopPropagation();
                      clearFilter('status', status);
                    }}
                  />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Categories Filter */}
        <div className="mb-6">
          <h4 className="text-foreground mb-3 font-medium">Categories</h4>
          <div className="flex flex-wrap gap-2">
            {['Technical', 'Business', 'Design', 'Marketing', 'Operations'].map((category) => (
              <button
                key={category}
                onClick={() => toggleFilter('categories', category)}
                className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                  filters.categories.includes(category)
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-400 dark:hover:bg-slate-600'
                }`}
              >
                {category}
                {filters.categories.includes(category) && (
                  <X
                    className="ml-1 inline h-3 w-3"
                    onClick={(e) => {
                      e.stopPropagation();
                      clearFilter('categories', category);
                    }}
                  />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Settings */}
        <div className="border-t border-slate-200 pt-6 dark:border-slate-700">
          <h4 className="text-foreground mb-3 font-medium">Display Settings</h4>
          <div className="space-y-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={settings.showAnimations}
                onChange={(e) => setSettings({ showAnimations: e.target.checked })}
                className="glass text-primary focus-visible:ring-primary/50 focus-visible:ring-offset-background h-4 w-4 rounded focus-visible:ring-2 focus-visible:ring-offset-2"
              />
              <span className="text-foreground text-sm">Show animations</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={settings.theme === 'dark'}
                onChange={(e) => setSettings({ theme: e.target.checked ? 'dark' : 'light' })}
                className="glass text-primary focus-visible:ring-primary/50 focus-visible:ring-offset-background h-4 w-4 rounded focus-visible:ring-2 focus-visible:ring-offset-2"
              />
              <span className="text-foreground text-sm">Dark theme</span>
            </label>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
