'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { TimelineData } from '@/types/dashboard';
import { format, parseISO } from 'date-fns';

interface TimelineChartProps {
  data: TimelineData[];
  className?: string;
}

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ payload: TimelineData }>;
  label?: string;
}) => {
  if (active && payload && payload.length && label) {
    const data = payload[0].payload;
    return (
      <motion.div
        className="rounded-lg border border-neutral-200 bg-white p-4 shadow-lg dark:border-neutral-700 dark:bg-neutral-800"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
      >
        <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
          {format(parseISO(label), 'MMM dd, yyyy')}
        </p>
        <div className="mt-2 space-y-1">
          <p className="text-info dark:text-info text-sm">
            Learning Hours: <span className="font-semibold">{data.learningHours}h</span>
          </p>
          <p className="text-success dark:text-success text-sm">
            Progress: <span className="font-semibold">{data.progressPercentage}%</span>
          </p>
          {data.milestones && data.milestones.length > 0 && (
            <div className="mt-2">
              <p className="mb-1 text-xs text-neutral-600 dark:text-neutral-400">Milestones:</p>
              <ul className="space-y-1 text-xs">
                {data.milestones.map((milestone: string, index: number) => (
                  <li key={index} className="text-neutral-700 dark:text-neutral-300">
                    • {milestone}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </motion.div>
    );
  }
  return null;
};

export function TimelineChart({ data, className }: TimelineChartProps): React.JSX.Element {
  // Transform data for better chart display
  const chartData = data.map((item) => ({
    ...item,
    date: format(parseISO(item.date), 'MMM dd'),
    fullDate: item.date,
  }));

  // Calculate milestones for reference lines
  const milestones = data
    .filter((item) => item.milestones && item.milestones.length > 0)
    .map((item) => ({
      date: format(parseISO(item.date), 'MMM dd'),
      milestones: item.milestones,
    }));

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
            Learning Timeline
          </h3>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Progress and learning hours over time
          </p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 20,
          }}
        >
          <defs>
            <linearGradient id="learningHoursGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--info)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="var(--info)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="progressGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--success)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="var(--success)" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--neutral-200)"
            strokeOpacity={0.5}
            className="dark:stroke-neutral-700"
          />

          <XAxis
            dataKey="date"
            tick={{ fontSize: 12, fill: 'var(--neutral-500)' }}
            axisLine={{ stroke: 'var(--neutral-200)' }}
            className="dark:text-neutral-400"
          />

          <YAxis
            yAxisId="hours"
            orientation="left"
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

          <YAxis
            yAxisId="progress"
            orientation="right"
            tick={{ fontSize: 12, fill: 'var(--neutral-500)' }}
            axisLine={{ stroke: 'var(--neutral-200)' }}
            label={{
              value: 'Progress %',
              angle: 90,
              position: 'insideRight',
              style: { textAnchor: 'middle', fill: 'var(--neutral-500)' },
            }}
            className="dark:text-neutral-400"
          />

          <Tooltip content={<CustomTooltip />} />

          {/* Learning Hours Area */}
          <Area
            yAxisId="hours"
            type="monotone"
            dataKey="learningHours"
            stroke="var(--info)"
            strokeWidth={2}
            fill="url(#learningHoursGradient)"
            name="Learning Hours"
            dot={{ fill: 'var(--info)', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: 'var(--info)', strokeWidth: 2 }}
          />

          {/* Progress Area */}
          <Area
            yAxisId="progress"
            type="monotone"
            dataKey="progressPercentage"
            stroke="var(--success)"
            strokeWidth={2}
            fill="url(#progressGradient)"
            name="Progress %"
            dot={{ fill: 'var(--success)', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: 'var(--success)', strokeWidth: 2 }}
          />

          {/* Milestone reference lines */}
          {milestones.map((milestone, index) => (
            <ReferenceLine
              key={index}
              x={milestone.date}
              stroke="var(--warning)"
              strokeDasharray="5 5"
              label={{
                value: 'Milestone',
                position: 'top' as any,
                offset: 10,
                style: { fill: 'var(--warning)', fontSize: '10px' },
              }}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
