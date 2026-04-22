'use client';

import { BreakpointConfig } from './hooks/useResponsiveContent';

export type ChartType = 'line' | 'bar' | 'pie' | 'area' | 'scatter' | 'radar';

export interface ChartResponsiveConfig {
  height: number;
  width?: number;
  margin: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  legend: {
    enabled: boolean;
    position: 'top' | 'right' | 'bottom' | 'left' | 'none';
    maxWidth?: number;
  };
  axes: {
    showLabels: boolean;
    labelAngle?: number;
    tickCount?: number;
    fontSize: number;
  };
  tooltip: {
    enabled: boolean;
    fontSize: number;
  };
  animation: {
    duration: number;
    easing: string;
  };
  dataDensity: {
    maxPoints?: number;
    aggregation?: 'sum' | 'average' | 'max' | 'min';
  };
}

export interface ResponsiveChartOptions {
  chartType: ChartType;
  breakpoint: string;
  dataLength?: number;
  customConfig?: Partial<ChartResponsiveConfig>;
}

/**
 * Responsive chart configurations for different breakpoints and chart types
 */
const CHART_CONFIGS: Record<ChartType, Record<string, ChartResponsiveConfig>> = {
  line: {
    'mobile-compact': {
      height: 200,
      margin: { top: 8, right: 8, bottom: 24, left: 8 },
      legend: { enabled: false, position: 'none' },
      axes: { showLabels: false, fontSize: 10 },
      tooltip: { enabled: true, fontSize: 12 },
      animation: { duration: 300, easing: 'ease-out' },
      dataDensity: { maxPoints: 20 },
    },
    'mobile-expanded': {
      height: 250,
      margin: { top: 12, right: 12, bottom: 32, left: 12 },
      legend: { enabled: true, position: 'bottom', maxWidth: 200 },
      axes: { showLabels: true, fontSize: 11 },
      tooltip: { enabled: true, fontSize: 13 },
      animation: { duration: 400, easing: 'ease-out' },
      dataDensity: { maxPoints: 50 },
    },
    tablet: {
      height: 300,
      margin: { top: 16, right: 16, bottom: 40, left: 16 },
      legend: { enabled: true, position: 'right' },
      axes: { showLabels: true, fontSize: 12 },
      tooltip: { enabled: true, fontSize: 14 },
      animation: { duration: 500, easing: 'ease-out' },
      dataDensity: { maxPoints: 100 },
    },
    desktop: {
      height: 400,
      margin: { top: 20, right: 20, bottom: 50, left: 20 },
      legend: { enabled: true, position: 'top' },
      axes: { showLabels: true, fontSize: 13 },
      tooltip: { enabled: true, fontSize: 14 },
      animation: { duration: 600, easing: 'ease-out' },
      dataDensity: { maxPoints: 200 },
    },
  },
  bar: {
    'mobile-compact': {
      height: 200,
      margin: { top: 8, right: 8, bottom: 24, left: 8 },
      legend: { enabled: false, position: 'none' },
      axes: { showLabels: false, fontSize: 10 },
      tooltip: { enabled: true, fontSize: 12 },
      animation: { duration: 300, easing: 'ease-out' },
      dataDensity: { maxPoints: 8 },
    },
    'mobile-expanded': {
      height: 250,
      margin: { top: 12, right: 12, bottom: 32, left: 12 },
      legend: { enabled: true, position: 'bottom', maxWidth: 200 },
      axes: { showLabels: true, fontSize: 11 },
      tooltip: { enabled: true, fontSize: 13 },
      animation: { duration: 400, easing: 'ease-out' },
      dataDensity: { maxPoints: 12 },
    },
    tablet: {
      height: 300,
      margin: { top: 16, right: 16, bottom: 40, left: 16 },
      legend: { enabled: true, position: 'right' },
      axes: { showLabels: true, fontSize: 12 },
      tooltip: { enabled: true, fontSize: 14 },
      animation: { duration: 500, easing: 'ease-out' },
      dataDensity: { maxPoints: 20 },
    },
    desktop: {
      height: 400,
      margin: { top: 20, right: 20, bottom: 50, left: 20 },
      legend: { enabled: true, position: 'top' },
      axes: { showLabels: true, fontSize: 13 },
      tooltip: { enabled: true, fontSize: 14 },
      animation: { duration: 600, easing: 'ease-out' },
      dataDensity: { maxPoints: 50 },
    },
  },
  pie: {
    'mobile-compact': {
      height: 200,
      margin: { top: 8, right: 8, bottom: 8, left: 8 },
      legend: { enabled: true, position: 'bottom', maxWidth: 150 },
      axes: { showLabels: false, fontSize: 10 },
      tooltip: { enabled: true, fontSize: 12 },
      animation: { duration: 300, easing: 'ease-out' },
    },
    'mobile-expanded': {
      height: 250,
      margin: { top: 12, right: 12, bottom: 12, left: 12 },
      legend: { enabled: true, position: 'bottom', maxWidth: 200 },
      axes: { showLabels: false, fontSize: 11 },
      tooltip: { enabled: true, fontSize: 13 },
      animation: { duration: 400, easing: 'ease-out' },
    },
    tablet: {
      height: 300,
      margin: { top: 16, right: 16, bottom: 16, left: 16 },
      legend: { enabled: true, position: 'right' },
      axes: { showLabels: false, fontSize: 12 },
      tooltip: { enabled: true, fontSize: 14 },
      animation: { duration: 500, easing: 'ease-out' },
    },
    desktop: {
      height: 400,
      margin: { top: 20, right: 20, bottom: 20, left: 20 },
      legend: { enabled: true, position: 'right' },
      axes: { showLabels: false, fontSize: 13 },
      tooltip: { enabled: true, fontSize: 14 },
      animation: { duration: 600, easing: 'ease-out' },
    },
  },
  area: {
    'mobile-compact': {
      height: 200,
      margin: { top: 8, right: 8, bottom: 24, left: 8 },
      legend: { enabled: false, position: 'none' },
      axes: { showLabels: false, fontSize: 10 },
      tooltip: { enabled: true, fontSize: 12 },
      animation: { duration: 300, easing: 'ease-out' },
      dataDensity: { maxPoints: 20 },
    },
    'mobile-expanded': {
      height: 250,
      margin: { top: 12, right: 12, bottom: 32, left: 12 },
      legend: { enabled: true, position: 'bottom', maxWidth: 200 },
      axes: { showLabels: true, fontSize: 11 },
      tooltip: { enabled: true, fontSize: 13 },
      animation: { duration: 400, easing: 'ease-out' },
      dataDensity: { maxPoints: 50 },
    },
    tablet: {
      height: 300,
      margin: { top: 16, right: 16, bottom: 40, left: 16 },
      legend: { enabled: true, position: 'right' },
      axes: { showLabels: true, fontSize: 12 },
      tooltip: { enabled: true, fontSize: 14 },
      animation: { duration: 500, easing: 'ease-out' },
      dataDensity: { maxPoints: 100 },
    },
    desktop: {
      height: 400,
      margin: { top: 20, right: 20, bottom: 50, left: 20 },
      legend: { enabled: true, position: 'top' },
      axes: { showLabels: true, fontSize: 13 },
      tooltip: { enabled: true, fontSize: 14 },
      animation: { duration: 600, easing: 'ease-out' },
      dataDensity: { maxPoints: 200 },
    },
  },
  scatter: {
    'mobile-compact': {
      height: 200,
      margin: { top: 8, right: 8, bottom: 24, left: 8 },
      legend: { enabled: false, position: 'none' },
      axes: { showLabels: false, fontSize: 10 },
      tooltip: { enabled: true, fontSize: 12 },
      animation: { duration: 300, easing: 'ease-out' },
      dataDensity: { maxPoints: 50 },
    },
    'mobile-expanded': {
      height: 250,
      margin: { top: 12, right: 12, bottom: 32, left: 12 },
      legend: { enabled: true, position: 'bottom', maxWidth: 200 },
      axes: { showLabels: true, fontSize: 11 },
      tooltip: { enabled: true, fontSize: 13 },
      animation: { duration: 400, easing: 'ease-out' },
      dataDensity: { maxPoints: 100 },
    },
    tablet: {
      height: 300,
      margin: { top: 16, right: 16, bottom: 40, left: 16 },
      legend: { enabled: true, position: 'right' },
      axes: { showLabels: true, fontSize: 12 },
      tooltip: { enabled: true, fontSize: 14 },
      animation: { duration: 500, easing: 'ease-out' },
      dataDensity: { maxPoints: 200 },
    },
    desktop: {
      height: 400,
      margin: { top: 20, right: 20, bottom: 50, left: 20 },
      legend: { enabled: true, position: 'top' },
      axes: { showLabels: true, fontSize: 13 },
      tooltip: { enabled: true, fontSize: 14 },
      animation: { duration: 600, easing: 'ease-out' },
      dataDensity: { maxPoints: 500 },
    },
  },
  radar: {
    'mobile-compact': {
      height: 200,
      margin: { top: 8, right: 8, bottom: 8, left: 8 },
      legend: { enabled: false, position: 'none' },
      axes: { showLabels: true, fontSize: 9 },
      tooltip: { enabled: true, fontSize: 12 },
      animation: { duration: 300, easing: 'ease-out' },
    },
    'mobile-expanded': {
      height: 250,
      margin: { top: 12, right: 12, bottom: 12, left: 12 },
      legend: { enabled: true, position: 'bottom', maxWidth: 200 },
      axes: { showLabels: true, fontSize: 10 },
      tooltip: { enabled: true, fontSize: 13 },
      animation: { duration: 400, easing: 'ease-out' },
    },
    tablet: {
      height: 300,
      margin: { top: 16, right: 16, bottom: 16, left: 16 },
      legend: { enabled: true, position: 'right' },
      axes: { showLabels: true, fontSize: 11 },
      tooltip: { enabled: true, fontSize: 14 },
      animation: { duration: 500, easing: 'ease-out' },
    },
    desktop: {
      height: 400,
      margin: { top: 20, right: 20, bottom: 20, left: 20 },
      legend: { enabled: true, position: 'right' },
      axes: { showLabels: true, fontSize: 12 },
      tooltip: { enabled: true, fontSize: 14 },
      animation: { duration: 600, easing: 'ease-out' },
    },
  },
};

/**
 * Get responsive chart configuration for a specific breakpoint and chart type
 */
export function getResponsiveChartConfig(options: ResponsiveChartOptions): ChartResponsiveConfig {
  const { chartType, breakpoint, customConfig } = options;

  const baseConfig = CHART_CONFIGS[chartType]?.[breakpoint] || CHART_CONFIGS[chartType]?.desktop;

  if (!baseConfig) {
    throw new Error(
      `No configuration found for chart type "${chartType}" and breakpoint "${breakpoint}"`
    );
  }

  return {
    ...baseConfig,
    ...customConfig,
  };
}

/**
 * Apply data density optimization based on current breakpoint
 */
export function optimizeDataForBreakpoint(
  data: any[],
  config: ChartResponsiveConfig,
  aggregation?: 'sum' | 'average' | 'max' | 'min'
): any[] {
  if (!config.dataDensity?.maxPoints || data.length <= config.dataDensity.maxPoints) {
    return data;
  }

  const method = aggregation || config.dataDensity.aggregation || 'average';
  const bucketSize = Math.ceil(data.length / config.dataDensity.maxPoints);
  const buckets: any[][] = [];

  // Group data into buckets
  for (let i = 0; i < data.length; i += bucketSize) {
    buckets.push(data.slice(i, i + bucketSize));
  }

  // Aggregate each bucket
  return buckets.map((bucket) => {
    switch (method) {
      case 'sum':
        return bucket.reduce((acc, item) => {
          const numericValue =
            typeof item === 'number' ? item : parseFloat(item?.value || item?.y || '0');
          return acc + numericValue;
        }, 0);
      case 'max':
        return Math.max(
          ...bucket.map((item) =>
            typeof item === 'number' ? item : parseFloat(item?.value || item?.y || '0')
          )
        );
      case 'min':
        return Math.min(
          ...bucket.map((item) =>
            typeof item === 'number' ? item : parseFloat(item?.value || item?.y || '0')
          )
        );
      case 'average':
      default:
        const sum = bucket.reduce((acc, item) => {
          const numericValue =
            typeof item === 'number' ? item : parseFloat(item?.value || item?.y || '0');
          return acc + numericValue;
        }, 0);
        return sum / bucket.length;
    }
  });
}

/**
 * Get responsive font sizes for chart elements
 */
export function getResponsiveChartFontSizes(breakpoint: string): {
  title: number;
  label: number;
  tick: number;
  legend: number;
} {
  switch (breakpoint) {
    case 'mobile-compact':
      return { title: 14, label: 10, tick: 9, legend: 10 };
    case 'mobile-expanded':
      return { title: 16, label: 11, tick: 10, legend: 11 };
    case 'tablet':
      return { title: 18, label: 12, tick: 11, legend: 12 };
    case 'desktop':
    default:
      return { title: 20, label: 13, tick: 12, legend: 13 };
  }
}
