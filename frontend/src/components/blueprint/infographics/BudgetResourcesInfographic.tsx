'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  DollarSign,
  Users,
  Wrench,
  TrendingUp,
  BarChart3,
  PieChart as PieChartIcon,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Bar,
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';

interface BudgetItem {
  item: string;
  amount: number;
}

interface HumanResource {
  role: string;
  fte: number;
  duration: string;
}

interface Tool {
  category: string;
  name: string;
  cost_type: string;
}

interface BudgetResourcesInfographicProps {
  budget?: {
    currency: string;
    items: BudgetItem[];
    total: number;
  };
  human_resources?: HumanResource[];
  tools_and_platforms?: Tool[];
}

const COLORS = ['#a7dadb', '#7bc5c7', '#d0edf0', '#5ba0a2', '#4F46E5', '#7C69F5'];

export function BudgetResourcesInfographic({
  budget,
  human_resources,
  tools_and_platforms,
}: BudgetResourcesInfographicProps): React.JSX.Element {
  // Prepare budget chart data
  const budgetChartData =
    budget?.items.map((item) => ({
      name: item.item.length > 20 ? `${item.item.substring(0, 20)}...` : item.item,
      value: item.amount,
      fullName: item.item,
    })) || [];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass rounded-lg border border-white/20 p-3 backdrop-blur-xl">
          <p className="text-sm font-semibold text-white">{payload[0].payload.fullName}</p>
          <p className="text-primary text-xs font-medium">
            {budget?.currency} {payload[0].value.toLocaleString()}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Budget Section */}
      {budget && (
        <div className="grid grid-cols-2 gap-6">
          {/* Budget Breakdown */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-strong rounded-xl border border-white/10 p-6"
          >
            <div className="mb-4 flex items-center gap-3">
              <div className="bg-success/20 rounded-xl p-3">
                <DollarSign className="text-success h-6 w-6" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-white">Budget Breakdown</h4>
                <p className="text-text-secondary text-sm">Total allocation by category</p>
              </div>
            </div>

            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <defs>
                  {COLORS.map((color, index) => (
                    <linearGradient
                      key={index}
                      id={`budgetGradient${index}`}
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="0%" stopColor={color} stopOpacity={1} />
                      <stop offset="100%" stopColor={color} stopOpacity={0.6} />
                    </linearGradient>
                  ))}
                </defs>
                <Pie
                  data={budgetChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(props: any) => {
                    const percentage = ((props.value / (budget?.total || 1)) * 100).toFixed(0);
                    return `${percentage}%`;
                  }}
                  outerRadius={90}
                  fill="#8884d8"
                  dataKey="value"
                  animationDuration={1500}
                >
                  {budgetChartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={`url(#budgetGradient${index % COLORS.length})`}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>

            <div className="mt-4 rounded-lg bg-white/5 p-4">
              <div className="flex items-center justify-between">
                <span className="text-text-secondary text-sm font-medium">Total Budget</span>
                <span className="text-success text-xl font-bold">
                  {budget.currency} {budget.total.toLocaleString()}
                </span>
              </div>
            </div>
          </motion.div>

          {/* Budget Items List */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-strong rounded-xl border border-white/10 p-6"
          >
            <div className="mb-4 flex items-center gap-3">
              <div className="bg-primary/20 rounded-xl p-3">
                <BarChart3 className="text-primary h-6 w-6" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-white">Cost Items</h4>
                <p className="text-text-secondary text-sm">Detailed breakdown</p>
              </div>
            </div>

            <div className="space-y-3">
              {budget.items.map((item, index) => {
                const percentage = ((item.amount / budget.total) * 100).toFixed(1);
                return (
                  <div key={index} className="rounded-lg bg-white/5 p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm font-medium text-white">{item.item}</span>
                      <span className="text-primary text-sm font-bold">
                        {budget.currency} {item.amount.toLocaleString()}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-white/10">
                      <motion.div
                        className="bg-primary h-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ delay: index * 0.1, duration: 0.8 }}
                      />
                    </div>
                    <span className="text-text-secondary mt-1 text-xs">{percentage}% of total</span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>
      )}

      {/* Human Resources */}
      {human_resources && human_resources.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-strong rounded-xl border border-white/10 p-6"
        >
          <div className="mb-6 flex items-center gap-3">
            <div className="bg-warning/20 rounded-xl p-3">
              <Users className="text-warning h-6 w-6" />
            </div>
            <div>
              <h4 className="text-lg font-bold text-white">Human Resources</h4>
              <p className="text-text-secondary text-sm">Team allocation and capacity</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {human_resources.map((hr, index) => (
              <div key={index} className="rounded-lg border border-white/10 bg-white/5 p-4">
                <h5 className="mb-3 font-semibold text-white">{hr.role}</h5>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-text-secondary text-sm">FTE</span>
                    <span className="text-primary text-sm font-bold">{hr.fte}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-text-secondary text-sm">Duration</span>
                    <span className="text-sm font-medium text-white">{hr.duration}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Tools & Platforms */}
      {tools_and_platforms && tools_and_platforms.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-strong rounded-xl border border-white/10 p-6"
        >
          <div className="mb-6 flex items-center gap-3">
            <div className="bg-primary/20 rounded-xl p-3">
              <Wrench className="text-primary h-6 w-6" />
            </div>
            <div>
              <h4 className="text-lg font-bold text-white">Tools & Platforms</h4>
              <p className="text-text-secondary text-sm">Technology stack and resources</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {tools_and_platforms.map((tool, index) => (
              <div
                key={index}
                className="flex items-center gap-4 rounded-lg border border-white/10 bg-white/5 p-4"
              >
                <div className="flex-1">
                  <h5 className="mb-1 font-medium text-white">{tool.name}</h5>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-primary">{tool.category}</span>
                    <span className="text-text-secondary">•</span>
                    <span className="text-text-secondary">{tool.cost_type}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
