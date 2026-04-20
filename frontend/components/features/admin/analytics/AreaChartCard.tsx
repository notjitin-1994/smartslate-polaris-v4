'use client';

import { motion } from 'framer-motion';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { LucideIcon } from 'lucide-react';

interface AreaChartCardProps {
  title: string;
  data: Array<{ date: string; value: number }>;
  icon: LucideIcon;
  color: string;
  gradientId: string;
  formatValue?: (value: number) => string;
}

export function AreaChartCard({
  title,
  data,
  icon: Icon,
  color,
  gradientId,
  formatValue = (value) => value.toString(),
}: AreaChartCardProps) {
  const colorClass =
    {
      cyan: 'text-cyan-400',
      blue: 'text-blue-400',
      purple: 'text-purple-400',
      green: 'text-green-400',
      red: 'text-red-400',
      orange: 'text-orange-400',
    }[color] || 'text-cyan-400';

  const strokeColor =
    {
      cyan: '#22d3ee',
      blue: '#3b82f6',
      purple: '#a855f7',
      green: '#22c55e',
      red: '#ef4444',
      orange: '#f97316',
    }[color] || '#22d3ee';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm"
    >
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={`rounded-lg bg-${color}-500/20 p-2`}>
            <Icon className={`h-5 w-5 ${colorClass}`} />
          </div>
          <h3 className="font-semibold text-white">{title}</h3>
        </div>
      </div>

      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={strokeColor} stopOpacity={0.3} />
                <stop offset="95%" stopColor={strokeColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="date" stroke="rgba(255,255,255,0.5)" fontSize={12} tickLine={false} />
            <YAxis
              stroke="rgba(255,255,255,0.5)"
              fontSize={12}
              tickLine={false}
              tickFormatter={formatValue}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(2, 12, 27, 0.9)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                color: '#fff',
              }}
              formatter={formatValue}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={strokeColor}
              fillOpacity={1}
              fill={`url(#${gradientId})`}
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
