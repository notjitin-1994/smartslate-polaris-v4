'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Mail, Calendar, CreditCard, Key } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { useAuth } from '@/contexts/AuthContext';
import { useUserProfile } from '@/lib/hooks/useUserProfile';

export function AccountInfoSection() {
  const { user } = useAuth();
  const { profile, loading } = useUserProfile();

  if (loading) {
    return (
      <GlassCard className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 w-1/4 rounded bg-neutral-200 dark:bg-neutral-700"></div>
          <div className="space-y-2">
            <div className="h-3 rounded bg-neutral-200 dark:bg-neutral-700"></div>
            <div className="h-3 w-3/4 rounded bg-neutral-200 dark:bg-neutral-700"></div>
          </div>
        </div>
      </GlassCard>
    );
  }

  const accountInfo = [
    {
      icon: Mail,
      label: 'Email',
      value: user?.email || 'Not provided',
      description: 'Primary account email address',
    },
    {
      icon: Calendar,
      label: 'Member Since',
      value: user?.created_at
        ? new Date(user.created_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })
        : 'Unknown',
      description: 'Account creation date',
    },
    {
      icon: Shield,
      label: 'Account Type',
      value: user?.app_metadata?.provider || 'Email',
      description: 'Authentication provider',
    },
    {
      icon: CreditCard,
      label: 'Subscription',
      value: profile?.subscription_tier
        ? profile.subscription_tier.charAt(0).toUpperCase() + profile.subscription_tier.slice(1)
        : 'Explorer',
      description: 'Current subscription tier',
    },
    {
      icon: Key,
      label: 'Last Login',
      value: user?.last_sign_in_at
        ? new Date(user.last_sign_in_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })
        : 'Recent',
      description: 'Most recent sign-in time',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      <GlassCard className="p-6">
        <div className="mb-6 flex items-center gap-3">
          <div className="from-primary/20 to-secondary/20 border-primary/30 flex h-10 w-10 items-center justify-center rounded-xl border bg-gradient-to-br">
            <Key className="text-primary h-5 w-5" />
          </div>
          <div>
            <h2 className="text-heading text-foreground font-semibold">Account Information</h2>
            <p className="text-body text-text-secondary">Your account details and settings</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {accountInfo.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.4 + index * 0.1 }}
                className="group"
              >
                <div className="bg-background/50 hover:bg-background/80 rounded-xl border border-neutral-200/50 p-4 transition-all duration-200 hover:shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="bg-primary/10 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg">
                      <Icon className="text-primary h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-caption text-text-secondary mb-1 font-medium tracking-wide uppercase">
                        {item.label}
                      </p>
                      <p className="text-body text-foreground truncate font-medium">{item.value}</p>
                      <p className="text-caption text-text-secondary mt-1">{item.description}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Additional Account Actions */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.8 }}
          className="mt-6 border-t border-neutral-200/50 pt-6"
        >
          <div className="flex flex-wrap gap-3">
            <button className="bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-primary inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none">
              <Key className="h-4 w-4" />
              Update Password
            </button>
            <button className="bg-background text-foreground hover:bg-background/80 focus-visible:ring-primary inline-flex items-center gap-2 rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none">
              <Shield className="h-4 w-4" />
              Two-Factor Auth
            </button>
            <button className="bg-background text-foreground hover:bg-background/80 focus-visible:ring-primary inline-flex items-center gap-2 rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none">
              <CreditCard className="h-4 w-4" />
              Manage Subscription
            </button>
          </div>
        </motion.div>
      </GlassCard>
    </motion.div>
  );
}
