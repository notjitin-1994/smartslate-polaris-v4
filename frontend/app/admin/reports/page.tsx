'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  useReports,
  useReportStats,
  useGenerateReport,
  useDeleteReport,
  type GenerateReportRequest,
} from '@/lib/hooks/useReports';
import { exportReport } from '@/lib/services/reportExportService';
import {
  BarChart3,
  Download,
  FileText,
  Calendar,
  Clock,
  TrendingUp,
  Users,
  DollarSign,
  Activity,
  Shield,
  Database,
  Zap,
  ChevronLeft,
  ChevronRight,
  Eye,
  Trash2,
  FileSpreadsheet,
  FileJson,
  File,
  CheckCircle,
  AlertCircle,
  Loader2,
  Sparkles,
  Filter,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

/**
 * Admin Reports Page
 * Comprehensive reporting system with report templates, generation, and management
 * Styled to match SmartSlate Polaris v3 brand guidelines
 */

// TypeScript Interfaces
interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  icon: any;
  gradient: string;
  iconColor: string;
  glowColor: string;
  borderGlow: string;
  category: 'analytics' | 'financial' | 'operational' | 'security';
  estimatedTime: string;
}

interface GeneratedReport {
  id: string;
  name: string;
  type: string;
  generatedDate: Date;
  size: string;
  status: 'completed' | 'processing' | 'failed';
  downloadUrl?: string;
}

interface QuickStat {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down';
  icon: any;
  gradient: string;
  iconColor: string;
  glowColor: string;
  borderGlow: string;
}

interface ExportFormat {
  id: string;
  name: string;
  icon: any;
  color: string;
  bgColor: string;
  description: string;
}

// Mock Data
const reportTemplates: ReportTemplate[] = [
  {
    id: 'user-activity',
    name: 'User Activity Report',
    description:
      'Comprehensive analysis of user engagement, login patterns, and feature usage across all tiers',
    icon: Users,
    gradient: 'from-[#a7dadb]/30 via-[#a7dadb]/20 to-transparent',
    iconColor: 'text-[#a7dadb]',
    glowColor: 'shadow-[#a7dadb]/30',
    borderGlow: 'hover:border-[#a7dadb]/40',
    category: 'analytics',
    estimatedTime: '2-3 minutes',
  },
  {
    id: 'cost-analysis',
    name: 'Cost Analysis Report',
    description:
      'Detailed breakdown of API costs, Gemini usage, per-user expenses, and budget forecasting',
    icon: DollarSign,
    gradient: 'from-emerald-400/30 via-emerald-400/20 to-transparent',
    iconColor: 'text-emerald-400',
    glowColor: 'shadow-emerald-400/30',
    borderGlow: 'hover:border-emerald-400/40',
    category: 'financial',
    estimatedTime: '3-4 minutes',
  },
  {
    id: 'system-performance',
    name: 'System Performance Report',
    description:
      'Database health metrics, API response times, uptime statistics, and optimization recommendations',
    icon: Activity,
    gradient: 'from-[#4f46e5]/30 via-[#4f46e5]/20 to-transparent',
    iconColor: 'text-[#4f46e5]',
    glowColor: 'shadow-[#4f46e5]/30',
    borderGlow: 'hover:border-[#4f46e5]/40',
    category: 'operational',
    estimatedTime: '2-3 minutes',
  },
  {
    id: 'blueprint-generation',
    name: 'Blueprint Generation Report',
    description:
      'Analysis of blueprint creation rates, quality metrics, generation times, and user satisfaction',
    icon: FileText,
    gradient: 'from-amber-400/30 via-amber-400/20 to-transparent',
    iconColor: 'text-amber-400',
    glowColor: 'shadow-amber-400/30',
    borderGlow: 'hover:border-amber-400/40',
    category: 'analytics',
    estimatedTime: '3-4 minutes',
  },
  {
    id: 'api-usage',
    name: 'API Usage Report',
    description:
      'Endpoint statistics, rate limiting analysis, error rates, and API health monitoring',
    icon: Zap,
    gradient: 'from-rose-400/30 via-rose-400/20 to-transparent',
    iconColor: 'text-rose-400',
    glowColor: 'shadow-rose-400/30',
    borderGlow: 'hover:border-rose-400/40',
    category: 'operational',
    estimatedTime: '2-3 minutes',
  },
  {
    id: 'security-audit',
    name: 'Security Audit Report',
    description:
      'Access logs, authentication attempts, permission changes, and security incident analysis',
    icon: Shield,
    gradient: 'from-violet-400/30 via-violet-400/20 to-transparent',
    iconColor: 'text-violet-400',
    glowColor: 'shadow-violet-400/30',
    borderGlow: 'hover:border-violet-400/40',
    category: 'security',
    estimatedTime: '4-5 minutes',
  },
];

const mockReports: GeneratedReport[] = [
  {
    id: '1',
    name: 'User Activity Report - November 2025',
    type: 'User Activity',
    generatedDate: new Date('2025-11-09T10:30:00'),
    size: '2.4 MB',
    status: 'completed',
    downloadUrl: '#',
  },
  {
    id: '2',
    name: 'Cost Analysis Report - Q4 2025',
    type: 'Cost Analysis',
    generatedDate: new Date('2025-11-08T15:45:00'),
    size: '1.8 MB',
    status: 'completed',
    downloadUrl: '#',
  },
  {
    id: '3',
    name: 'System Performance Report - Weekly',
    type: 'System Performance',
    generatedDate: new Date('2025-11-07T08:00:00'),
    size: '3.2 MB',
    status: 'completed',
    downloadUrl: '#',
  },
  {
    id: '4',
    name: 'Blueprint Generation Report - October 2025',
    type: 'Blueprint Generation',
    generatedDate: new Date('2025-11-06T14:20:00'),
    size: '1.5 MB',
    status: 'completed',
    downloadUrl: '#',
  },
  {
    id: '5',
    name: 'API Usage Report - Weekly Summary',
    type: 'API Usage',
    generatedDate: new Date('2025-11-05T09:15:00'),
    size: '980 KB',
    status: 'completed',
    downloadUrl: '#',
  },
  {
    id: '6',
    name: 'Security Audit Report - Monthly',
    type: 'Security Audit',
    generatedDate: new Date('2025-11-04T11:30:00'),
    size: '4.1 MB',
    status: 'completed',
    downloadUrl: '#',
  },
  {
    id: '7',
    name: 'User Activity Report - October 2025',
    type: 'User Activity',
    generatedDate: new Date('2025-11-03T16:45:00'),
    size: '2.2 MB',
    status: 'completed',
    downloadUrl: '#',
  },
  {
    id: '8',
    name: 'Cost Analysis Report - October 2025',
    type: 'Cost Analysis',
    generatedDate: new Date('2025-11-02T13:20:00'),
    size: '1.9 MB',
    status: 'completed',
    downloadUrl: '#',
  },
  {
    id: '9',
    name: 'System Performance Report - Monthly',
    type: 'System Performance',
    generatedDate: new Date('2025-11-01T10:00:00'),
    size: '3.5 MB',
    status: 'completed',
    downloadUrl: '#',
  },
  {
    id: '10',
    name: 'Blueprint Generation Report - Q3 2025',
    type: 'Blueprint Generation',
    generatedDate: new Date('2025-10-31T12:30:00'),
    size: '5.2 MB',
    status: 'completed',
    downloadUrl: '#',
  },
  {
    id: '11',
    name: 'API Usage Report - October 2025',
    type: 'API Usage',
    generatedDate: new Date('2025-10-30T09:45:00'),
    size: '1.1 MB',
    status: 'completed',
    downloadUrl: '#',
  },
  {
    id: '12',
    name: 'Security Audit Report - Q3 2025',
    type: 'Security Audit',
    generatedDate: new Date('2025-10-29T14:15:00'),
    size: '4.8 MB',
    status: 'completed',
    downloadUrl: '#',
  },
];

const exportFormats: ExportFormat[] = [
  {
    id: 'pdf',
    name: 'PDF',
    icon: FileText,
    color: 'text-red-400',
    bgColor: 'bg-red-400/10',
    description: 'Portable Document Format',
  },
  {
    id: 'excel',
    name: 'Excel',
    icon: FileSpreadsheet,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-400/10',
    description: 'Microsoft Excel Spreadsheet',
  },
  {
    id: 'csv',
    name: 'CSV',
    icon: File,
    color: 'text-amber-400',
    bgColor: 'bg-amber-400/10',
    description: 'Comma-Separated Values',
  },
  {
    id: 'json',
    name: 'JSON',
    icon: FileJson,
    color: 'text-[#a7dadb]',
    bgColor: 'bg-[#a7dadb]/10',
    description: 'JavaScript Object Notation',
  },
];

export default function AdminReportsPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedDateRange, setSelectedDateRange] = useState('last-30-days');
  const [generatingReportId, setGeneratingReportId] = useState<string | null>(null);
  const [selectedExportFormat, setSelectedExportFormat] = useState<string>('pdf');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('');
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Fetch reports from API
  const {
    reports,
    pagination,
    loading: reportsLoading,
    error: reportsError,
    refetch: refetchReports,
  } = useReports(
    currentPage,
    10,
    selectedTypeFilter || undefined,
    selectedStatusFilter || undefined
  );

  // Fetch report statistics
  const {
    stats,
    loading: statsLoading,
    error: statsError,
    refetch: refetchStats,
  } = useReportStats(30);

  // Report generation hook
  const { generateReport, loading: generating, error: generateError } = useGenerateReport();

  // Report deletion hook
  const { deleteReport, loading: deleting, error: deleteError } = useDeleteReport();

  const reportsPerPage = 10;
  const totalPages = pagination.totalPages;

  // Update last updated time when data changes
  useEffect(() => {
    setLastUpdated(new Date());
  }, [reports, stats]);

  // Calculate quick stats from API data
  const quickStats: QuickStat[] = [
    {
      title: 'Total Reports',
      value: stats?.summary.totalReports.toString() || '0',
      change: stats?.summary.successRate || '0%',
      trend: 'up',
      icon: FileText,
      gradient: 'from-[#a7dadb]/30 via-[#a7dadb]/20 to-transparent',
      iconColor: 'text-[#a7dadb]',
      glowColor: 'shadow-[#a7dadb]/30',
      borderGlow: 'hover:border-[#a7dadb]/40',
    },
    {
      title: 'Completed Reports',
      value: stats?.summary.completedReports.toString() || '0',
      change: `${stats?.summary.failedReports || 0} failed`,
      trend: 'up',
      icon: CheckCircle,
      gradient: 'from-emerald-400/30 via-emerald-400/20 to-transparent',
      iconColor: 'text-emerald-400',
      glowColor: 'shadow-emerald-400/30',
      borderGlow: 'hover:border-emerald-400/40',
    },
    {
      title: 'Processing Reports',
      value: (stats?.summary.processingReports || 0).toString(),
      change: `${stats?.summary.pendingReports || 0} pending`,
      trend: 'up',
      icon: Loader2,
      gradient: 'from-[#4f46e5]/30 via-[#4f46e5]/20 to-transparent',
      iconColor: 'text-[#4f46e5]',
      glowColor: 'shadow-[#4f46e5]/30',
      borderGlow: 'hover:border-[#4f46e5]/40',
    },
    {
      title: 'Avg Generation Time',
      value: stats ? `${(stats.summary.avgGenerationTimeMs / 1000).toFixed(1)}s` : '0s',
      change: stats?.summary.successRate || '0%',
      trend: 'down',
      icon: Clock,
      gradient: 'from-amber-400/30 via-amber-400/20 to-transparent',
      iconColor: 'text-amber-400',
      glowColor: 'shadow-amber-400/30',
      borderGlow: 'hover:border-amber-400/40',
    },
  ];

  const handleGenerateReport = async (templateId: string) => {
    setGeneratingReportId(templateId);

    try {
      // Calculate date range based on selection
      const now = new Date();
      let dateRangeStart: string | undefined;
      let dateRangeEnd: string | undefined;

      if (selectedDateRange !== 'all-time') {
        dateRangeEnd = now.toISOString();

        switch (selectedDateRange) {
          case 'last-7-days':
            dateRangeStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
            break;
          case 'last-30-days':
            dateRangeStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
            break;
          case 'last-90-days':
            dateRangeStart = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();
            break;
          case 'last-year':
            dateRangeStart = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000).toISOString();
            break;
        }
      }

      const template = reportTemplates.find((t) => t.id === templateId);
      const reportName = `${template?.name || 'Report'} - ${new Date().toLocaleDateString()}`;

      const request: GenerateReportRequest = {
        name: reportName,
        type: templateId as any,
        dateRangeStart,
        dateRangeEnd,
        exportFormats: [selectedExportFormat as any],
      };

      const result = await generateReport(request);

      if (result) {
        // Refresh reports list
        await refetchReports();
        await refetchStats();
        alert('Report generated successfully!');
      } else {
        alert('Failed to generate report. Please try again.');
      }
    } catch (error) {
      console.error('Error generating report:', error);
      alert('An error occurred while generating the report.');
    } finally {
      setGeneratingReportId(null);
    }
  };

  const handleExport = async (reportId: string, format: string) => {
    try {
      const report = reports.find((r) => r.id === reportId);
      if (!report) {
        alert('Report not found');
        return;
      }

      const reportData = {
        name: report.name,
        type: report.type,
        generatedAt: report.generated_at || report.created_at,
        dateRange: {
          start: report.date_range_start,
          end: report.date_range_end,
        },
        data: report.data,
      };

      await exportReport(reportData, format as any);
    } catch (error) {
      console.error(`Error exporting report as ${format}:`, error);
      alert(`Failed to export report as ${format}`);
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    if (!confirm('Are you sure you want to delete this report?')) {
      return;
    }

    const success = await deleteReport(reportId);

    if (success) {
      await refetchReports();
      await refetchStats();
      alert('Report deleted successfully');
    } else {
      alert('Failed to delete report');
    }
  };

  const handleRefresh = async () => {
    await refetchReports();
    await refetchStats();
    setLastUpdated(new Date());
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
            <CheckCircle className="h-3.5 w-3.5" />
            <span>Completed</span>
          </div>
        );
      case 'processing':
        return (
          <div className="flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-400">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            <span>Processing</span>
          </div>
        );
      case 'pending':
        return (
          <div className="flex items-center gap-1.5 rounded-full bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-400">
            <Clock className="h-3.5 w-3.5" />
            <span>Pending</span>
          </div>
        );
      case 'failed':
        return (
          <div className="flex items-center gap-1.5 rounded-full bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-400">
            <AlertCircle className="h-3.5 w-3.5" />
            <span>Failed</span>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#020c1b] via-[#0d1b2a] to-[#020c1b] px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="space-y-12">
          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="space-y-6"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[#a7dadb]/20 bg-gradient-to-br from-[#a7dadb]/30 via-[#a7dadb]/20 to-transparent shadow-lg shadow-[#a7dadb]/20">
                <BarChart3 className="h-8 w-8 text-[#a7dadb]" />
              </div>
              <div>
                <h1 className="font-heading text-5xl font-bold tracking-tight text-white sm:text-6xl md:text-7xl">
                  <span>Admin </span>
                  <span className="bg-gradient-to-r from-[#a7dadb] via-[#d0edf0] to-[#a7dadb] bg-clip-text text-transparent">
                    Reports
                  </span>
                </h1>
                <p className="mt-3 text-xl text-[#b0c5c6]">
                  Comprehensive reporting and analytics dashboard
                </p>
              </div>
            </div>

            {/* Decorative line */}
            <div className="h-px w-full bg-gradient-to-r from-transparent via-[#a7dadb]/30 to-transparent" />
          </motion.div>

          {/* Live Update Indicator */}
          <AnimatePresence mode="wait">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-end gap-2 text-sm text-[#b0c5c6]"
            >
              <div className="flex items-center gap-2 rounded-full border border-white/5 bg-[#142433]/60 px-4 py-2 backdrop-blur-sm">
                <div className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#a7dadb]/75 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-[#a7dadb]" />
                </div>
                <Clock className="h-4 w-4" />
                <span className="font-medium">Updated {lastUpdated.toLocaleTimeString()}</span>
                <span className="text-white/40">•</span>
                <span className="text-white/60">Live</span>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Quick Stats */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-6"
          >
            <h2 className="font-heading text-3xl font-bold text-white">Quick Statistics</h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {quickStats.map((stat, index) => {
                const Icon = stat.icon;
                const TrendIcon = stat.trend === 'up' ? TrendingUp : Activity;

                return (
                  <motion.div
                    key={stat.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.5,
                      delay: 0.3 + index * 0.1,
                      ease: [0.4, 0, 0.2, 1],
                    }}
                    className="flex"
                  >
                    <div
                      className={`group relative flex flex-1 flex-col overflow-hidden rounded-xl border border-white/10 bg-[#0d1b2a]/60 p-6 backdrop-blur-xl transition-all duration-300 hover:scale-[1.02] hover:border-white/20 hover:shadow-xl ${stat.glowColor} ${stat.borderGlow}`}
                    >
                      {/* Background gradient glow */}
                      <div
                        className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 transition-opacity duration-500 group-hover:opacity-100`}
                      />

                      {/* Content */}
                      <div className="relative z-10 flex flex-1 flex-col">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 space-y-3">
                            {/* Title */}
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-[#b0c5c6]">{stat.title}</p>
                              <Sparkles
                                className={`h-3 w-3 ${stat.iconColor} opacity-0 transition-opacity duration-300 group-hover:opacity-100`}
                              />
                            </div>

                            {/* Value */}
                            <p className="font-heading text-4xl font-bold tracking-tight text-white">
                              {stat.value}
                            </p>
                          </div>

                          {/* Icon */}
                          <div
                            className={`flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${stat.gradient} transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg ${stat.glowColor}`}
                          >
                            <Icon className={`h-7 w-7 ${stat.iconColor}`} />
                          </div>
                        </div>

                        {/* Spacer */}
                        <div className="flex-1" />

                        {/* Trend */}
                        <div className="mt-3 flex items-center gap-2 text-xs">
                          <div
                            className={`flex items-center gap-1 rounded-full px-2 py-1 font-semibold ${
                              stat.trend === 'up'
                                ? 'bg-emerald-500/10 text-emerald-400'
                                : 'bg-red-500/10 text-red-400'
                            }`}
                          >
                            <TrendIcon className="h-3 w-3" />
                            {stat.change}
                          </div>
                          <span className="text-[#7a8a8b]">from last month</span>
                        </div>
                      </div>

                      {/* Hover shine effect */}
                      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                        <div className="animate-shimmer absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent" />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.section>

          {/* Export Options */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-3xl font-bold text-white">Export Options</h2>
              <button
                onClick={handleRefresh}
                className="group flex items-center gap-2 rounded-xl border border-[#4f46e5]/20 bg-gradient-to-r from-[#4f46e5]/20 to-transparent px-6 py-3 font-semibold text-[#4f46e5] transition-all duration-300 hover:border-[#4f46e5]/40 hover:shadow-lg hover:shadow-[#4f46e5]/20"
              >
                <RefreshCw className="h-5 w-5 transition-transform duration-300 group-hover:rotate-180" />
                <span>Refresh Data</span>
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {exportFormats.map((format, index) => {
                const Icon = format.icon;
                const isSelected = selectedExportFormat === format.id;

                return (
                  <motion.button
                    key={format.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{
                      duration: 0.4,
                      delay: 0.5 + index * 0.05,
                    }}
                    onClick={() => setSelectedExportFormat(format.id)}
                    className={`group relative overflow-hidden rounded-xl border p-4 backdrop-blur-xl transition-all duration-300 hover:scale-[1.02] ${
                      isSelected
                        ? `border-white/30 bg-[#142433]/80 shadow-lg ${format.bgColor}`
                        : 'border-white/10 bg-[#0d1b2a]/60 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-12 w-12 items-center justify-center rounded-xl ${format.bgColor} transition-transform duration-300 group-hover:scale-110`}
                      >
                        <Icon className={`h-6 w-6 ${format.color}`} />
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-white">{format.name}</p>
                        <p className="text-xs text-[#7a8a8b]">{format.description}</p>
                      </div>
                    </div>
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute top-3 right-3"
                      >
                        <CheckCircle className="h-5 w-5 text-emerald-400" />
                      </motion.div>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </motion.section>

          {/* Report Templates */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="space-y-6"
          >
            <h2 className="font-heading text-3xl font-bold text-white">Report Templates</h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {reportTemplates.map((template, index) => {
                const Icon = template.icon;
                const isGenerating = generatingReportId === template.id || generating;

                return (
                  <motion.div
                    key={template.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.5,
                      delay: 0.6 + index * 0.1,
                      ease: [0.4, 0, 0.2, 1],
                    }}
                    className={`group relative overflow-hidden rounded-xl border border-white/10 bg-[#0d1b2a]/60 p-6 backdrop-blur-xl transition-all duration-300 hover:scale-[1.02] hover:border-white/20 hover:shadow-xl ${template.glowColor} ${template.borderGlow}`}
                  >
                    {/* Background gradient glow */}
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${template.gradient} opacity-0 transition-opacity duration-500 group-hover:opacity-100`}
                    />

                    {/* Content */}
                    <div className="relative z-10 space-y-4">
                      <div className="flex items-start justify-between">
                        <div
                          className={`flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br ${template.gradient} transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg ${template.glowColor}`}
                        >
                          <Icon className={`h-7 w-7 ${template.iconColor}`} />
                        </div>
                        <div className="rounded-full border border-white/10 bg-[#142433]/60 px-3 py-1 text-xs text-[#b0c5c6]">
                          {template.estimatedTime}
                        </div>
                      </div>

                      <div>
                        <h3 className="font-heading text-xl font-bold text-white">
                          {template.name}
                        </h3>
                        <p className="mt-2 text-sm leading-relaxed text-[#b0c5c6]">
                          {template.description}
                        </p>
                      </div>

                      <button
                        onClick={() => handleGenerateReport(template.id)}
                        disabled={isGenerating}
                        className={`flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-3 font-semibold transition-all duration-300 ${
                          isGenerating
                            ? 'cursor-not-allowed border-white/10 bg-[#142433]/40 text-[#7a8a8b]'
                            : `border-[#a7dadb]/20 bg-gradient-to-r from-[#a7dadb]/20 to-transparent text-[#a7dadb] hover:border-[#a7dadb]/40 hover:shadow-lg hover:shadow-[#a7dadb]/20`
                        }`}
                      >
                        {isGenerating ? (
                          <>
                            <Loader2 className="h-5 w-5 animate-spin" />
                            <span>Generating...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-5 w-5" />
                            <span>Generate Report</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Hover shine effect */}
                    <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                      <div className="animate-shimmer absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent" />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.section>

          {/* Recent Reports Table */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-3xl font-bold text-white">Recent Reports</h2>
              <div className="flex items-center gap-3">
                <select
                  value={selectedDateRange}
                  onChange={(e) => setSelectedDateRange(e.target.value)}
                  className="rounded-xl border border-white/10 bg-[#0d1b2a]/80 px-4 py-2 text-sm text-white backdrop-blur-xl transition-all duration-300 hover:border-white/20 focus:border-[#a7dadb]/40 focus:ring-2 focus:ring-[#a7dadb]/20 focus:outline-none"
                >
                  <option value="last-7-days">Last 7 Days</option>
                  <option value="last-30-days">Last 30 Days</option>
                  <option value="last-90-days">Last 90 Days</option>
                  <option value="all-time">All Time</option>
                </select>
                <button className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#0d1b2a]/80 px-4 py-2 text-sm text-white backdrop-blur-xl transition-all duration-300 hover:border-white/20 hover:bg-[#142433]/60">
                  <RefreshCw className="h-4 w-4" />
                  <span>Refresh</span>
                </button>
              </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-white/10 bg-[#0d1b2a]/60 backdrop-blur-xl">
              {/* Table Header */}
              <div className="grid grid-cols-12 gap-4 border-b border-white/10 bg-[#142433]/40 px-6 py-4 text-sm font-semibold text-[#b0c5c6]">
                <div className="col-span-4">Report Name</div>
                <div className="col-span-2">Type</div>
                <div className="col-span-2">Generated</div>
                <div className="col-span-1">Size</div>
                <div className="col-span-1">Status</div>
                <div className="col-span-2 text-right">Actions</div>
              </div>

              {/* Table Body with custom scrollbar */}
              <div className="custom-scrollbar max-h-[600px] overflow-y-auto">
                {reportsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-[#a7dadb]" />
                    <span className="ml-3 text-[#b0c5c6]">Loading reports...</span>
                  </div>
                ) : reportsError ? (
                  <div className="flex items-center justify-center py-12">
                    <AlertCircle className="h-8 w-8 text-red-400" />
                    <span className="ml-3 text-red-400">{reportsError}</span>
                  </div>
                ) : reports.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <FileText className="h-12 w-12 text-[#b0c5c6]/50" />
                    <span className="mt-4 text-[#b0c5c6]">No reports found</span>
                    <span className="mt-2 text-sm text-[#b0c5c6]/70">
                      Generate a report to get started
                    </span>
                  </div>
                ) : (
                  reports.map((report, index) => (
                    <motion.div
                      key={report.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{
                        duration: 0.4,
                        delay: 0.8 + index * 0.05,
                      }}
                      className="grid grid-cols-12 gap-4 border-b border-white/5 px-6 py-4 transition-all duration-300 hover:bg-[#142433]/40"
                    >
                      <div className="col-span-4 flex items-center">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#a7dadb]/10">
                            <FileText className="h-5 w-5 text-[#a7dadb]" />
                          </div>
                          <span className="font-medium text-white">{report.name}</span>
                        </div>
                      </div>
                      <div className="col-span-2 flex items-center text-[#b0c5c6]">
                        {report.type
                          .split('-')
                          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                          .join(' ')}
                      </div>
                      <div className="col-span-2 flex items-center text-[#b0c5c6]">
                        {new Date(report.generated_at || report.created_at).toLocaleDateString(
                          'en-US',
                          {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          }
                        )}
                      </div>
                      <div className="col-span-1 flex items-center text-[#b0c5c6]">
                        {report.file_size_bytes
                          ? `${(report.file_size_bytes / 1024 / 1024).toFixed(1)} MB`
                          : 'N/A'}
                      </div>
                      <div className="col-span-1 flex items-center">
                        {getStatusBadge(report.status)}
                      </div>
                      <div className="col-span-2 flex items-center justify-end gap-2">
                        <button
                          className="group flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-[#142433]/40 transition-all duration-300 hover:border-[#a7dadb]/40 hover:bg-[#a7dadb]/10 disabled:cursor-not-allowed disabled:opacity-50"
                          aria-label="View report"
                          disabled={report.status !== 'completed'}
                        >
                          <Eye className="h-4 w-4 text-[#b0c5c6] transition-colors duration-300 group-hover:text-[#a7dadb]" />
                        </button>
                        <button
                          onClick={() => handleExport(report.id, selectedExportFormat)}
                          className="group flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-[#142433]/40 transition-all duration-300 hover:border-emerald-400/40 hover:bg-emerald-400/10 disabled:cursor-not-allowed disabled:opacity-50"
                          aria-label="Download report"
                          disabled={report.status !== 'completed'}
                        >
                          <Download className="h-4 w-4 text-[#b0c5c6] transition-colors duration-300 group-hover:text-emerald-400" />
                        </button>
                        <button
                          onClick={() => handleDeleteReport(report.id)}
                          className="group flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-[#142433]/40 transition-all duration-300 hover:border-red-400/40 hover:bg-red-400/10 disabled:cursor-not-allowed disabled:opacity-50"
                          aria-label="Delete report"
                          disabled={deleting}
                        >
                          <Trash2 className="h-4 w-4 text-[#b0c5c6] transition-colors duration-300 group-hover:text-red-400" />
                        </button>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between border-t border-white/10 bg-[#142433]/40 px-6 py-4">
                <div className="text-sm text-[#b0c5c6]">
                  Showing {(currentPage - 1) * reportsPerPage + 1} to{' '}
                  {Math.min(currentPage * reportsPerPage, pagination.total)} of {pagination.total}{' '}
                  reports
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-[#0d1b2a]/80 text-white transition-all duration-300 hover:border-white/20 hover:bg-[#142433]/60 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-white/10 disabled:hover:bg-[#0d1b2a]/80"
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>

                  {[...Array(totalPages)].map((_, i) => {
                    const pageNum = i + 1;
                    const isCurrentPage = pageNum === currentPage;
                    const showPage =
                      pageNum === 1 ||
                      pageNum === totalPages ||
                      Math.abs(pageNum - currentPage) <= 1;

                    if (!showPage) {
                      if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                        return (
                          <span
                            key={pageNum}
                            className="flex h-9 w-9 items-center justify-center text-[#7a8a8b]"
                          >
                            ...
                          </span>
                        );
                      }
                      return null;
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`flex h-9 w-9 items-center justify-center rounded-lg border font-medium transition-all duration-300 ${
                          isCurrentPage
                            ? 'border-[#a7dadb]/40 bg-[#a7dadb]/20 text-[#a7dadb] shadow-lg shadow-[#a7dadb]/20'
                            : 'border-white/10 bg-[#0d1b2a]/80 text-white hover:border-white/20 hover:bg-[#142433]/60'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}

                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-[#0d1b2a]/80 text-white transition-all duration-300 hover:border-white/20 hover:bg-[#142433]/60 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-white/10 disabled:hover:bg-[#0d1b2a]/80"
                    aria-label="Next page"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          </motion.section>
        </div>
      </div>

      {/* Custom Scrollbar Styles */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(13, 27, 42, 0.4);
          border-radius: 8px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(
            to bottom,
            rgba(167, 218, 219, 0.6),
            rgba(167, 218, 219, 0.3)
          );
          border-radius: 8px;
          border: 2px solid rgba(13, 27, 42, 0.4);
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(
            to bottom,
            rgba(167, 218, 219, 0.8),
            rgba(167, 218, 219, 0.5)
          );
        }

        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }

        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  );
}
