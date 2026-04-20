'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Activity, TrendingUp, Clock, Star, FileText, Eye } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { useUserProfile } from '@/lib/hooks/useUserProfile';

export function ActivitySection() {
  const { profile, loading } = useUserProfile();

  if (loading) {
    return (
      <GlassCard className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 w-1/4 rounded bg-neutral-200 dark:bg-neutral-700"></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-20 rounded bg-neutral-200 dark:bg-neutral-700"></div>
            <div className="h-20 rounded bg-neutral-200 dark:bg-neutral-700"></div>
          </div>
        </div>
      </GlassCard>
    );
  }

  // Mock activity data - in a real app, this would come from the backend
  const activityStats = [
    {
      icon: FileText,
      label: 'Blueprints Created',
      value: profile?.blueprints_created || 0,
      description: 'Total learning blueprints generated',
      trend: '+12%',
      trendUp: true,
    },
    {
      icon: Star,
      label: 'Favorite Starmaps',
      value: profile?.favorite_starmaps || 0,
      description: 'Saved for quick access',
      trend: '+3',
      trendUp: true,
    },
    {
      icon: Clock,
      label: 'Hours Learning',
      value: profile?.learning_hours || 0,
      description: 'Time spent in learning activities',
      trend: '+8h',
      trendUp: true,
    },
    {
      icon: Eye,
      label: 'Content Viewed',
      value: profile?.content_viewed || 0,
      description: 'Articles and resources accessed',
      trend: '+15',
      trendUp: true,
    },
  ];

  const recentActivity = [
    {
      action: 'Created new learning blueprint',
      target: 'React Performance Optimization',
      time: '2 hours ago',
      type: 'blueprint',
    },
    {
      action: 'Completed module',
      target: 'Advanced TypeScript Patterns',
      time: '1 day ago',
      type: 'learning',
    },
    {
      action: 'Updated profile information',
      target: 'Personal details and preferences',
      time: '3 days ago',
      type: 'profile',
    },
    {
      action: 'Shared starmap',
      target: 'JavaScript Fundamentals Guide',
      time: '1 week ago',
      type: 'share',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
    >
      <GlassCard className="p-6">
        <div className="mb-6 flex items-center gap-3">
          <div className="from-primary/20 to-secondary/20 border-primary/30 flex h-10 w-10 items-center justify-center rounded-xl border bg-gradient-to-br">
            <Activity className="text-primary h-5 w-5" />
          </div>
          <div>
            <h2 className="text-heading text-foreground font-semibold">Activity Overview</h2>
            <p className="text-body text-text-secondary">Your learning journey and achievements</p>
          </div>
        </div>

        {/* Activity Stats Grid */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {activityStats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: 0.5 + index * 0.1 }}
                className="group"
              >
                <div className="bg-background/50 hover:bg-background/80 rounded-xl border border-neutral-200/50 p-4 transition-all duration-200 hover:shadow-sm">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-lg">
                      <Icon className="text-primary h-4 w-4" />
                    </div>
                    {stat.trend && (
                      <div
                        className={`text-caption flex items-center gap-1 ${
                          stat.trendUp ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        <TrendingUp className={`h-3 w-3 ${!stat.trendUp ? 'rotate-180' : ''}`} />
                        <span>{stat.trend}</span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-1">
                    <p className="text-foreground text-2xl font-bold">
                      {stat.value.toLocaleString()}
                    </p>
                    <p className="text-caption text-text-secondary font-medium">{stat.label}</p>
                    <p className="text-caption text-text-secondary">{stat.description}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.9 }}
          className="space-y-4"
        >
          <h3 className="text-heading text-foreground font-semibold">Recent Activity</h3>

          <div className="space-y-3">
            {recentActivity.map((activity, index) => (
              <motion.div
                key={`${activity.action}-${index}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 1 + index * 0.1 }}
                className="bg-background/30 hover:bg-background/50 flex items-center gap-4 rounded-lg border border-neutral-200/50 p-3 transition-colors duration-200"
              >
                <div
                  className={`h-2 w-2 rounded-full ${
                    activity.type === 'blueprint'
                      ? 'bg-blue-500'
                      : activity.type === 'learning'
                        ? 'bg-green-500'
                        : activity.type === 'profile'
                          ? 'bg-purple-500'
                          : 'bg-orange-500'
                  }`}
                />

                <div className="min-w-0 flex-1">
                  <p className="text-body text-foreground">
                    <span className="font-medium">{activity.action}</span>
                    {activity.target && (
                      <span className="text-text-secondary"> • {activity.target}</span>
                    )}
                  </p>
                  <p className="text-caption text-text-secondary">{activity.time}</p>
                </div>

                <div
                  className={`flex h-6 w-6 items-center justify-center rounded-full ${
                    activity.type === 'blueprint'
                      ? 'bg-blue-100 text-blue-600'
                      : activity.type === 'learning'
                        ? 'bg-green-100 text-green-600'
                        : activity.type === 'profile'
                          ? 'bg-purple-100 text-purple-600'
                          : 'bg-orange-100 text-orange-600'
                  }`}
                >
                  {activity.type === 'blueprint' && <FileText className="h-3 w-3" />}
                  {activity.type === 'learning' && <Star className="h-3 w-3" />}
                  {activity.type === 'profile' && <Activity className="h-3 w-3" />}
                  {activity.type === 'share' && <Eye className="h-3 w-3" />}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* View All Activity Button */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 1.4 }}
          className="mt-6 border-t border-neutral-200/50 pt-6"
        >
          <button className="border-primary/30 bg-primary/5 text-primary hover:bg-primary/10 focus-visible:ring-primary inline-flex w-full items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none">
            <Activity className="h-4 w-4" />
            View All Activity
          </button>
        </motion.div>
      </GlassCard>
    </motion.div>
  );
}
