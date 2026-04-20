'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { ModuleData } from '@/types/dashboard';

interface ModuleBreakdownChartProps {
  data: ModuleData[];
  className?: string;
}

const COLORS = {
  completed: 'var(--success)',
  in_progress: 'var(--warning)',
  not_started: 'var(--neutral-500)',
};

const STATUS_LABELS = {
  completed: 'Completed',
  in_progress: 'In Progress',
  not_started: 'Not Started',
};

const CustomTooltip = ({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: { name: string; value: number; percentage: number; color: string } }>;
}) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <motion.div
        className="glass-card p-4"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
      >
        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{data.name}</p>
        <div className="mt-2 space-y-1">
          <p className="text-sm">
            <span
              className="mr-2 inline-block h-3 w-3 rounded-full"
              // One-off: Dynamic color from chart data - cannot be tokenized as it varies per dataset
              style={{ backgroundColor: data.color }}
            />
            Modules: <span className="font-semibold">{data.value}</span>
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {data.percentage.toFixed(1)}% of total
          </p>
        </div>
      </motion.div>
    );
  }
  return null;
};

const CustomLegend = ({ payload }: { payload: Array<{ value: string; color: string }> }) => (
  <div className="mt-4 flex flex-wrap justify-center gap-4">
    {payload.map((entry, index) => (
      <motion.div
        key={index}
        className="flex items-center gap-2"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.1 }}
      >
        {/* One-off: Dynamic color from chart legend - data-driven colors */}
        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: entry.color }} />
        <span className="text-sm text-slate-600 dark:text-slate-400">{entry.value}</span>
      </motion.div>
    ))}
  </div>
);

export function ModuleBreakdownChart({
  data,
  className,
}: ModuleBreakdownChartProps): React.JSX.Element {
  // Aggregate data by status
  const chartData = data.reduce(
    (acc, module) => {
      const existing = acc.find((item) => item.status === module.status);
      if (existing) {
        existing.value += 1;
      } else {
        acc.push({
          name: STATUS_LABELS[module.status],
          status: module.status,
          value: 1,
          color: COLORS[module.status],
        });
      }
      return acc;
    },
    [] as Array<{
      name: string;
      status: string;
      value: number;
      color: string;
      percentage?: number;
    }>
  );

  // Calculate percentages
  const total = chartData.reduce((sum, item) => sum + item.value, 0);
  chartData.forEach((item) => {
    item.percentage = (item.value / total) * 100;
  });

  // Custom label function for pie chart
  const renderCustomizedLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percentage,
  }: any) => {
    if (percentage < 10) return null; // Don't show label if less than 10%

    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        fontSize="12"
        fontWeight="bold"
      >
        {percentage.toFixed(0)}%
      </text>
    );
  };

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Module Breakdown
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Distribution of module completion status
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-slate-600 dark:text-slate-400">Total: {total} modules</p>
        </div>
      </div>

      <div className="relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomizedLabel}
              outerRadius={80}
              fill="var(--secondary-accent)"
              dataKey="value"
              animationBegin={0}
              animationDuration={1000}
            >
              {chartData.map((entry) => (
                <Cell key={`cell-${entry.name}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>

        {/* Custom Legend */}
        <CustomLegend
          payload={chartData.map((item) => ({
            value: item.name,
            color: item.color,
            type: 'rect',
          }))}
        />
      </div>

      {/* Detailed stats */}
      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        {chartData.map((item, index) => (
          <motion.div
            key={item.status}
            className="text-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 + index * 0.1 }}
          >
            {/* One-off: Dynamic color from visualization data */}
            <div
              className="mx-auto mb-2 h-4 w-4 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{item.value}</p>
            <p className="text-xs text-slate-600 dark:text-slate-400">{item.name}</p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
