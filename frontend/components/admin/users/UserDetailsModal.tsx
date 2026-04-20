'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  X,
  Mail,
  Calendar,
  Clock,
  Shield,
  Crown,
  Activity,
  FileText,
  TrendingUp,
  User,
  MapPin,
  Globe,
  Smartphone,
  Edit,
  BarChart3,
  CheckCircle2,
  AlertCircle,
  Ban,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GlassCard } from '@/components/ui/GlassCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface User {
  user_id: string;
  email: string;
  full_name: string | null;
  user_role: string;
  subscription_tier: string;
  blueprint_creation_count: number;
  blueprint_creation_limit: number;
  blueprint_saving_count: number;
  blueprint_saving_limit: number;
  created_at: string;
  last_sign_in_at: string | null;
  updated_at: string;
  deleted_at: string | null;
  usage_metadata?: {
    last_active?: string;
    total_sessions?: number;
    avg_session_duration?: number;
  };
}

interface UserDetailsModalProps {
  user: User;
  onClose: () => void;
  onEdit: () => void;
}

interface ActivityEvent {
  id: string;
  type: 'login' | 'blueprint_created' | 'blueprint_saved' | 'profile_updated' | 'tier_changed';
  title: string;
  description: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export function UserDetailsModal({ user, onClose, onEdit }: UserDetailsModalProps) {
  const [activityLogs, setActivityLogs] = useState<ActivityEvent[]>([]);
  const [loadingActivity, setLoadingActivity] = useState(true);

  useEffect(() => {
    // Fetch user activity logs
    const fetchActivity = async () => {
      try {
        const response = await fetch(`/api/admin/users/${user.user_id}/activity`);
        if (response.ok) {
          const data = await response.json();
          setActivityLogs(data.activities || []);
        }
      } catch (error) {
        console.error('Failed to fetch activity:', error);
      } finally {
        setLoadingActivity(false);
      }
    };

    fetchActivity();
  }, [user.user_id]);

  // Calculate statistics
  const usagePercent =
    user.blueprint_creation_limit > 0
      ? Math.round((user.blueprint_creation_count / user.blueprint_creation_limit) * 100)
      : 0;

  const getUserStatus = () => {
    if (user.deleted_at) {
      return { label: 'Deleted', color: 'bg-red-500', textColor: 'text-red-400', icon: Ban };
    }

    const lastActive = user.usage_metadata?.last_active
      ? new Date(user.usage_metadata.last_active)
      : user.last_sign_in_at
        ? new Date(user.last_sign_in_at)
        : null;

    if (!lastActive) {
      return {
        label: 'Never Logged In',
        color: 'bg-gray-500',
        textColor: 'text-gray-400',
        icon: AlertCircle,
      };
    }

    const daysSinceActive = (Date.now() - lastActive.getTime()) / (1000 * 60 * 60 * 24);

    if (daysSinceActive < 1) {
      return {
        label: 'Active Now',
        color: 'bg-green-500',
        textColor: 'text-green-400',
        icon: Activity,
      };
    } else if (daysSinceActive < 7) {
      return {
        label: 'Active',
        color: 'bg-green-400',
        textColor: 'text-green-400',
        icon: CheckCircle2,
      };
    } else if (daysSinceActive < 30) {
      return {
        label: 'Inactive',
        color: 'bg-yellow-500',
        textColor: 'text-yellow-400',
        icon: Clock,
      };
    } else {
      return {
        label: 'Dormant',
        color: 'bg-orange-500',
        textColor: 'text-orange-400',
        icon: AlertCircle,
      };
    }
  };

  const status = getUserStatus();
  const StatusIcon = status.icon;

  const getActivityIcon = (type: ActivityEvent['type']) => {
    switch (type) {
      case 'login':
        return Activity;
      case 'blueprint_created':
        return FileText;
      case 'blueprint_saved':
        return CheckCircle2;
      case 'profile_updated':
        return User;
      case 'tier_changed':
        return TrendingUp;
      default:
        return Activity;
    }
  };

  const getActivityColor = (type: ActivityEvent['type']) => {
    switch (type) {
      case 'login':
        return 'text-cyan-400 bg-cyan-500/10';
      case 'blueprint_created':
        return 'text-purple-400 bg-purple-500/10';
      case 'blueprint_saved':
        return 'text-green-400 bg-green-500/10';
      case 'profile_updated':
        return 'text-blue-400 bg-blue-500/10';
      case 'tier_changed':
        return 'text-orange-400 bg-orange-500/10';
      default:
        return 'text-white/60 bg-white/5';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-2xl bg-[#020C1B] shadow-2xl"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-[#020C1B]/95 p-6 backdrop-blur-sm">
          <div className="flex items-center space-x-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 text-2xl font-bold text-cyan-400">
              {(user.full_name || user.email || 'A')[0].toUpperCase()}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">
                {user.full_name || 'Anonymous User'}
              </h2>
              <div className="mt-1 flex items-center space-x-2">
                <StatusIcon className={`h-4 w-4 ${status.textColor}`} />
                <span className={`text-sm ${status.textColor}`}>{status.label}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="small"
              onClick={onEdit}
              className="border-white/10 bg-white/5 text-white hover:bg-white/10"
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit User
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-white/60 hover:text-white"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-6" style={{ maxHeight: 'calc(90vh - 100px)' }}>
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 bg-white/5">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="activity">Activity Timeline</TabsTrigger>
              <TabsTrigger value="usage">Usage Analytics</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              {/* Basic Information */}
              <GlassCard>
                <h3 className="mb-4 text-lg font-semibold text-white">Basic Information</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex items-start space-x-3">
                    <div className="rounded-lg bg-cyan-500/10 p-2">
                      <Mail className="h-5 w-5 text-cyan-400" />
                    </div>
                    <div>
                      <p className="text-xs text-white/60">Email</p>
                      <p className="font-medium text-white">{user.email}</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="rounded-lg bg-purple-500/10 p-2">
                      <User className="h-5 w-5 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-xs text-white/60">User ID</p>
                      <p className="font-mono text-sm text-white">{user.user_id.slice(0, 16)}...</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="rounded-lg bg-green-500/10 p-2">
                      <Calendar className="h-5 w-5 text-green-400" />
                    </div>
                    <div>
                      <p className="text-xs text-white/60">Joined</p>
                      <p className="font-medium text-white">
                        {new Date(user.created_at).toLocaleDateString('en-US', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="rounded-lg bg-orange-500/10 p-2">
                      <Clock className="h-5 w-5 text-orange-400" />
                    </div>
                    <div>
                      <p className="text-xs text-white/60">Last Sign In</p>
                      <p className="font-medium text-white">
                        {user.last_sign_in_at
                          ? new Date(user.last_sign_in_at).toLocaleDateString('en-US', {
                              month: 'long',
                              day: 'numeric',
                              year: 'numeric',
                            })
                          : 'Never'}
                      </p>
                    </div>
                  </div>
                </div>
              </GlassCard>

              {/* Role & Subscription */}
              <GlassCard>
                <h3 className="mb-4 text-lg font-semibold text-white">Role & Subscription</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex items-start space-x-3">
                    <div className="rounded-lg bg-cyan-500/10 p-2">
                      <Shield className="h-5 w-5 text-cyan-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-white/60">User Role</p>
                      <div className="mt-1">
                        <Badge variant="default" className="capitalize">
                          {user.user_role === 'developer' && <Shield className="mr-1 h-3 w-3" />}
                          {user.user_role}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="rounded-lg bg-purple-500/10 p-2">
                      <Crown className="h-5 w-5 text-purple-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-white/60">Subscription Tier</p>
                      <div className="mt-1">
                        <Badge variant="secondary" className="capitalize">
                          {user.subscription_tier}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </GlassCard>

              {/* Usage Stats */}
              <GlassCard>
                <h3 className="mb-4 text-lg font-semibold text-white">Usage Statistics</h3>
                <div className="space-y-4">
                  {/* Blueprints Created */}
                  <div>
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="text-white/70">Blueprints Created</span>
                      <span className="font-semibold text-white">
                        {user.blueprint_creation_count} / {user.blueprint_creation_limit}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-white/10">
                      <div
                        className={`h-full transition-all ${
                          usagePercent >= 90
                            ? 'bg-red-500'
                            : usagePercent >= 70
                              ? 'bg-yellow-500'
                              : 'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(usagePercent, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Blueprints Saved */}
                  <div>
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="text-white/70">Blueprints Saved</span>
                      <span className="font-semibold text-white">
                        {user.blueprint_saving_count} / {user.blueprint_saving_limit}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full bg-cyan-500 transition-all"
                        style={{
                          width: `${Math.min(
                            (user.blueprint_saving_count / user.blueprint_saving_limit) * 100,
                            100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </GlassCard>
            </TabsContent>

            {/* Activity Timeline Tab */}
            <TabsContent value="activity" className="space-y-4">
              <GlassCard>
                <h3 className="mb-4 text-lg font-semibold text-white">Activity Timeline</h3>

                {loadingActivity ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
                  </div>
                ) : activityLogs.length > 0 ? (
                  <div className="relative space-y-4">
                    {/* Timeline Line */}
                    <div className="absolute top-0 bottom-0 left-[19px] w-px bg-white/10" />

                    {activityLogs.map((event, index) => {
                      const Icon = getActivityIcon(event.type);
                      const colorClasses = getActivityColor(event.type);

                      return (
                        <motion.div
                          key={event.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="relative flex items-start space-x-4 pl-12"
                        >
                          <div
                            className={`absolute left-0 flex h-10 w-10 items-center justify-center rounded-full ${colorClasses}`}
                          >
                            <Icon className="h-5 w-5" />
                          </div>

                          <div className="flex-1 rounded-lg border border-white/10 bg-white/5 p-4">
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="font-medium text-white">{event.title}</p>
                                <p className="mt-1 text-sm text-white/60">{event.description}</p>
                              </div>
                              <p className="text-xs text-white/40">
                                {new Date(event.timestamp).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: 'numeric',
                                  minute: '2-digit',
                                })}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Activity className="h-12 w-12 text-white/20" />
                    <p className="mt-4 text-sm text-white/60">No activity recorded yet</p>
                  </div>
                )}
              </GlassCard>
            </TabsContent>

            {/* Usage Analytics Tab */}
            <TabsContent value="usage" className="space-y-4">
              <GlassCard>
                <h3 className="mb-4 text-lg font-semibold text-white">Usage Analytics</h3>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-white/60">Total Sessions</p>
                        <p className="mt-1 text-2xl font-bold text-white">
                          {user.usage_metadata?.total_sessions || 0}
                        </p>
                      </div>
                      <Activity className="h-8 w-8 text-cyan-400/60" />
                    </div>
                  </div>

                  <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-white/60">Avg. Session</p>
                        <p className="mt-1 text-2xl font-bold text-white">
                          {user.usage_metadata?.avg_session_duration
                            ? `${Math.round(user.usage_metadata.avg_session_duration)}m`
                            : '0m'}
                        </p>
                      </div>
                      <Clock className="h-8 w-8 text-purple-400/60" />
                    </div>
                  </div>

                  <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-white/60">Usage Rate</p>
                        <p className="mt-1 text-2xl font-bold text-white">{usagePercent}%</p>
                      </div>
                      <BarChart3 className="h-8 w-8 text-green-400/60" />
                    </div>
                  </div>
                </div>

                <div className="mt-6 rounded-lg border border-white/10 bg-white/5 p-4">
                  <p className="text-sm text-white/60">Detailed analytics and charts coming soon</p>
                </div>
              </GlassCard>
            </TabsContent>
          </Tabs>
        </div>
      </motion.div>
    </div>
  );
}
