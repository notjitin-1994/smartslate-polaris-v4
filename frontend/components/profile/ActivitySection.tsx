'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, FileText, Clock, UserCircle, ArrowRight } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { cn } from '@/lib/utils';

interface RecentActivity {
  id: string;
  action_type: string;
  resource_type: string;
  resource_id: string;
  metadata: Record<string, unknown>;
  created_at: string;
  actor_id: string;
  actor_full_name: string | null;
  actor_avatar_url: string | null;
}

interface RecentActivityResponse {
  activities: RecentActivity[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    has_more: boolean;
  };
}

/**
 * ActivitySection - Streamlined activity feed (last 3-4 activities)
 * Simplified from 4-stat grid to minimalist timeline
 * Features:
 * - Simple timeline design
 * - Activity type icons with color coding
 * - Relative timestamps
 * - "View All" link
 */
export function ActivitySection() {
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch recent activity (only 3-4 items)
  useEffect(() => {
    let mounted = true;
    const fetchActivityData = async () => {
      try {
        setLoading(true);
        setError(null);

        const recentResponse = await fetch('/api/user/activity/recent?limit=3&offset=0');
        
        if (!recentResponse.ok) {
          const errorData = await recentResponse.json().catch(() => ({}));
          console.error('[ActivitySection] API error:', {
            status: recentResponse.status,
            error: errorData.error,
            details: errorData.details
          });
          throw new Error(errorData.error || 'Failed to fetch recent activity');
        }
        
        const recentData: RecentActivityResponse = await recentResponse.json();
        if (mounted) {
          setRecentActivities(recentData.activities || []);
        }
      } catch (err) {
        console.error('[ActivitySection] Error fetching activity data:', err);
        if (mounted) {
          // Set error but also ensure activities is an empty array
          setError(err instanceof Error ? err.message : 'Failed to load activity data');
          setRecentActivities([]);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchActivityData();
    return () => { mounted = false; };
  }, []);

  // Helper function to format relative time
  const formatRelativeTime = (timestamp: string): string => {
    const now = new Date();
    const past = new Date(timestamp);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    const diffWeeks = Math.floor(diffMs / 604800000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffWeeks < 4) return `${diffWeeks}w ago`;
    return past.toLocaleDateString();
  };

  // Helper function to get activity display text
  const getActivityDisplay = (activity: RecentActivity) => {
    const actionTypeMap: Record<string, string> = {
      blueprint_created: 'Created blueprint',
      blueprint_updated: 'Updated blueprint',
      blueprint_deleted: 'Deleted blueprint',
      blueprint_exported: 'Exported blueprint',
      profile_updated: 'Updated profile',
      user_login: 'Logged in',
      user_logout: 'Logged out',
      user_deleted: 'Requested deletion',
      user_updated: 'Updated account',
    };

    const action = actionTypeMap[activity.action_type] || activity.action_type;
    const target = activity.metadata?.title as string | undefined;

    return { action, target };
  };

  // Helper function to get activity type for styling
  const getActivityType = (
    actionType: string
  ): { type: string; icon: React.ComponentType<{ className?: string }>; color: string } => {
    if (actionType.includes('blueprint')) {
      return {
        type: 'blueprint',
        icon: FileText,
        color: 'text-primary-accent bg-primary-accent/10 border-primary-accent/20',
      };
    }
    if (actionType.includes('profile') || actionType.includes('user_updated')) {
      return {
        type: 'profile',
        icon: UserCircle,
        color: 'text-secondary-accent bg-secondary-accent/10 border-secondary-accent/20',
      };
    }
    if (actionType.includes('login') || actionType.includes('logout')) {
      return {
        type: 'session',
        icon: Clock,
        color: 'text-success bg-success/10 border-success/20',
      };
    }
    return {
      type: 'other',
      icon: Activity,
      color: 'text-warning bg-warning/10 border-warning/20',
    };
  };

  if (loading) {
    return (
      <GlassCard className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="bg-text-disabled/20 h-4 w-32 rounded" />
          <div className="space-y-3">
            <div className="bg-text-disabled/10 h-16 rounded-lg" />
            <div className="bg-text-disabled/10 h-16 rounded-lg" />
            <div className="bg-text-disabled/10 h-16 rounded-lg" />
          </div>
        </div>
      </GlassCard>
    );
  }

  if (error) {
    return (
      <GlassCard className="p-6">
        <div className="text-center">
          <Activity className="text-error mx-auto h-12 w-12" />
          <h3 className="text-error mt-2 text-sm font-semibold">Failed to load activity</h3>
          <p className="text-text-secondary mt-1 text-sm">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-primary-accent hover:bg-primary-accent-dark mt-4 rounded-lg px-4 py-2 text-sm text-white"
          >
            Retry
          </button>
        </div>
      </GlassCard>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.4 }}
    >
      <GlassCard className="p-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-heading text-text-primary font-semibold">Recent Activity</h2>
            <p className="text-caption text-text-secondary mt-1">Your latest actions</p>
          </div>
        </div>

        {/* Activity Timeline */}
        <div className="space-y-3">
          {recentActivities.length === 0 ? (
            <div className="py-12 text-center">
              <Activity className="text-text-disabled mx-auto h-12 w-12" />
              <p className="text-text-secondary mt-3 text-sm font-medium">No recent activity</p>
              <p className="text-text-disabled mt-1 text-xs">
                Start creating blueprints to see activity here
              </p>
            </div>
          ) : (
            recentActivities.map((activity, index) => {
              const { action, target } = getActivityDisplay(activity);
              const { icon: Icon, color } = getActivityType(activity.action_type);

              return (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.5 + index * 0.1 }}
                  className={cn(
                    'bg-background-surface hover:bg-background-paper group flex items-center gap-4 rounded-lg border p-4',
                    'transition-all duration-200',
                    color.split(' ')[2] // border color
                  )}
                >
                  {/* Icon */}
                  <div
                    className={cn(
                      'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border',
                      color
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <p className="text-body text-text-primary font-medium">
                      {action}
                      {target && (
                        <span className="text-text-secondary font-normal"> • {target}</span>
                      )}
                    </p>
                    <p className="text-caption text-text-secondary">
                      {formatRelativeTime(activity.created_at)}
                    </p>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>

        {/* View All Link */}
        {recentActivities.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.8 }}
            className="border-background-surface mt-6 border-t pt-6"
          >
            <button
              className={cn(
                'group flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2',
                'border-primary-accent/30 bg-primary-accent/5 border',
                'text-primary-accent text-caption font-medium',
                'hover:bg-primary-accent/10 hover:border-primary-accent/50',
                'transition-all duration-200',
                'focus-visible:ring-primary-accent focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none'
              )}
            >
              View All Activity
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
          </motion.div>
        )}
      </GlassCard>
    </motion.div>
  );
}
