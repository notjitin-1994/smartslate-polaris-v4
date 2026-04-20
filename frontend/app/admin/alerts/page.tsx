'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Bell,
  AlertTriangle,
  CheckCircle2,
  VolumeX,
  Search,
  Filter,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Clock,
  User,
  TrendingUp,
  TrendingDown,
  Sparkles,
  Calendar,
  Eye,
  Check,
  X,
  BellOff,
  Trash2,
  Server,
  Shield,
  Zap,
  DollarSign,
  Database,
  Activity,
  RefreshCw,
  Loader2,
} from 'lucide-react';

// Types
interface Alert {
  id: string;
  name: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  type: 'system' | 'security' | 'performance' | 'cost' | 'database' | 'api';
  status: 'active' | 'acknowledged' | 'resolved' | 'muted';
  triggeredAt: string;
  owner: string;
  affectedResources?: string[];
  timeline?: Array<{
    timestamp: string;
    action: string;
    actor: string;
  }>;
}

interface AlertStats {
  critical: number;
  high: number;
  medium: number;
  low: number;
  active: number;
  resolved: number;
  muted: number;
}

// Severity Config
const severityConfig = {
  critical: {
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/20',
    dot: 'bg-red-500',
    glow: 'shadow-red-500/20',
  },
  high: {
    color: 'text-orange-400',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/20',
    dot: 'bg-orange-500',
    glow: 'shadow-orange-500/20',
  },
  medium: {
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    dot: 'bg-amber-500',
    glow: 'shadow-amber-500/20',
  },
  low: {
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    dot: 'bg-blue-500',
    glow: 'shadow-blue-500/20',
  },
};

const statusConfig = {
  active: { label: 'Active', color: 'bg-red-500/20 text-red-400' },
  acknowledged: {
    label: 'Acknowledged',
    color: 'bg-amber-500/20 text-amber-400',
  },
  resolved: { label: 'Resolved', color: 'bg-emerald-500/20 text-emerald-400' },
  muted: { label: 'Muted', color: 'bg-gray-500/20 text-gray-400' },
};

const typeIcons = {
  system: Server,
  security: Shield,
  performance: Zap,
  cost: DollarSign,
  database: Database,
  api: Activity,
};

export default function AlertsPage() {
  // State
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<AlertStats>({
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    active: 0,
    resolved: 0,
    muted: 0,
  });
  const [total, setTotal] = useState(0);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [selectedAlerts, setSelectedAlerts] = useState<Set<string>>(new Set());

  // Fetch alerts
  const fetchAlerts = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (severityFilter !== 'all') params.append('severity', severityFilter);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (typeFilter !== 'all') params.append('type', typeFilter);
      if (searchQuery) params.append('search', searchQuery);
      params.append('page', currentPage.toString());
      params.append('limit', '10');
      params.append('sortBy', 'triggered_at');
      params.append('order', 'desc');

      const response = await fetch(`/api/admin/alerts?${params}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch alerts');
      }

      const data = await response.json();
      setAlerts(data.alerts || []);
      setStats(
        data.stats || {
          critical: 0,
          high: 0,
          medium: 0,
          low: 0,
          active: 0,
          resolved: 0,
          muted: 0,
        }
      );
      setTotal(data.total || 0);
      setLastUpdated(new Date());
    } catch (err: any) {
      console.error('Error fetching alerts:', err);
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch alert detail
  const fetchAlertDetail = async (alertId: string) => {
    try {
      const response = await fetch(`/api/admin/alerts/${alertId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch alert detail');
      }
      const data = await response.json();
      setSelectedAlert(data.alert);
    } catch (err: any) {
      console.error('Error fetching alert detail:', err);
    }
  };

  // Alert actions
  const handleAcknowledge = async (alertId: string) => {
    try {
      const response = await fetch(`/api/admin/alerts/${alertId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'acknowledge',
          notes: 'Acknowledged from admin dashboard',
        }),
      });
      if (!response.ok) {
        throw new Error('Failed to acknowledge alert');
      }
      fetchAlerts(true);
      if (selectedAlert?.id === alertId) {
        fetchAlertDetail(alertId);
      }
    } catch (err: any) {
      console.error('Error acknowledging alert:', err);
    }
  };

  const handleResolve = async (alertId: string) => {
    try {
      const response = await fetch(`/api/admin/alerts/${alertId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'resolve',
          notes: 'Resolved from admin dashboard',
        }),
      });
      if (!response.ok) {
        throw new Error('Failed to resolve alert');
      }
      fetchAlerts(true);
      if (selectedAlert?.id === alertId) {
        fetchAlertDetail(alertId);
      }
    } catch (err: any) {
      console.error('Error resolving alert:', err);
    }
  };

  const handleMute = async (alertId: string) => {
    try {
      const response = await fetch(`/api/admin/alerts/${alertId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mute' }),
      });
      if (!response.ok) {
        throw new Error('Failed to mute alert');
      }
      fetchAlerts(true);
      if (selectedAlert?.id === alertId) {
        fetchAlertDetail(alertId);
      }
    } catch (err: any) {
      console.error('Error muting alert:', err);
    }
  };

  const handleDelete = async (alertId: string) => {
    if (!confirm('Are you sure you want to delete this alert?')) return;

    try {
      const response = await fetch(`/api/admin/alerts/${alertId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete alert');
      }
      fetchAlerts(true);
      setSelectedAlert(null);
    } catch (err: any) {
      console.error('Error deleting alert:', err);
    }
  };

  const handleBulkAction = async (action: 'acknowledge' | 'resolve' | 'mute') => {
    try {
      const response = await fetch('/api/admin/alerts/bulk-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alertIds: Array.from(selectedAlerts),
          action,
        }),
      });
      if (!response.ok) {
        throw new Error('Bulk action failed');
      }
      fetchAlerts(true);
      setSelectedAlerts(new Set());
    } catch (err: any) {
      console.error('Error performing bulk action:', err);
    }
  };

  // Generate alerts from system data
  const [generating, setGenerating] = useState(false);
  const handleGenerateAlerts = async () => {
    setGenerating(true);
    try {
      const response = await fetch('/api/admin/alerts/generate', {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error('Failed to generate alerts');
      }
      const data = await response.json();
      console.log('Alert generation result:', data);
      // Refresh alerts list
      fetchAlerts(true);
      alert(
        `Successfully generated ${data.total} new alert(s):\n- Cost alerts: ${data.byType.cost}\n- Database alerts: ${data.byType.database}\n- System alerts: ${data.byType.system}`
      );
    } catch (err: any) {
      console.error('Error generating alerts:', err);
      alert('Failed to generate alerts. Check console for details.');
    } finally {
      setGenerating(false);
    }
  };

  // Effects
  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(() => fetchAlerts(true), 30000); // Auto-refresh every 30s
    return () => clearInterval(interval);
  }, [severityFilter, statusFilter, typeFilter, searchQuery, currentPage]);

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  // Select all handler
  const handleSelectAll = () => {
    if (selectedAlerts.size === alerts.length) {
      setSelectedAlerts(new Set());
    } else {
      setSelectedAlerts(new Set(alerts.map((a) => a.id)));
    }
  };

  // Toggle selection
  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedAlerts);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedAlerts(newSelected);
  };

  // Loading skeleton
  if (loading && !refreshing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#020c1b] via-[#0d1b2a] to-[#020c1b]">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex min-h-[400px] items-center justify-center">
            <div className="text-center">
              <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-[#a7dadb]" />
              <p className="text-[#b0c5c6]">Loading alerts...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#020c1b] via-[#0d1b2a] to-[#020c1b]">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex min-h-[400px] items-center justify-center">
            <div className="text-center">
              <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-red-400" />
              <h3 className="mb-2 text-lg font-semibold text-[#e0e0e0]">Failed to load alerts</h3>
              <p className="mb-4 text-[#7a8a8b]">{error}</p>
              <button
                onClick={() => fetchAlerts()}
                className="min-h-[44px] rounded-lg border border-[#a7dadb]/30 bg-[#a7dadb]/20 px-4 py-2 text-[#a7dadb] transition-all hover:bg-[#a7dadb]/30"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Pagination
  const totalPages = Math.ceil(total / 10);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#020c1b] via-[#0d1b2a] to-[#020c1b]">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="mb-4 flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-rose-400/30 to-pink-600/30 backdrop-blur-xl">
              <Bell className="h-8 w-8 text-rose-400" />
            </div>
            <div>
              <h1 className="bg-gradient-to-r from-[#a7dadb] via-[#b0c5c6] to-[#a7dadb] bg-clip-text text-4xl font-bold text-transparent">
                System Alerts
              </h1>
              <div className="mt-1 flex items-center gap-3">
                <p className="text-[#7a8a8b]">
                  Monitor, manage, and respond to system alerts and notifications
                </p>
                {lastUpdated && (
                  <div className="flex items-center gap-2 text-sm text-[#7a8a8b]">
                    <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                    <span>Updated {formatDate(lastUpdated.toISOString())}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-4 flex gap-3">
            <button
              onClick={() => fetchAlerts(true)}
              disabled={refreshing}
              className="flex min-h-[44px] items-center gap-2 rounded-lg border border-[#a7dadb]/20 bg-[#a7dadb]/10 px-4 py-2 text-[#a7dadb] transition-all hover:bg-[#a7dadb]/20 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
            <button
              onClick={handleGenerateAlerts}
              disabled={generating}
              className="flex min-h-[44px] items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-emerald-400 transition-all hover:bg-emerald-500/20 disabled:opacity-50"
            >
              <Zap className={`h-4 w-4 ${generating ? 'animate-pulse' : ''}`} />
              {generating ? 'Generating...' : 'Generate Alerts'}
            </button>
            <button className="min-h-[44px] rounded-lg border border-white/10 bg-[#0d1b2a]/60 px-4 py-2 text-[#b0c5c6] transition-all hover:border-white/20">
              View Alert History
            </button>
          </div>
        </motion.div>

        {/* Summary Cards */}
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[
            {
              icon: AlertTriangle,
              label: 'Critical Alerts',
              value: stats.critical,
              subtitle: `${stats.active} active`,
              color: 'from-red-400/30 to-red-600/30',
              textColor: 'text-red-400',
            },
            {
              icon: Bell,
              label: 'High Priority',
              value: stats.high,
              subtitle: `${stats.active} total active`,
              color: 'from-amber-400/30 to-amber-600/30',
              textColor: 'text-amber-400',
            },
            {
              icon: CheckCircle2,
              label: 'Resolved',
              value: stats.resolved,
              subtitle: 'Successfully handled',
              color: 'from-emerald-400/30 to-emerald-600/30',
              textColor: 'text-emerald-400',
            },
            {
              icon: VolumeX,
              label: 'Muted Alerts',
              value: stats.muted,
              subtitle: 'Temporarily silenced',
              color: 'from-gray-400/30 to-gray-600/30',
              textColor: 'text-gray-400',
            },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="group relative"
            >
              <div className="rounded-xl border border-white/10 bg-[#0d1b2a]/60 p-6 backdrop-blur-xl transition-all duration-300 hover:scale-[1.02] hover:border-white/20 hover:shadow-lg hover:shadow-white/5">
                <Sparkles className="absolute top-3 right-3 h-4 w-4 text-[#a7dadb]/50 opacity-0 transition-opacity group-hover:opacity-100" />

                <div className="flex items-center gap-4">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${stat.color} border border-white/10 backdrop-blur-xl`}
                  >
                    <stat.icon className={`h-6 w-6 ${stat.textColor}`} />
                  </div>
                  <div className="flex-1">
                    <p className="text-2xl font-bold text-[#e0e0e0]">{stat.value}</p>
                    <p className="text-sm text-[#7a8a8b]">{stat.label}</p>
                  </div>
                </div>

                <div className="mt-4">
                  <p className="text-xs text-[#7a8a8b]">{stat.subtitle}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Filters Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-8 rounded-xl border border-white/10 bg-[#0d1b2a]/60 p-6 backdrop-blur-xl"
        >
          <div className="mb-4 flex items-center gap-3">
            <Filter className="h-5 w-5 text-[#a7dadb]" />
            <h3 className="text-lg font-semibold text-[#e0e0e0]">Filter Alerts</h3>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
            {/* Search */}
            <div className="relative lg:col-span-2">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#7a8a8b]" />
              <input
                type="text"
                placeholder="Search alerts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="min-h-[44px] w-full rounded-lg border border-white/10 bg-[#020c1b]/50 py-2 pr-4 pl-10 text-[#e0e0e0] placeholder-[#7a8a8b] focus:border-[#a7dadb]/50 focus:ring-2 focus:ring-[#a7dadb]/20 focus:outline-none"
                aria-label="Search alerts"
              />
            </div>

            {/* Severity Filter */}
            <div className="relative">
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="min-h-[44px] w-full cursor-pointer appearance-none rounded-lg border border-white/10 bg-[#020c1b]/50 px-4 py-2 text-[#e0e0e0] focus:border-[#a7dadb]/50 focus:ring-2 focus:ring-[#a7dadb]/20 focus:outline-none"
                aria-label="Filter by severity"
              >
                <option value="all">All Severities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
              <ChevronDown className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-[#7a8a8b]" />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="min-h-[44px] w-full cursor-pointer appearance-none rounded-lg border border-white/10 bg-[#020c1b]/50 px-4 py-2 text-[#e0e0e0] focus:border-[#a7dadb]/50 focus:ring-2 focus:ring-[#a7dadb]/20 focus:outline-none"
                aria-label="Filter by status"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="acknowledged">Acknowledged</option>
                <option value="resolved">Resolved</option>
                <option value="muted">Muted</option>
              </select>
              <ChevronDown className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-[#7a8a8b]" />
            </div>

            {/* Type Filter */}
            <div className="relative">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="min-h-[44px] w-full cursor-pointer appearance-none rounded-lg border border-white/10 bg-[#020c1b]/50 px-4 py-2 text-[#e0e0e0] focus:border-[#a7dadb]/50 focus:ring-2 focus:ring-[#a7dadb]/20 focus:outline-none"
                aria-label="Filter by type"
              >
                <option value="all">All Types</option>
                <option value="system">System</option>
                <option value="security">Security</option>
                <option value="performance">Performance</option>
                <option value="cost">Cost</option>
                <option value="database">Database</option>
                <option value="api">API</option>
              </select>
              <ChevronDown className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-[#7a8a8b]" />
            </div>
          </div>

          {/* Quick Filter Chips */}
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={() => {
                setSeverityFilter('critical');
                setStatusFilter('active');
              }}
              className="min-h-[36px] rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-sm text-red-400 transition-all hover:bg-red-500/20"
            >
              Critical Unresolved
            </button>
            <button
              onClick={() => {
                setStatusFilter('active');
              }}
              className="min-h-[36px] rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1.5 text-sm text-amber-400 transition-all hover:bg-amber-500/20"
            >
              All Active
            </button>
            <button
              onClick={() => {
                setTypeFilter('security');
                setStatusFilter('active');
              }}
              className="min-h-[36px] rounded-full border border-[#a7dadb]/20 bg-[#a7dadb]/10 px-3 py-1.5 text-sm text-[#a7dadb] transition-all hover:bg-[#a7dadb]/20"
            >
              Security Alerts
            </button>
          </div>

          {/* Results Count */}
          <div className="mt-4 text-sm text-[#7a8a8b]">
            Showing {alerts.length} of {total} alerts
          </div>
        </motion.div>

        {/* Bulk Actions */}
        {selectedAlerts.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 rounded-xl border border-[#a7dadb]/20 bg-[#a7dadb]/5 p-4 backdrop-blur-xl"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#e0e0e0]">
                {selectedAlerts.size} alert(s) selected
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => handleBulkAction('acknowledge')}
                  className="min-h-[40px] rounded-lg border border-amber-500/30 bg-amber-500/20 px-4 py-2 text-sm text-amber-400 transition-all hover:bg-amber-500/30"
                >
                  <Check className="mr-2 inline h-4 w-4" />
                  Acknowledge
                </button>
                <button
                  onClick={() => handleBulkAction('resolve')}
                  className="min-h-[40px] rounded-lg border border-emerald-500/30 bg-emerald-500/20 px-4 py-2 text-sm text-emerald-400 transition-all hover:bg-emerald-500/30"
                >
                  <CheckCircle2 className="mr-2 inline h-4 w-4" />
                  Resolve
                </button>
                <button
                  onClick={() => handleBulkAction('mute')}
                  className="min-h-[40px] rounded-lg border border-gray-500/30 bg-gray-500/20 px-4 py-2 text-sm text-gray-400 transition-all hover:bg-gray-500/30"
                >
                  <BellOff className="mr-2 inline h-4 w-4" />
                  Mute
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Alerts Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="overflow-hidden rounded-xl border border-white/10 bg-[#0d1b2a]/60 backdrop-blur-xl"
        >
          {/* Table Header */}
          <div className="flex items-center justify-between border-b border-white/10 p-4">
            <h3 className="text-lg font-semibold text-[#e0e0e0]">Alert List</h3>
            <div className="flex items-center gap-2 text-sm text-[#7a8a8b]">
              <div className="flex items-center gap-1">
                <div
                  className={`h-2 w-2 rounded-full ${
                    refreshing ? 'bg-amber-400' : 'bg-emerald-400'
                  } animate-pulse`}
                />
                <span>{refreshing ? 'Refreshing...' : 'Live'}</span>
              </div>
              {lastUpdated && (
                <>
                  <span>•</span>
                  <span>Updated {formatDate(lastUpdated.toISOString())}</span>
                </>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedAlerts.size === alerts.length && alerts.length > 0}
                      onChange={handleSelectAll}
                      className="h-5 w-5 cursor-pointer rounded border-white/20 bg-[#020c1b]/50"
                      aria-label="Select all alerts"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-[#7a8a8b] uppercase">
                    Severity
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-[#7a8a8b] uppercase">
                    Alert Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-[#7a8a8b] uppercase">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-[#7a8a8b] uppercase">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-[#7a8a8b] uppercase">
                    Triggered
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-[#7a8a8b] uppercase">
                    Owner
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-[#7a8a8b] uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {alerts.map((alert, index) => {
                  const TypeIcon = typeIcons[alert.type];
                  return (
                    <motion.tr
                      key={alert.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="group cursor-pointer transition-colors hover:bg-white/5"
                      onClick={() => fetchAlertDetail(alert.id)}
                    >
                      <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedAlerts.has(alert.id)}
                          onChange={() => toggleSelection(alert.id)}
                          className="h-5 w-5 cursor-pointer rounded border-white/20 bg-[#020c1b]/50"
                          aria-label={`Select alert ${alert.name}`}
                        />
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <div
                            className={`h-2 w-2 rounded-full ${
                              severityConfig[alert.severity].dot
                            } ${alert.status === 'active' ? 'animate-pulse' : ''}`}
                          />
                          <span
                            className={`text-sm font-medium capitalize ${
                              severityConfig[alert.severity].color
                            }`}
                          >
                            {alert.severity}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div>
                          <p className="text-sm font-medium text-[#e0e0e0] transition-colors group-hover:text-[#a7dadb]">
                            {alert.name}
                          </p>
                          <p className="mt-1 line-clamp-1 text-xs text-[#7a8a8b]">
                            {alert.description}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <TypeIcon className="h-4 w-4 text-[#a7dadb]" />
                          <span className="text-sm text-[#b0c5c6] capitalize">{alert.type}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                            statusConfig[alert.status].color
                          }`}
                        >
                          {statusConfig[alert.status].label}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-[#7a8a8b]" />
                          <span className="text-sm text-[#b0c5c6]">
                            {formatDate(alert.triggeredAt)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-[#7a8a8b]" />
                          <span className="text-sm text-[#b0c5c6]">{alert.owner}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => fetchAlertDetail(alert.id)}
                            className="min-h-[36px] min-w-[36px] rounded-lg p-2 transition-colors hover:bg-white/10"
                            aria-label="View alert details"
                          >
                            <Eye className="h-4 w-4 text-[#a7dadb]" />
                          </button>
                          <button
                            className="min-h-[36px] min-w-[36px] rounded-lg p-2 transition-colors hover:bg-white/10"
                            aria-label="More actions"
                          >
                            <MoreHorizontal className="h-4 w-4 text-[#7a8a8b]" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {alerts.length === 0 && (
            <div className="p-12 text-center">
              <Bell className="mx-auto mb-4 h-12 w-12 text-[#7a8a8b]" />
              <h3 className="mb-2 text-lg font-semibold text-[#e0e0e0]">No alerts found</h3>
              <p className="text-[#7a8a8b]">Try adjusting your filters or search query</p>
            </div>
          )}

          {/* Pagination */}
          {alerts.length > 0 && (
            <div className="flex items-center justify-between border-t border-white/10 p-4">
              <div className="text-sm text-[#7a8a8b]">
                Showing {(currentPage - 1) * 10 + 1} to {Math.min(currentPage * 10, total)} of{' '}
                {total} results
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="min-h-[40px] min-w-[40px] rounded-lg border border-white/10 bg-[#020c1b]/50 p-2 transition-all hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="h-5 w-5 text-[#b0c5c6]" />
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(
                      (page) =>
                        page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1
                    )
                    .map((page, index, arr) => (
                      <div key={page} className="flex items-center gap-1">
                        {index > 0 && arr[index - 1] !== page - 1 && (
                          <span className="px-2 text-[#7a8a8b]">...</span>
                        )}
                        <button
                          onClick={() => setCurrentPage(page)}
                          className={`min-h-[36px] min-w-[36px] rounded-lg px-3 py-1.5 transition-all ${
                            currentPage === page
                              ? 'border border-[#a7dadb]/30 bg-[#a7dadb]/20 text-[#a7dadb]'
                              : 'border border-white/10 bg-[#020c1b]/50 text-[#b0c5c6] hover:bg-white/5'
                          }`}
                        >
                          {page}
                        </button>
                      </div>
                    ))}
                </div>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="min-h-[40px] min-w-[40px] rounded-lg border border-white/10 bg-[#020c1b]/50 p-2 transition-all hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label="Next page"
                >
                  <ChevronRight className="h-5 w-5 text-[#b0c5c6]" />
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Alert Detail Modal */}
      {selectedAlert && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => setSelectedAlert(null)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-2xl border border-white/10 bg-[#0d1b2a]/95 backdrop-blur-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="border-b border-white/10 p-6">
              <div className="flex items-start justify-between">
                <div className="flex flex-1 items-start gap-4">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                      severityConfig[selectedAlert.severity].bg
                    } border ${severityConfig[selectedAlert.severity].border}`}
                  >
                    <AlertTriangle
                      className={`h-6 w-6 ${severityConfig[selectedAlert.severity].color}`}
                    />
                  </div>
                  <div className="flex-1">
                    <div className="mb-2 flex items-center gap-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-medium capitalize ${
                          severityConfig[selectedAlert.severity].bg
                        } ${severityConfig[selectedAlert.severity].color}`}
                      >
                        {selectedAlert.severity}
                      </span>
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                          statusConfig[selectedAlert.status].color
                        }`}
                      >
                        {statusConfig[selectedAlert.status].label}
                      </span>
                    </div>
                    <h2 className="mb-2 text-xl font-semibold text-[#e0e0e0]">
                      {selectedAlert.name}
                    </h2>
                    <p className="mb-3 text-sm text-[#7a8a8b]">{selectedAlert.description}</p>
                    <div className="flex items-center gap-4 text-sm text-[#7a8a8b]">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>{formatDate(selectedAlert.triggeredAt)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span>{selectedAlert.owner}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedAlert(null)}
                  className="min-h-[40px] min-w-[40px] rounded-lg p-2 transition-colors hover:bg-white/10"
                  aria-label="Close modal"
                >
                  <X className="h-5 w-5 text-[#7a8a8b]" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="max-h-[calc(90vh-200px)] overflow-y-auto p-6">
              {/* Affected Resources */}
              {selectedAlert.affectedResources && selectedAlert.affectedResources.length > 0 && (
                <div className="mb-6">
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#e0e0e0]">
                    <Server className="h-4 w-4 text-[#a7dadb]" />
                    Affected Resources
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedAlert.affectedResources.map((resource) => (
                      <span
                        key={resource}
                        className="rounded-lg border border-white/10 bg-[#020c1b]/50 px-3 py-1.5 text-sm text-[#b0c5c6]"
                      >
                        {resource}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Timeline */}
              {selectedAlert.timeline && selectedAlert.timeline.length > 0 && (
                <div className="mb-6">
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#e0e0e0]">
                    <Calendar className="h-4 w-4 text-[#a7dadb]" />
                    Timeline
                  </h3>
                  <div className="space-y-3">
                    {selectedAlert.timeline.map((event, index) => (
                      <div key={index} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className="h-2 w-2 rounded-full bg-[#a7dadb]" />
                          {index < selectedAlert.timeline!.length - 1 && (
                            <div className="my-1 w-px flex-1 bg-white/10" />
                          )}
                        </div>
                        <div className="flex-1 pb-4">
                          <p className="mb-1 text-sm text-[#e0e0e0]">{event.action}</p>
                          <div className="flex items-center gap-3 text-xs text-[#7a8a8b]">
                            <span>{formatDate(event.timestamp)}</span>
                            <span>•</span>
                            <span>{event.actor}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between gap-3 border-t border-white/10 p-6">
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#7a8a8b]">Alert ID: {selectedAlert.id}</span>
              </div>
              <div className="flex items-center gap-2">
                {selectedAlert.status === 'active' && (
                  <button
                    onClick={() => handleAcknowledge(selectedAlert.id)}
                    className="min-h-[40px] rounded-lg border border-amber-500/30 bg-amber-500/20 px-4 py-2 text-sm text-amber-400 transition-all hover:bg-amber-500/30"
                  >
                    <Check className="mr-2 inline h-4 w-4" />
                    Acknowledge
                  </button>
                )}
                {selectedAlert.status !== 'resolved' && (
                  <button
                    onClick={() => handleResolve(selectedAlert.id)}
                    className="min-h-[40px] rounded-lg border border-emerald-500/30 bg-emerald-500/20 px-4 py-2 text-sm text-emerald-400 transition-all hover:bg-emerald-500/30"
                  >
                    <CheckCircle2 className="mr-2 inline h-4 w-4" />
                    Resolve
                  </button>
                )}
                <button
                  onClick={() => handleMute(selectedAlert.id)}
                  className="min-h-[40px] rounded-lg border border-gray-500/30 bg-gray-500/20 px-4 py-2 text-sm text-gray-400 transition-all hover:bg-gray-500/30"
                >
                  <BellOff className="mr-2 inline h-4 w-4" />
                  Mute
                </button>
                <button
                  onClick={() => handleDelete(selectedAlert.id)}
                  className="min-h-[40px] rounded-lg border border-red-500/30 bg-red-500/20 px-4 py-2 text-sm text-red-400 transition-all hover:bg-red-500/30"
                >
                  <Trash2 className="mr-2 inline h-4 w-4" />
                  Delete
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
