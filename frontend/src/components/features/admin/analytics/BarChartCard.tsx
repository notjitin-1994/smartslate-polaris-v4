'use client';

import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { LucideIcon } from 'lucide-react';

interface BarChartCardProps {
  title: string;
  data: Array<{ name: string; [key: string]: string | number }>;
  icon: LucideIcon;
  bars: Array<{ dataKey: string; fill: string; name: string }>;
  formatValue?: (value: number) => string;
}

export function BarChartCard({
  title,
  data,
  icon: Icon,
  bars,
  formatValue = (value) => value.toString(),
}: BarChartCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm"
    >
      <div className="mb-4 flex items-center space-x-3">
        <div className="rounded-lg bg-cyan-500/20 p-2">
          <Icon className="h-5 w-5 text-cyan-400" />
        </div>
        <h3 className="font-semibold text-white">{title}</h3>
      </div>

      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" fontSize={12} tickLine={false} />
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
            <Legend
              wrapperStyle={{
                color: '#fff',
                fontSize: '12px',
              }}
            />
            {bars.map((bar) => (
              <Bar key={bar.dataKey} dataKey={bar.dataKey} fill={bar.fill} name={bar.name} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
