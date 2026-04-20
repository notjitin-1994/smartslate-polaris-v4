'use client';

export const dynamic = 'force-dynamic';
import { Suspense, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  FileText,
  Activity,
  TrendingUp,
  Shield,
  DollarSign,
  Database,
  AlertCircle,
  Clock,
  BarChart3,
  Bell,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Zap,
  ChevronRight,
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { useAuth } from '@/contexts/AuthContext';
import {
  SystemStatusDetailModal,
  SystemStatusDetails,
} from '@/components/admin/SystemStatusDetailModal';

/**
 * Admin Dashboard Overview Page
 * Displays system-wide metrics, user statistics, and quick actions
 * Styled to match Smartslate Polaris v3 brand guidelines
 */

interface SystemMetrics {
  totalUsers: number;
  totalUsersChange: number;
  totalUsersTrend: 'up' | 'down';
  userBreakdown?: {
    active: number;
    dormant: number;
    neverLoggedIn: number;
  };
  activeUsers: number;
  activeUsersChange: number;
  activeUsersTrend: 'up' | 'down';
  totalBlueprints: number;
  totalBlueprintsChange: number;
  totalBlueprintsTrend: 'up' | 'down';
  blueprintsToday: number;
  blueprintsTodayChange: number;
  blueprintsTodayTrend: 'up' | 'down';
  _metadata?: {
    calculatedAt: string;
    periods: Record<string, string>;
  };
}

function SystemMetricsContent() {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    async function fetchMetrics() {
      try {
        const response = await fetch('/api/admin/metrics', {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
          },
        });
        if (response.ok) {
          const data = await response.json();
          setMetrics(data);
          setLastUpdated(new Date());
        }
      } catch (error) {
        console.error('Failed to fetch metrics:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <LoadingSkeleton />;
  }

  const stats = [
    {
      title: 'Total Users',
      value: metrics?.totalUsers.toLocaleString() || '0',
      change: `${(metrics?.totalUsersChange ?? 0) >= 0 ? '+' : ''}${(metrics?.totalUsersChange ?? 0).toFixed(1)}%`,
      trend: metrics?.totalUsersTrend || 'up',
      icon: Users,
      gradient: 'from-[#a7dadb]/30 via-[#a7dadb]/20 to-transparent',
      iconColor: 'text-[#a7dadb]',
      glowColor: 'shadow-[#a7dadb]/30',
      borderGlow: 'group-hover:border-[#a7dadb]/40',
      bgGlow: 'bg-[#a7dadb]/5',
    },
    {
      title: 'Active Users (30d)',
      value: metrics?.activeUsers.toLocaleString() || '0',
      change: `${(metrics?.activeUsersChange ?? 0) >= 0 ? '+' : ''}${(metrics?.activeUsersChange ?? 0).toFixed(1)}%`,
      trend: metrics?.activeUsersTrend || 'up',
      icon: Activity,
      gradient: 'from-emerald-400/30 via-emerald-400/20 to-transparent',
      iconColor: 'text-emerald-400',
      glowColor: 'shadow-emerald-400/30',
      borderGlow: 'group-hover:border-emerald-400/40',
      bgGlow: 'bg-emerald-400/5',
    },
    {
      title: 'Total Blueprints',
      value: metrics?.totalBlueprints.toLocaleString() || '0',
      change: `${(metrics?.totalBlueprintsChange ?? 0) >= 0 ? '+' : ''}${(metrics?.totalBlueprintsChange ?? 0).toFixed(1)}%`,
      trend: metrics?.totalBlueprintsTrend || 'up',
      icon: FileText,
      gradient: 'from-[#4f46e5]/30 via-[#4f46e5]/20 to-transparent',
      iconColor: 'text-[#4f46e5]',
      glowColor: 'shadow-[#4f46e5]/30',
      borderGlow: 'group-hover:border-[#4f46e5]/40',
      bgGlow: 'bg-[#4f46e5]/5',
    },
    {
      title: 'Blueprints Today',
      value: metrics?.blueprintsToday.toLocaleString() || '0',
      change: `${(metrics?.blueprintsTodayChange ?? 0) >= 0 ? '+' : ''}${(metrics?.blueprintsTodayChange ?? 0).toFixed(1)}%`,
      trend: metrics?.blueprintsTodayTrend || 'up',
      icon: TrendingUp,
      gradient: 'from-amber-400/30 via-amber-400/20 to-transparent',
      iconColor: 'text-amber-400',
      glowColor: 'shadow-amber-400/30',
      borderGlow: 'group-hover:border-amber-400/40',
      bgGlow: 'bg-amber-400/5',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Last Updated Indicator */}
      <AnimatePresence mode="wait">
        {lastUpdated && (
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
              <span className="text-white/60">Auto-refresh 30s</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          const isTotalUsersCard = stat.title === 'Total Users';
          const TrendIcon = stat.trend === 'up' ? ArrowUpRight : ArrowDownRight;

          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.5,
                delay: index * 0.1,
                ease: [0.4, 0, 0.2, 1],
              }}
              className="flex"
            >
              <div
                className={`group relative flex flex-1 flex-col overflow-hidden rounded-xl border border-white/10 bg-[#0d1b2a]/60 p-4 backdrop-blur-xl transition-all duration-300 hover:scale-[1.02] hover:border-white/20 hover:shadow-xl sm:p-6 ${stat.glowColor} ${stat.borderGlow}`}
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
                      <p className="font-heading text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-4xl">
                        {stat.value}
                      </p>
                    </div>

                    {/* Icon */}
                    <div
                      className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br sm:h-12 sm:w-12 sm:rounded-xl ${stat.gradient} ${stat.bgGlow} transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg ${stat.glowColor}`}
                    >
                      <Icon className={`h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7 ${stat.iconColor}`} />
                    </div>
                  </div>

                  {/* Spacer to push content to bottom */}
                  <div className="flex-1" />

                  {/* User Breakdown for Total Users */}
                  {isTotalUsersCard && metrics?.userBreakdown && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      transition={{ delay: 0.3 }}
                      className="mt-3 space-y-2 border-t border-white/10 pt-3"
                    >
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="rounded-lg bg-emerald-500/10 p-2 text-center">
                          <p className="font-bold text-emerald-400">
                            {metrics.userBreakdown.active}
                          </p>
                          <p className="text-emerald-400/60">Active</p>
                        </div>
                        <div className="rounded-lg bg-orange-500/10 p-2 text-center">
                          <p className="font-bold text-orange-400">
                            {metrics.userBreakdown.dormant}
                          </p>
                          <p className="text-orange-400/60">Dormant</p>
                        </div>
                        <div className="rounded-lg bg-yellow-500/10 p-2 text-center">
                          <p className="font-bold text-yellow-400">
                            {metrics.userBreakdown.neverLoggedIn}
                          </p>
                          <p className="text-yellow-400/60">New</p>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Trend - Always at bottom */}
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
                    <span className="text-[#7a8a8b]">
                      {stat.title === 'Blueprints Today' ? 'vs yesterday' : 'from last period'}
                    </span>
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
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="rounded-xl border border-white/10 bg-[#0d1b2a]/60 p-6 backdrop-blur-xl"
        >
          <div className="animate-pulse space-y-3">
            <div className="h-4 w-28 rounded-lg bg-white/10" />
            <div className="h-10 w-20 rounded-lg bg-white/15" />
            <div className="h-3 w-36 rounded-lg bg-white/10" />
          </div>
        </div>
      ))}
    </div>
  );
}

interface ServiceStatus {
  name: string;
  status: string;
  color: string;
  responseTime?: number;
  lastChecked: string;
  details?: string;
}

interface SystemStatusResponse {
  services: ServiceStatus[];
  summary: {
    overallStatus: string;
    operational: number;
    degraded: number;
    partialOutage: number;
    majorOutage: number;
    total: number;
  };
  timestamp: string;
}

function ServiceStatusCard({
  service,
  index,
  getStatusColor,
}: {
  service: ServiceStatus;
  index: number;
  getStatusColor: (status: string) => string;
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [detailedStatus, setDetailedStatus] = useState<SystemStatusDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const getComponentSlug = (name: string) => {
    const slugMap: Record<string, string> = {
      'API Services': 'api',
      Database: 'database',
      'AI Services': 'ai',
      Storage: 'storage',
      'Payment Gateway': 'payment',
    };
    return slugMap[name] || name.toLowerCase().replace(/\s+/g, '-');
  };

  const fetchDetailedStatus = async () => {
    setIsLoading(true);
    try {
      const slug = getComponentSlug(service.name);
      const response = await fetch(`/api/admin/system-status/${slug}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' },
      });

      if (response.ok) {
        const data = await response.json();
        setDetailedStatus(data);
        setIsModalOpen(true);
      }
    } catch (error) {
      console.error('Failed to fetch detailed status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = async () => {
    await fetchDetailedStatus();
  };

  return (
    <>
      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, delay: index * 0.05 }}
        onClick={fetchDetailedStatus}
        disabled={isLoading}
        className="group w-full rounded-lg border border-white/5 bg-[#142433]/40 p-4 text-left transition-all duration-300 hover:border-white/10 hover:bg-[#142433]/60 hover:shadow-lg focus:ring-2 focus:ring-[#a7dadb]/50 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
      >
        <div className="flex items-center justify-between">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div
              className={`h-3 w-3 flex-shrink-0 rounded-full ${getStatusColor(service.status)} transition-all duration-300 group-hover:scale-125`}
            />
            <span className="truncate font-medium text-white">{service.name}</span>
            {service.details && (
              <span className="hidden truncate text-xs text-[#7a8a8b] lg:block">
                {service.details}
              </span>
            )}
          </div>
          <div className="flex flex-shrink-0 items-center gap-4">
            {service.responseTime !== undefined && (
              <span className="rounded-full bg-[#a7dadb]/10 px-3 py-1 text-xs font-medium text-[#a7dadb]">
                {service.responseTime}ms
              </span>
            )}
            <span className="min-w-[100px] text-right text-sm font-medium text-[#b0c5c6]">
              {service.status}
            </span>
            <ChevronRight className="h-4 w-4 text-[#a7dadb] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          </div>
        </div>
      </motion.button>

      {detailedStatus && (
        <SystemStatusDetailModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          statusData={detailedStatus}
          onRetry={handleRetry}
        />
      )}
    </>
  );
}

function SystemStatusContent() {
  const [statusData, setStatusData] = useState<SystemStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    async function fetchSystemStatus() {
      try {
        const response = await fetch('/api/admin/system-status', {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch system status: ${response.status}`);
        }

        const data = await response.json();
        setStatusData(data);
        setLastUpdated(new Date());
        setError(null);
      } catch (err) {
        console.error('Failed to fetch system status:', err);
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    }

    fetchSystemStatus();
    const interval = setInterval(fetchSystemStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <SystemStatusSkeleton />;
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h2 className="font-heading text-3xl font-bold text-white">System Status</h2>
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-6 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/10">
              <AlertCircle className="h-6 w-6 text-red-400" />
            </div>
            <div>
              <p className="font-semibold text-red-400">Status Unavailable</p>
              <p className="text-sm text-red-400/70">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'operational':
        return 'bg-emerald-400 shadow-emerald-400/50';
      case 'degraded':
        return 'bg-yellow-400 shadow-yellow-400/50';
      case 'partial outage':
        return 'bg-orange-400 shadow-orange-400/50';
      case 'major outage':
        return 'bg-red-400 shadow-red-400/50';
      default:
        return 'bg-gray-400 shadow-gray-400/50';
    }
  };

  const getOverallStatusDisplay = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower.includes('operational')) {
      return {
        text: 'All Systems Operational',
        color: 'text-emerald-400',
        bgColor: 'bg-emerald-500/10',
        borderColor: 'border-emerald-500/20',
        icon: Zap,
      };
    }
    return {
      text: status,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/10',
      borderColor: 'border-yellow-500/20',
      icon: AlertCircle,
    };
  };

  const overallDisplay = getOverallStatusDisplay(statusData?.summary.overallStatus || '');
  const StatusIcon = overallDisplay.icon;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="font-heading text-2xl font-bold text-white sm:text-3xl">System Status</h2>
        {lastUpdated && (
          <div className="flex items-center gap-2 rounded-full border border-white/5 bg-[#142433]/60 px-4 py-2 text-sm text-[#b0c5c6] backdrop-blur-sm">
            <div className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#a7dadb]/75 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#a7dadb]" />
            </div>
            <Clock className="h-4 w-4" />
            <span className="font-medium">{lastUpdated.toLocaleTimeString()}</span>
          </div>
        )}
      </div>

      {statusData && (
        <div className="space-y-4">
          {/* Overall Status Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className={`rounded-xl border ${overallDisplay.borderColor} ${overallDisplay.bgColor} p-6 backdrop-blur-xl`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div
                  className={`flex h-14 w-14 items-center justify-center rounded-xl ${overallDisplay.bgColor} border ${overallDisplay.borderColor}`}
                >
                  <StatusIcon className={`h-7 w-7 ${overallDisplay.color}`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-[#b0c5c6]">System Health</p>
                  <p className={`font-heading text-2xl font-bold ${overallDisplay.color}`}>
                    {overallDisplay.text}
                  </p>
                </div>
              </div>

              <div className="flex gap-6">
                {statusData.summary.operational > 0 && (
                  <div className="text-center">
                    <p className="font-heading text-3xl font-bold text-emerald-400">
                      {statusData.summary.operational}
                    </p>
                    <p className="text-xs text-[#b0c5c6]">Operational</p>
                  </div>
                )}
                {statusData.summary.degraded > 0 && (
                  <div className="text-center">
                    <p className="font-heading text-3xl font-bold text-yellow-400">
                      {statusData.summary.degraded}
                    </p>
                    <p className="text-xs text-[#b0c5c6]">Degraded</p>
                  </div>
                )}
                {statusData.summary.partialOutage > 0 && (
                  <div className="text-center">
                    <p className="font-heading text-3xl font-bold text-orange-400">
                      {statusData.summary.partialOutage}
                    </p>
                    <p className="text-xs text-[#b0c5c6]">Partial</p>
                  </div>
                )}
                {statusData.summary.majorOutage > 0 && (
                  <div className="text-center">
                    <p className="font-heading text-3xl font-bold text-red-400">
                      {statusData.summary.majorOutage}
                    </p>
                    <p className="text-xs text-[#b0c5c6]">Outage</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Individual Services */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="rounded-xl border border-white/10 bg-[#0d1b2a]/60 p-6 backdrop-blur-xl"
          >
            <div className="space-y-4">
              {statusData.services.map((service, index) => (
                <ServiceStatusCard
                  key={service.name}
                  service={service}
                  index={index}
                  getStatusColor={getStatusColor}
                />
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function SystemStatusSkeleton() {
  return (
    <div className="space-y-6">
      <h2 className="font-heading text-3xl font-bold text-white">System Status</h2>
      <div className="space-y-4">
        <div className="rounded-xl border border-white/10 bg-[#0d1b2a]/60 p-6 backdrop-blur-xl">
          <div className="animate-pulse space-y-4">
            <div className="h-20 rounded-lg bg-white/10" />
          </div>
        </div>
        <div className="rounded-xl border border-white/10 bg-[#0d1b2a]/60 p-6 backdrop-blur-xl">
          <div className="animate-pulse space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 rounded-lg bg-white/10" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const { user } = useAuth();

  const quickActions = [
    {
      title: 'User Management',
      description: 'View, edit, and manage user accounts and permissions',
      icon: Users,
      href: '/admin/users',
      gradient: 'from-[#a7dadb]/30 via-[#a7dadb]/20 to-transparent',
      iconColor: 'text-[#a7dadb]',
      glowColor: 'hover:shadow-[#a7dadb]/30',
      borderGlow: 'hover:border-[#a7dadb]/40',
    },
    {
      title: 'Cost Monitoring',
      description: 'Track API costs, usage patterns, and budget alerts',
      icon: DollarSign,
      href: '/admin/costs',
      gradient: 'from-emerald-400/30 via-emerald-400/20 to-transparent',
      iconColor: 'text-emerald-400',
      glowColor: 'hover:shadow-emerald-400/30',
      borderGlow: 'hover:border-emerald-400/40',
    },
    {
      title: 'Database Health',
      description: 'Monitor database performance and optimization',
      icon: Database,
      href: '/admin/database',
      gradient: 'from-[#4f46e5]/30 via-[#4f46e5]/20 to-transparent',
      iconColor: 'text-[#4f46e5]',
      glowColor: 'hover:shadow-[#4f46e5]/30',
      borderGlow: 'hover:border-[#4f46e5]/40',
    },
    {
      title: 'Reports',
      description: 'Generate and download system reports',
      icon: BarChart3,
      href: '/admin/reports',
      gradient: 'from-amber-400/30 via-amber-400/20 to-transparent',
      iconColor: 'text-amber-400',
      glowColor: 'hover:shadow-amber-400/30',
      borderGlow: 'hover:border-amber-400/40',
    },
    {
      title: 'System Alerts',
      description: 'View and configure system alerts and notifications',
      icon: Bell,
      href: '/admin/alerts',
      gradient: 'from-rose-400/30 via-rose-400/20 to-transparent',
      iconColor: 'text-rose-400',
      glowColor: 'hover:shadow-rose-400/30',
      borderGlow: 'hover:border-rose-400/40',
    },
    {
      title: 'Activity Logs',
      description: 'Review system activity and audit logs',
      icon: Clock,
      href: '/admin/logs',
      gradient: 'from-violet-400/30 via-violet-400/20 to-transparent',
      iconColor: 'text-violet-400',
      glowColor: 'hover:shadow-violet-400/30',
      borderGlow: 'hover:border-violet-400/40',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#020c1b] via-[#0d1b2a] to-[#020c1b] px-3 py-6 sm:px-6 sm:py-12 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="space-y-6 sm:space-y-12">
          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="space-y-4 sm:space-y-6"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#a7dadb]/20 bg-gradient-to-br from-[#a7dadb]/30 via-[#a7dadb]/20 to-transparent shadow-lg shadow-[#a7dadb]/20 sm:h-16 sm:w-16 sm:rounded-2xl">
                <Shield className="h-6 w-6 text-[#a7dadb] sm:h-8 sm:w-8" />
              </div>
              <div className="flex-1">
                <h1 className="font-heading text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl">
                  <span>Admin </span>
                  <span className="bg-gradient-to-r from-[#a7dadb] via-[#d0edf0] to-[#a7dadb] bg-clip-text text-transparent">
                    Control Center
                  </span>
                </h1>
                <p className="mt-2 text-base text-[#b0c5c6] sm:mt-3 sm:text-lg md:text-xl">
                  Monitor, manage, and optimize your Smartslate Polaris platform
                </p>
              </div>
            </div>

            {/* Decorative line */}
            <div className="h-px w-full bg-gradient-to-r from-transparent via-[#a7dadb]/30 to-transparent" />
          </motion.div>

          {/* System Metrics */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Suspense fallback={<LoadingSkeleton />}>
              <SystemMetricsContent />
            </Suspense>
          </motion.section>

          {/* Quick Actions Grid */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="space-y-6"
          >
            <h2 className="font-heading text-2xl font-bold text-white sm:text-3xl">
              Quick Actions
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
              {quickActions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <motion.a
                    key={action.title}
                    href={action.href}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.5,
                      delay: 0.5 + index * 0.05,
                      ease: [0.4, 0, 0.2, 1],
                    }}
                    className={`group relative min-h-[120px] overflow-hidden rounded-xl border border-white/10 bg-[#0d1b2a]/60 p-4 backdrop-blur-xl transition-all duration-300 hover:scale-[1.02] hover:border-white/20 hover:shadow-xl sm:min-h-[140px] sm:p-6 ${action.glowColor} ${action.borderGlow}`}
                  >
                    {/* Background gradient glow */}
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${action.gradient} opacity-0 transition-opacity duration-500 group-hover:opacity-100`}
                    />

                    {/* Content */}
                    <div className="relative z-10 flex h-full flex-col justify-between">
                      <div className="flex items-start gap-3 sm:gap-4">
                        <div
                          className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br sm:h-12 sm:w-12 sm:rounded-xl ${action.gradient} transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg ${action.glowColor}`}
                        >
                          <Icon className={`h-5 w-5 sm:h-6 sm:w-6 ${action.iconColor}`} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-heading text-base font-semibold text-white sm:text-lg">
                            {action.title}
                          </h3>
                          <p className="mt-1 text-xs text-[#b0c5c6] sm:mt-2 sm:text-sm">
                            {action.description}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-end opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                        <ArrowUpRight className={`h-5 w-5 ${action.iconColor}`} />
                      </div>
                    </div>

                    {/* Hover shine effect */}
                    <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                      <div className="animate-shimmer absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent" />
                    </div>
                  </motion.a>
                );
              })}
            </div>
          </motion.section>

          {/* System Status */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <Suspense fallback={<SystemStatusSkeleton />}>
              <SystemStatusContent />
            </Suspense>
          </motion.section>
        </div>
      </div>
    </div>
  );
}
