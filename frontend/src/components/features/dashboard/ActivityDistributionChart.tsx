'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { ActivityData } from '@/types/dashboard';

interface ActivityDistributionChartProps {
  data: ActivityData[];
  className?: string;
}

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ payload: ActivityData }>;
  label?: string;
}) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <motion.div
        className="rounded-lg border border-neutral-200 bg-white p-4 shadow-lg dark:border-neutral-700 dark:bg-neutral-800"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
      >
        <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{label}</p>
        <div className="mt-2 space-y-1">
          <p className="text-sm">
            <span
              className="mr-2 inline-block h-3 w-3 rounded-full"
              // One-off: Dynamic color from activity data - varies per activity type
              style={{ backgroundColor: data.color }}
            />
            Hours: <span className="font-semibold">{data.hours}h</span>
          </p>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            {data.percentage.toFixed(1)}% of total time
          </p>
        </div>
      </motion.div>
    );
  }
  return null;
};

const CustomBar = (props: any) => {
  const { fill, payload, index = 0, ...rest } = props;
  return (
    <motion.rect
      {...rest}
      fill={fill}
      initial={{ scaleY: 0 }}
      animate={{ scaleY: 1 }}
      transition={{ duration: 0.8, delay: index * 0.1 }}
      // One-off: Specific transform origin for radial animation effect
      style={{ transformOrigin: 'bottom' }}
    />
  );
};

export function ActivityDistributionChart({
  data,
  className,
}: ActivityDistributionChartProps): React.JSX.Element {
  // Sort data by hours in descending order for better visualization
  const sortedData = [...data].sort((a, b) => b.hours - a.hours);

  const _maxHours = Math.max(...data.map((d) => d.hours));
  const totalHours = data.reduce((sum, item) => sum + item.hours, 0);

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            Activity Distribution
          </h3>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Time spent across different learning categories
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">Total: {totalHours}h</p>
        </div>
      </div>

      <div className="relative">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={sortedData}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 20,
            }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--neutral-200)"
              strokeOpacity={0.5}
              className="dark:stroke-neutral-700"
            />

            <XAxis
              dataKey="category"
              tick={{ fontSize: 12, fill: 'var(--neutral-500)' }}
              axisLine={{ stroke: 'var(--neutral-200)' }}
              angle={-45}
              textAnchor="end"
              height={80}
              className="dark:text-neutral-400"
            />

            <YAxis
              tick={{ fontSize: 12, fill: 'var(--neutral-500)' }}
              axisLine={{ stroke: 'var(--neutral-200)' }}
              label={{
                value: 'Hours',
                angle: -90,
                position: 'insideLeft',
                style: { textAnchor: 'middle', fill: 'var(--neutral-500)' },
              }}
              className="dark:text-neutral-400"
            />

            <Tooltip content={<CustomTooltip />} />

            <Bar dataKey="hours" radius={[4, 4, 0, 0]} shape={CustomBar}>
              {sortedData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="mt-6 flex flex-wrap justify-center gap-4">
        {sortedData.map((item, index) => (
          <motion.div
            key={item.category}
            className="flex items-center gap-2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 + index * 0.1 }}
          >
            {/* One-off: Dynamic color from chart data model */}
            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
            <span className="text-sm text-neutral-600 dark:text-neutral-400">
              {item.category}: {item.hours}h ({item.percentage.toFixed(1)}%)
            </span>
          </motion.div>
        ))}
      </div>

      {/* Additional stats */}
      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <motion.div
          className="rounded-lg bg-neutral-50 p-4 dark:bg-neutral-800"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
        >
          <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
            Most Time-Consuming
          </p>
          <p className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
            {sortedData[0]?.category}
          </p>
          <p className="text-xs text-neutral-600 dark:text-neutral-400">
            {sortedData[0]?.hours}h ({sortedData[0]?.percentage.toFixed(1)}%)
          </p>
        </motion.div>

        <motion.div
          className="rounded-lg bg-neutral-50 p-4 dark:bg-neutral-800"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
        >
          <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Categories</p>
          <p className="text-lg font-bold text-neutral-900 dark:text-neutral-100">{data.length}</p>
          <p className="text-xs text-neutral-600 dark:text-neutral-400">Learning areas</p>
        </motion.div>
      </div>
    </motion.div>
  );
}
