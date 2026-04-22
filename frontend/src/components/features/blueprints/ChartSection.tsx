/**
 * Chart Section Component
 * Dynamic chart rendering for quantitative data
 */

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { formatSectionTitle } from './utils';

interface ChartSectionProps {
  sectionKey: string;
  data: any;
}

const COLORS = ['#0ea5e9', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4'];

export function ChartSection({ sectionKey, data }: ChartSectionProps): React.JSX.Element {
  const chartType = data.chartConfig?.type || 'bar';
  const chartData = prepareChartData(data);

  if (!chartData || chartData.length === 0) {
    return (
      <div className="glass rounded-2xl p-8 text-center">
        <p className="text-text-secondary">No chart data available</p>
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl p-6 md:p-8">
      <h2 className="text-title text-foreground mb-6">{formatSectionTitle(sectionKey)}</h2>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="h-96"
      >
        <ResponsiveContainer width="100%" height="100%">
          {renderChart(chartType, chartData)}
        </ResponsiveContainer>
      </motion.div>
    </div>
  );
}

function renderChart(type: string, data: any[]): React.JSX.Element {
  switch (type) {
    case 'line':
      return (
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" />
          <YAxis stroke="rgba(255,255,255,0.5)" />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="value" stroke="#8b5cf6" strokeWidth={2} />
        </LineChart>
      );

    case 'pie':
      return (
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={120} label>
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      );

    case 'radar':
      return (
        <RadarChart data={data}>
          <PolarGrid stroke="rgba(255,255,255,0.1)" />
          <PolarAngleAxis dataKey="name" stroke="rgba(255,255,255,0.5)" />
          <PolarRadiusAxis stroke="rgba(255,255,255,0.5)" />
          <Radar name="Value" dataKey="value" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.5} />
          <Tooltip />
          <Legend />
        </RadarChart>
      );

    case 'bar':
    default:
      return (
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" />
          <YAxis stroke="rgba(255,255,255,0.5)" />
          <Tooltip />
          <Legend />
          <Bar dataKey="value" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
        </BarChart>
      );
  }
}

/**
 * Prepare data for charting
 * Attempts to extract chartable data from various section structures
 */
function prepareChartData(data: any): any[] {
  // Try to find chartable data in common formats
  if (Array.isArray(data)) {
    return data.map((item, index) => ({
      name: item.name || item.label || `Item ${index + 1}`,
      value: item.value || item.amount || item.percentage || 0,
    }));
  }

  if (data.items && Array.isArray(data.items)) {
    return data.items.map((item: any, index: number) => ({
      name: item.name || item.label || `Item ${index + 1}`,
      value: item.value || item.amount || item.percentage || 0,
    }));
  }

  if (data.metrics && Array.isArray(data.metrics)) {
    return data.metrics.map((metric: any) => ({
      name: metric.metric || metric.name,
      value: parseFloat(metric.target) || 0,
    }));
  }

  // Fallback: try to convert object to array
  if (typeof data === 'object') {
    return Object.entries(data)
      .filter(([key]) => key !== 'displayType' && key !== 'chartConfig')
      .map(([key, value]) => ({
        name: formatSectionTitle(key),
        value: typeof value === 'number' ? value : 0,
      }));
  }

  return [];
}
