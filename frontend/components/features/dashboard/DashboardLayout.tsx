'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { DashboardData } from '@/types/dashboard';

interface DashboardLayoutProps {
  data: DashboardData;
  children: React.ReactNode;
  className?: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.16, 1, 0.3, 1] as const,
    },
  },
};

export function DashboardLayout({
  data,
  children,
  className,
}: DashboardLayoutProps): React.JSX.Element {
  return (
    <motion.div
      className={cn('min-h-screen bg-slate-50 dark:bg-slate-900', className)}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Dashboard Header */}
        <motion.header className="mb-6 sm:mb-8" variants={itemVariants}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl lg:text-4xl dark:text-slate-100">
                {data.title}
              </h1>
              <p className="mt-1 text-sm text-slate-600 sm:text-base dark:text-slate-400">
                Last updated: {new Date(data.updatedAt).toLocaleDateString()}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'inline-flex items-center rounded-full px-3 py-1 text-xs font-medium',
                  data.status === 'completed'
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : data.status === 'draft'
                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                )}
              >
                {data.status.charAt(0).toUpperCase() + data.status.slice(1)}
              </span>
            </div>
          </div>
        </motion.header>

        {/* Dashboard Grid Layout */}
        <motion.main className="space-y-6" variants={containerVariants}>
          {/* Top Row - KPIs */}
          <motion.section
            className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 lg:grid-cols-4"
            variants={itemVariants}
          >
            {children}
          </motion.section>

          {/* Middle Row - Main Charts */}
          <motion.div
            className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6"
            variants={itemVariants}
          >
            {/* Timeline Chart */}
            <motion.div className="glass-card p-6" variants={itemVariants}>
              <div id="timeline-chart" className="h-80">
                {/* Timeline chart will be rendered here */}
              </div>
            </motion.div>

            {/* Module Breakdown Chart */}
            <motion.div className="glass-card p-6" variants={itemVariants}>
              <div id="module-breakdown-chart" className="h-80">
                {/* Module breakdown chart will be rendered here */}
              </div>
            </motion.div>
          </motion.div>

          {/* Bottom Row - Secondary Charts */}
          <motion.div
            className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6"
            variants={itemVariants}
          >
            {/* Activity Distribution Chart */}
            <motion.div className="glass-card p-6" variants={itemVariants}>
              <div id="activity-chart" className="h-72">
                {/* Activity distribution chart will be rendered here */}
              </div>
            </motion.div>

            {/* Resources Overview */}
            <motion.div className="glass-card p-6" variants={itemVariants}>
              <div id="resources-overview" className="h-72">
                {/* Resources overview will be rendered here */}
              </div>
            </motion.div>
          </motion.div>

          {/* Mobile-specific adjustments */}
          <div className="block lg:hidden">
            <motion.div
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-lg dark:border-slate-700 dark:bg-slate-800"
              variants={itemVariants}
            >
              <p className="text-center text-sm text-slate-600 dark:text-slate-400">
                For the best experience, view this dashboard on a larger screen.
              </p>
            </motion.div>
          </div>
        </motion.main>
      </div>
    </motion.div>
  );
}
