'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Activity,
  FileText,
  LogIn,
  UserCog,
  Clock,
  Filter,
  Search,
  Download,
  RefreshCw,
  Calendar,
  TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

interface Activity {
  id: string;
  action_type: string;
  resource_type: string | null;
  resource_id: string | null;
  metadata: Record<string, any>;
  actor_id: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  actor?: {
    email: string;
    full_name: string | null;
  };
}

interface UserInfo {
  user_id: string;
  email: string;
  full_name: string | null;
}

interface ActivityData {
  user: UserInfo;
  activities: Activity[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const ACTIVITY_ICONS: Record<string, any> = {
  user_created: UserCog,
  user_updated: UserCog,
  user_deleted: UserCog,
  user_role_changed: UserCog,
  user_tier_changed: UserCog,
  user_limits_updated: UserCog,
  bulk_role_update: UserCog,
  bulk_tier_update: UserCog,
  bulk_delete: UserCog,
  user_login: LogIn,
  user_logout: LogIn,
  user_password_reset: UserCog,
  user_email_changed: UserCog,
  data_export: Download,
  system_config_change: Activity,
  blueprint_created: FileText,
  blueprint_deleted: FileText,
  blueprint_shared: FileText,
  default: Activity,
};

const ACTIVITY_COLORS: Record<string, { bg: string; text: string; icon: string }> = {
  user_created: {
    bg: 'bg-green-500/10',
    text: 'text-green-400',
    icon: 'text-green-400',
  },
  user_updated: {
    bg: 'bg-blue-500/10',
    text: 'text-blue-400',
    icon: 'text-blue-400',
  },
  user_deleted: {
    bg: 'bg-red-500/10',
    text: 'text-red-400',
    icon: 'text-red-400',
  },
  user_role_changed: {
    bg: 'bg-purple-500/10',
    text: 'text-purple-400',
    icon: 'text-purple-400',
  },
  user_tier_changed: {
    bg: 'bg-purple-500/10',
    text: 'text-purple-400',
    icon: 'text-purple-400',
  },
  user_limits_updated: {
    bg: 'bg-blue-500/10',
    text: 'text-blue-400',
    icon: 'text-blue-400',
  },
  bulk_role_update: {
    bg: 'bg-purple-500/10',
    text: 'text-purple-400',
    icon: 'text-purple-400',
  },
  bulk_tier_update: {
    bg: 'bg-purple-500/10',
    text: 'text-purple-400',
    icon: 'text-purple-400',
  },
  bulk_delete: {
    bg: 'bg-red-500/10',
    text: 'text-red-400',
    icon: 'text-red-400',
  },
  user_login: {
    bg: 'bg-green-500/10',
    text: 'text-green-400',
    icon: 'text-green-400',
  },
  user_logout: {
    bg: 'bg-yellow-500/10',
    text: 'text-yellow-400',
    icon: 'text-yellow-400',
  },
  user_password_reset: {
    bg: 'bg-orange-500/10',
    text: 'text-orange-400',
    icon: 'text-orange-400',
  },
  user_email_changed: {
    bg: 'bg-blue-500/10',
    text: 'text-blue-400',
    icon: 'text-blue-400',
  },
  data_export: {
    bg: 'bg-cyan-500/10',
    text: 'text-cyan-400',
    icon: 'text-cyan-400',
  },
  system_config_change: {
    bg: 'bg-orange-500/10',
    text: 'text-orange-400',
    icon: 'text-orange-400',
  },
  blueprint_created: {
    bg: 'bg-purple-500/10',
    text: 'text-purple-400',
    icon: 'text-purple-400',
  },
  blueprint_deleted: {
    bg: 'bg-red-500/10',
    text: 'text-red-400',
    icon: 'text-red-400',
  },
  blueprint_shared: {
    bg: 'bg-cyan-500/10',
    text: 'text-cyan-400',
    icon: 'text-cyan-400',
  },
  default: {
    bg: 'bg-cyan-500/10',
    text: 'text-cyan-400',
    icon: 'text-cyan-400',
  },
};

/**
 * Generate user-friendly title from action_type
 */
function getActivityTitle(actionType: string): string {
  const titles: Record<string, string> = {
    user_created: 'User Created',
    user_updated: 'User Updated',
    user_deleted: 'User Deleted',
    user_role_changed: 'Role Changed',
    user_tier_changed: 'Subscription Tier Changed',
    user_limits_updated: 'Usage Limits Updated',
    bulk_role_update: 'Bulk Role Update',
    bulk_tier_update: 'Bulk Tier Update',
    bulk_delete: 'Bulk User Deletion',
    user_login: 'User Login',
    user_logout: 'User Logout',
    user_password_reset: 'Password Reset',
    user_email_changed: 'Email Changed',
    data_export: 'Data Export',
    system_config_change: 'System Configuration Changed',
    blueprint_created: 'Blueprint Created',
    blueprint_deleted: 'Blueprint Deleted',
    blueprint_shared: 'Blueprint Shared',
  };
  return (
    titles[actionType] || actionType.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
  );
}

/**
 * Generate user-friendly description from action_type and metadata
 */
function getActivityDescription(activity: Activity): string {
  const { action_type, metadata, actor } = activity;
  const actorName = actor?.full_name || actor?.email || 'System';

  switch (action_type) {
    case 'user_created':
      return `User account was created by ${actorName}`;
    case 'user_updated':
      if (metadata?.changes) {
        const changes = Object.keys(metadata.changes).join(', ');
        return `User profile updated: ${changes}`;
      }
      return `User profile was updated by ${actorName}`;
    case 'user_deleted':
      return `User account was deleted by ${actorName}`;
    case 'user_role_changed':
      if (metadata?.change) {
        const { before, after } = metadata.change as any;
        return `Role changed from ${before} to ${after} by ${actorName}`;
      }
      return `User role was changed by ${actorName}`;
    case 'user_tier_changed':
      if (metadata?.change) {
        const { before, after } = metadata.change as any;
        return `Subscription tier changed from ${before} to ${after} by ${actorName}`;
      }
      return `Subscription tier was changed by ${actorName}`;
    case 'user_limits_updated':
      return `Usage limits were updated by ${actorName}`;
    case 'bulk_role_update':
      const roleCount = metadata?.count || 0;
      const newRole = metadata?.newRole || 'unknown';
      return `Updated role to ${newRole} for ${roleCount} user(s)`;
    case 'bulk_tier_update':
      const tierCount = metadata?.count || 0;
      const newTier = metadata?.newTier || 'unknown';
      return `Updated tier to ${newTier} for ${tierCount} user(s)`;
    case 'bulk_delete':
      const deleteCount = metadata?.count || 0;
      return `Deleted ${deleteCount} user(s)`;
    case 'user_login':
      return `User logged in`;
    case 'user_logout':
      return `User logged out`;
    case 'user_password_reset':
      return `Password was reset`;
    case 'user_email_changed':
      return `Email address was changed`;
    case 'data_export':
      const format = metadata?.format || 'unknown';
      return `Data exported in ${format} format by ${actorName}`;
    case 'system_config_change':
      return `System configuration was modified by ${actorName}`;
    case 'blueprint_created':
      return `Created a new blueprint`;
    case 'blueprint_deleted':
      return `Deleted a blueprint`;
    case 'blueprint_shared':
      return `Shared a blueprint`;
    default:
      return `Activity: ${action_type.replace(/_/g, ' ')}`;
  }
}

export default function UserActivityPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.userId as string;

  const [data, setData] = useState<ActivityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchActivity = async (page: number = currentPage) => {
    try {
      setLoading(true);
      setError(null);

      console.log('[Activity Page] Fetching activity for user:', userId, 'page:', page);
      const response = await fetch(`/api/admin/users/${userId}/activity?page=${page}&limit=10`);

      console.log('[Activity Page] Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('[Activity Page] API error:', errorData);
        throw new Error(errorData.error || `Failed to fetch activity (${response.status})`);
      }

      const activityData = await response.json();
      console.log('[Activity Page] Full activity data received:', activityData);
      console.log('[Activity Page] Activity data summary:', {
        total: activityData.pagination?.total || 0,
        activities: activityData.activities?.length || 0,
        hasData: !!activityData,
        hasPagination: !!activityData.pagination,
        hasActivities: !!activityData.activities,
        activitiesIsArray: Array.isArray(activityData.activities),
      });
      setData(activityData);
    } catch (err) {
      console.error('[Activity Page] Failed to fetch activity:', err);
      setError(err instanceof Error ? err.message : 'Failed to load activity');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivity(currentPage);
  }, [userId, currentPage]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchActivity();
    setRefreshing(false);
  };

  const handleTestLog = async () => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/activity/test-log`, {
        method: 'POST',
      });

      if (response.ok) {
        console.log('[Activity Page] Test log created successfully');
        await fetchActivity(); // Refresh to show the new log
      } else {
        console.error('[Activity Page] Failed to create test log');
      }
    } catch (err) {
      console.error('[Activity Page] Test log error:', err);
    }
  };

  const handleBackfill = async () => {
    try {
      setRefreshing(true);
      console.log('[Activity Page] Starting backfill...');

      const response = await fetch('/api/admin/debug/backfill-activities', {
        method: 'POST',
      });

      if (response.ok) {
        const result = await response.json();
        console.log('[Activity Page] Backfill completed:', result);
        alert(
          `Backfilled ${result.stats.inserted} activity logs for ${result.stats.totalUsers} users!`
        );
        await fetchActivity(); // Refresh to show the new logs
      } else {
        const error = await response.json();
        console.error('[Activity Page] Backfill failed:', error);
        alert(`Backfill failed: ${error.error}`);
      }
    } catch (err) {
      console.error('[Activity Page] Backfill error:', err);
      alert('Backfill error - see console');
    } finally {
      setRefreshing(false);
    }
  };

  const filteredActivities = data?.activities.filter((activity) => {
    const title = getActivityTitle(activity.action_type);
    const description = getActivityDescription(activity);

    const matchesSearch =
      searchQuery === '' ||
      title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      activity.action_type.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = filterType === 'all' || activity.action_type === filterType;

    return matchesSearch && matchesType;
  });

  console.log('[Activity Page] Filtering debug:', {
    totalActivities: data?.activities?.length || 0,
    filteredCount: filteredActivities?.length || 0,
    searchQuery,
    filterType,
    firstActivity: data?.activities?.[0],
  });

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  const getActivityIcon = (type: string) => {
    return ACTIVITY_ICONS[type] || ACTIVITY_ICONS.default;
  };

  const getActivityColors = (type: string) => {
    return ACTIVITY_COLORS[type] || ACTIVITY_COLORS.default;
  };

  const activityTypes = Array.from(new Set(data?.activities.map((a) => a.action_type) || []));

  if (loading) {
    return (
      <div className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <GlassCard className="p-12">
            <div className="flex flex-col items-center justify-center space-y-4">
              <RefreshCw className="h-8 w-8 animate-spin text-cyan-400" />
              <p className="text-white/60">Loading activity log...</p>
            </div>
          </GlassCard>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <GlassCard className="p-12">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="rounded-full bg-red-500/10 p-6">
                <Activity className="h-12 w-12 text-red-500" />
              </div>
              <h3 className="text-xl font-semibold text-white">Failed to Load Activity</h3>
              <p className="text-white/60">{error || 'An unexpected error occurred'}</p>
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  onClick={() => router.back()}
                  className="border-white/10 bg-white/5 text-white hover:bg-white/10"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Go Back
                </Button>
                <Button
                  onClick={handleRefresh}
                  className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:from-cyan-600 hover:to-blue-600"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try Again
                </Button>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="space-y-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="flex items-center justify-between"
          >
            <div className="flex items-center space-x-4">
              <Link href="/admin/users">
                <Button variant="ghost" size="icon" className="text-white/60 hover:text-white">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20">
                <Activity className="h-8 w-8 text-cyan-400" />
              </div>
              <div>
                <h1 className="font-heading text-4xl font-bold tracking-tight text-white sm:text-5xl">
                  Activity <span className="text-primary">Log</span>
                </h1>
                <p className="mt-2 text-lg text-white/70">
                  {data.user.full_name || data.user.email}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="small"
                onClick={handleBackfill}
                disabled={refreshing}
                className="border-purple-500/20 bg-purple-500/5 text-purple-400 hover:bg-purple-500/10"
              >
                <Activity className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                Backfill Activities
              </Button>
              <Button
                variant="outline"
                size="small"
                onClick={handleRefresh}
                disabled={refreshing}
                className="border-white/10 bg-white/5 text-white hover:bg-white/10"
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </motion.div>

          {/* Stats Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="grid gap-6 md:grid-cols-3"
          >
            <GlassCard>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white/60">Total Activities</p>
                  <p className="mt-2 text-3xl font-bold text-white">{data.pagination.total}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/20 to-cyan-600/20">
                  <TrendingUp className="h-6 w-6 text-cyan-400" />
                </div>
              </div>
            </GlassCard>

            <GlassCard>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white/60">Showing</p>
                  <p className="mt-2 text-3xl font-bold text-white">
                    {filteredActivities?.length || 0}
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/20">
                  <Filter className="h-6 w-6 text-purple-400" />
                </div>
              </div>
            </GlassCard>

            <GlassCard>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white/60">Activity Types</p>
                  <p className="mt-2 text-3xl font-bold text-white">{activityTypes.length}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-green-500/20 to-green-600/20">
                  <Calendar className="h-6 w-6 text-green-400" />
                </div>
              </div>
            </GlassCard>
          </motion.div>

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <GlassCard>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                {/* Search */}
                <div className="relative flex-1">
                  <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-white/40" />
                  <input
                    type="text"
                    placeholder="Search activities..."
                    className="w-full rounded-lg border border-white/10 bg-white/5 py-2 pr-4 pl-10 text-white placeholder-white/40 transition-all focus:border-cyan-500/50 focus:bg-white/10 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                {/* Filter by Type */}
                <div className="flex items-center gap-2">
                  <Button
                    variant={filterType === 'all' ? 'primary' : 'outline'}
                    size="small"
                    onClick={() => setFilterType('all')}
                    className={
                      filterType === 'all'
                        ? 'bg-cyan-500 text-white'
                        : 'border-white/10 bg-white/5 text-white hover:bg-white/10'
                    }
                  >
                    All
                  </Button>
                  {activityTypes.map((type) => (
                    <Button
                      key={type}
                      variant={filterType === type ? 'primary' : 'outline'}
                      size="small"
                      onClick={() => setFilterType(type)}
                      className={
                        filterType === type
                          ? 'bg-cyan-500 text-white'
                          : 'border-white/10 bg-white/5 text-white hover:bg-white/10'
                      }
                    >
                      {getActivityTitle(type)}
                    </Button>
                  ))}
                </div>
              </div>
            </GlassCard>
          </motion.div>

          {/* Activity Timeline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <GlassCard className="p-6">
              <div className="space-y-4">
                {filteredActivities && filteredActivities.length > 0 ? (
                  filteredActivities.map((activity, index) => {
                    const Icon = getActivityIcon(activity.action_type);
                    const colors = getActivityColors(activity.action_type);
                    const title = getActivityTitle(activity.action_type);
                    const description = getActivityDescription(activity);

                    return (
                      <motion.div
                        key={activity.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className="group relative flex items-start space-x-4 rounded-lg border border-white/5 bg-white/[0.02] p-4 transition-all hover:border-cyan-500/20 hover:bg-white/5"
                      >
                        {/* Icon */}
                        <div
                          className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ${colors.bg}`}
                        >
                          <Icon className={`h-5 w-5 ${colors.icon}`} />
                        </div>

                        {/* Content */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0 flex-1">
                              <h4 className="text-sm font-semibold text-white">{title}</h4>
                              <p className="mt-1 text-sm text-white/60">{description}</p>
                              {activity.resource_id && activity.resource_type === 'blueprint' && (
                                <div className="mt-2">
                                  <Badge variant="outline" className="border-white/10 text-xs">
                                    Blueprint: {activity.resource_id.slice(0, 8)}
                                  </Badge>
                                </div>
                              )}
                            </div>

                            {/* Timestamp */}
                            <div className="flex flex-shrink-0 items-center space-x-2 text-xs text-white/40">
                              <Clock className="h-3 w-3" />
                              <span>{formatTimestamp(activity.created_at)}</span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })
                ) : (
                  <div className="flex flex-col items-center justify-center py-16">
                    <div className="rounded-full bg-white/5 p-6">
                      <Activity className="h-12 w-12 text-white/40" />
                    </div>
                    <h3 className="mt-4 text-lg font-semibold text-white">No Activities Found</h3>
                    <p className="mt-2 text-sm text-white/60">
                      {searchQuery || filterType !== 'all'
                        ? 'Try adjusting your filters or search query'
                        : 'No activity recorded for this user yet'}
                    </p>
                  </div>
                )}
              </div>
            </GlassCard>
          </motion.div>

          {/* Pagination */}
          {data && data.pagination.totalPages > 1 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <GlassCard className="p-6">
                <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
                  {/* Page Info */}
                  <div className="text-sm text-white/60">
                    Showing {(currentPage - 1) * 10 + 1} to{' '}
                    {Math.min(currentPage * 10, data.pagination.total)} of {data.pagination.total}{' '}
                    activities
                  </div>

                  {/* Pagination Controls */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="small"
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                      className="border-white/10 bg-white/5 text-white hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      First
                    </Button>
                    <Button
                      variant="outline"
                      size="small"
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="border-white/10 bg-white/5 text-white hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Previous
                    </Button>

                    {/* Page Numbers */}
                    <div className="flex items-center gap-1">
                      {Array.from({ length: data.pagination.totalPages }, (_, i) => i + 1)
                        .filter((page) => {
                          // Show first page, last page, current page, and pages around current
                          return (
                            page === 1 ||
                            page === data.pagination.totalPages ||
                            Math.abs(page - currentPage) <= 1
                          );
                        })
                        .map((page, index, array) => {
                          // Add ellipsis if there's a gap
                          const prevPage = array[index - 1];
                          const showEllipsis = prevPage && page - prevPage > 1;

                          return (
                            <div key={page} className="flex items-center gap-1">
                              {showEllipsis && <span className="px-2 text-white/40">...</span>}
                              <Button
                                variant="outline"
                                size="small"
                                onClick={() => setCurrentPage(page)}
                                className={
                                  currentPage === page
                                    ? 'border-cyan-500 bg-cyan-500 text-white'
                                    : 'border-white/10 bg-white/5 text-white hover:bg-white/10'
                                }
                              >
                                {page}
                              </Button>
                            </div>
                          );
                        })}
                    </div>

                    <Button
                      variant="outline"
                      size="small"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === data.pagination.totalPages}
                      className="border-white/10 bg-white/5 text-white hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Next
                    </Button>
                    <Button
                      variant="outline"
                      size="small"
                      onClick={() => setCurrentPage(data.pagination.totalPages)}
                      disabled={currentPage === data.pagination.totalPages}
                      className="border-white/10 bg-white/5 text-white hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Last
                    </Button>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
