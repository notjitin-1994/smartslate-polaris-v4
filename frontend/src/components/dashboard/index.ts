'use client';

import dynamic from 'next/dynamic';

export { DashboardLayout } from './DashboardLayout';
export { KPICards } from './KPICards';

// Dynamic imports for heavy chart components
export const TimelineChart = dynamic(() => import('./TimelineChart').then(mod => mod.TimelineChart), {
  ssr: false,
  loading: () => <div className="h-[300px] w-full animate-pulse rounded-xl bg-white/5" />
});

export const ModuleBreakdownChart = dynamic(() => import('./ModuleBreakdownChart').then(mod => mod.ModuleBreakdownChart), {
  ssr: false,
  loading: () => <div className="h-[300px] w-full animate-pulse rounded-xl bg-white/5" />
});

export const ActivityDistributionChart = dynamic(() => import('./ActivityDistributionChart').then(mod => mod.ActivityDistributionChart), {
  ssr: false,
  loading: () => <div className="h-[300px] w-full animate-pulse rounded-xl bg-white/5" />
});

export { DrillDownProvider, useDrillDown } from './DrillDownProvider';
export { DrillDownView } from './DrillDownView';
export { DashboardFilters } from './DashboardFilters';
export { ExportButton } from './ExportButton';
export { useDashboardStore } from '@/store/dashboardStore';
export { dashboardExportService } from '@/lib/dashboard/exportService';

export type {
  DashboardData,
  DashboardKPIs,
  TimelineData,
  ModuleData,
  ActivityData,
  ResourceData,
} from '@/types/dashboard';
export type { ExportFormat } from '@/lib/dashboard/exportService';
