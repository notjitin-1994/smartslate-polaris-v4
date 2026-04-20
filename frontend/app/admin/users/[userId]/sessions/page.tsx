'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ChevronLeft,
  Clock,
  Monitor,
  Smartphone,
  Tablet,
  Globe,
  Activity,
  FileText,
  Eye,
  MousePointer,
  RefreshCw,
  Filter,
  CheckCircle2,
  XCircle,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { UserSession, SessionStats } from '@/types/session';

interface UserInfo {
  user_id: string;
  email: string;
  full_name: string | null;
}

const DEVICE_ICONS = {
  desktop: Monitor,
  mobile: Smartphone,
  tablet: Tablet,
  unknown: Globe,
};

const DEVICE_COLORS = {
  desktop: 'text-blue-400 bg-blue-500/10',
  mobile: 'text-purple-400 bg-purple-500/10',
  tablet: 'text-cyan-400 bg-cyan-500/10',
  unknown: 'text-gray-400 bg-gray-500/10',
};

export default function UserSessionsPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = use(params);
  const router = useRouter();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [stats, setStats] = useState<SessionStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'ended'>('all');
  const [deviceFilter, setDeviceFilter] = useState<string>('all');

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchSessions = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });

      if (activeFilter !== 'all') {
        params.append('is_active', (activeFilter === 'active').toString());
      }

      if (deviceFilter !== 'all') {
        params.append('device_type', deviceFilter);
      }

      const response = await fetch(`/api/admin/users/${userId}/sessions?${params}`);

      if (!response.ok) {
        throw new Error('Failed to fetch sessions');
      }

      const data = await response.json();
      setUser(data.user);
      setSessions(data.sessions);
      setStats(data.stats);
      setTotalPages(data.pagination.totalPages);
    } catch (err) {
      console.error('Failed to fetch sessions:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch sessions');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [userId, page, activeFilter, deviceFilter]);

  const formatDuration = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86400)
      return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
    return `${Math.floor(seconds / 86400)}d ${Math.floor((seconds % 86400) / 3600)}h`;
  };

  const formatDateTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4 md:p-8">
        <div className="text-center">
          <XCircle className="mx-auto mb-4 h-12 w-12 text-red-400" />
          <h2 className="mb-2 text-xl font-bold text-white">Error Loading Sessions</h2>
          <p className="mb-4 text-white/60">{error}</p>
          <Button onClick={() => fetchSessions()} className="bg-cyan-500 hover:bg-cyan-600">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push(`/admin/users/${userId}`)}
              className="text-white/60 hover:text-white"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-white">User Sessions</h1>
              {user && (
                <p className="text-sm text-white/60">
                  {user.full_name || user.email} • {user.email}
                </p>
              )}
            </div>
          </div>

          <Button
            onClick={() => fetchSessions()}
            disabled={isLoading}
            variant="outline"
            className="border-white/10 bg-white/5 text-white hover:bg-white/10"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="mb-6 grid gap-4 md:grid-cols-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/60">Total Sessions</p>
                  <p className="text-2xl font-bold text-white">{stats.total_sessions}</p>
                </div>
                <div className="rounded-lg bg-cyan-500/20 p-3">
                  <Activity className="h-6 w-6 text-cyan-400" />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/60">Active Sessions</p>
                  <p className="text-2xl font-bold text-white">{stats.active_sessions}</p>
                </div>
                <div className="rounded-lg bg-green-500/20 p-3">
                  <CheckCircle2 className="h-6 w-6 text-green-400" />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/60">Avg Duration</p>
                  <p className="text-2xl font-bold text-white">
                    {formatDuration(stats.average_duration_seconds)}
                  </p>
                </div>
                <div className="rounded-lg bg-blue-500/20 p-3">
                  <Clock className="h-6 w-6 text-blue-400" />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/60">Total Page Views</p>
                  <p className="text-2xl font-bold text-white">{stats.total_page_views}</p>
                </div>
                <div className="rounded-lg bg-purple-500/20 p-3">
                  <Eye className="h-6 w-6 text-purple-400" />
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Filters */}
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-white/60" />
            <span className="text-sm text-white/60">Filters:</span>
          </div>

          {/* Active Status Filter */}
          <div className="flex space-x-2">
            {[
              { value: 'all', label: 'All' },
              { value: 'active', label: 'Active' },
              { value: 'ended', label: 'Ended' },
            ].map((filter) => (
              <button
                key={filter.value}
                onClick={() => {
                  setActiveFilter(filter.value as typeof activeFilter);
                  setPage(1);
                }}
                className={`rounded-lg px-3 py-1.5 text-sm transition-all ${
                  activeFilter === filter.value
                    ? 'bg-cyan-500 text-white'
                    : 'bg-white/5 text-white/60 hover:bg-white/10'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {/* Device Type Filter */}
          <div className="flex space-x-2">
            {[
              { value: 'all', label: 'All Devices' },
              { value: 'desktop', label: 'Desktop' },
              { value: 'mobile', label: 'Mobile' },
              { value: 'tablet', label: 'Tablet' },
            ].map((filter) => (
              <button
                key={filter.value}
                onClick={() => {
                  setDeviceFilter(filter.value);
                  setPage(1);
                }}
                className={`rounded-lg px-3 py-1.5 text-sm transition-all ${
                  deviceFilter === filter.value
                    ? 'bg-cyan-500 text-white'
                    : 'bg-white/5 text-white/60 hover:bg-white/10'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* Sessions List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-white/5 p-12 text-center backdrop-blur-sm">
            <Activity className="mx-auto mb-4 h-12 w-12 text-white/40" />
            <h3 className="mb-2 text-lg font-semibold text-white">No Sessions Found</h3>
            <p className="text-white/60">No sessions match the current filters</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sessions.map((session, index) => {
              const DeviceIcon = DEVICE_ICONS[session.device_type || 'unknown'];
              const deviceColor = DEVICE_COLORS[session.device_type || 'unknown'];

              return (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition-all hover:border-cyan-500/20 hover:bg-white/10"
                >
                  <div className="flex items-start justify-between">
                    {/* Left: Device Info */}
                    <div className="flex items-start space-x-4">
                      <div className={`rounded-lg p-3 ${deviceColor}`}>
                        <DeviceIcon className="h-6 w-6" />
                      </div>

                      <div>
                        <div className="mb-2 flex items-center space-x-3">
                          <h3 className="font-semibold text-white">
                            {session.browser || 'Unknown Browser'} on {session.os || 'Unknown OS'}
                          </h3>
                          {session.is_active ? (
                            <span className="flex items-center space-x-1 rounded-full bg-green-500/20 px-2 py-0.5 text-xs text-green-400">
                              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-400" />
                              <span>Active</span>
                            </span>
                          ) : (
                            <span className="rounded-full bg-gray-500/20 px-2 py-0.5 text-xs text-gray-400">
                              Ended
                            </span>
                          )}
                        </div>

                        <div className="space-y-1 text-sm text-white/60">
                          <p>
                            <strong>Started:</strong> {formatDateTime(session.started_at)}
                          </p>
                          {session.ended_at && (
                            <p>
                              <strong>Ended:</strong> {formatDateTime(session.ended_at)}
                            </p>
                          )}
                          <p>
                            <strong>Duration:</strong> {formatDuration(session.duration_seconds)}
                          </p>
                          {session.ip_address && (
                            <p>
                              <strong>IP:</strong> {session.ip_address}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Activity Metrics */}
                    <div className="flex space-x-6 text-right">
                      <div>
                        <p className="text-2xl font-bold text-white">{session.page_views}</p>
                        <p className="text-xs text-white/60">Page Views</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-white">{session.actions_count}</p>
                        <p className="text-xs text-white/60">Actions</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-white">
                          {session.blueprints_created}
                        </p>
                        <p className="text-xs text-white/60">Blueprints</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <Button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1 || isLoading}
              variant="outline"
              className="border-white/10 bg-white/5 text-white hover:bg-white/10"
            >
              Previous
            </Button>

            <span className="text-sm text-white/60">
              Page {page} of {totalPages}
            </span>

            <Button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || isLoading}
              variant="outline"
              className="border-white/10 bg-white/5 text-white hover:bg-white/10"
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
