'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Key, CreditCard, Info } from 'lucide-react';
import Link from 'next/link';
import { GlassCard } from '@/components/ui/GlassCard';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useUserProfile } from '@/lib/hooks/useUserProfile';
import { UpdatePasswordModal } from './UpdatePasswordModal';

/**
 * AccountInfoSection - Minimalist account information cards
 * Simplified from 6 cards to 3 essential cards:
 * 1. Authentication & Security
 * 2. Last Login
 * 3. Quick Actions
 */
export function AccountInfoSection() {
  const { user } = useAuth();
  const { profile, loading } = useUserProfile();
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  if (loading) {
    return (
      <GlassCard className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="bg-text-disabled/20 h-4 w-32 rounded" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="bg-text-disabled/10 h-24 rounded-lg" />
            <div className="bg-text-disabled/10 h-24 rounded-lg" />
            <div className="bg-text-disabled/10 h-24 rounded-lg" />
          </div>
        </div>
      </GlassCard>
    );
  }

  // Format last login
  const lastLogin = user?.last_sign_in_at
    ? new Date(user.last_sign_in_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Never';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
    >
      <GlassCard className="p-6">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-heading text-text-primary font-semibold">Account Details</h2>
          <p className="text-caption text-text-secondary mt-1">
            Security and authentication information
          </p>
        </div>

        {/* Info Cards Grid */}
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Authentication Method */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.4 }}
            className={cn(
              'bg-background-surface hover:bg-background-paper group border-primary-accent/20 rounded-lg border p-4',
              'transition-all duration-200'
            )}
          >
            <div className="flex items-start gap-3">
              <div className="bg-primary-accent/10 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg">
                <Shield className="text-primary-accent h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-caption text-text-secondary mb-1 font-medium">Authentication</p>
                <p className="text-body text-text-primary truncate font-semibold">
                  {user?.app_metadata?.provider?.charAt(0).toUpperCase() +
                    user?.app_metadata?.provider?.slice(1) || 'Email'}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Last Login */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.5 }}
            className={cn(
              'bg-background-surface hover:bg-background-paper group border-secondary-accent/20 rounded-lg border p-4',
              'transition-all duration-200'
            )}
          >
            <div className="flex items-start gap-3">
              <div className="bg-secondary-accent/10 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg">
                <Info className="text-secondary-accent h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-caption text-text-secondary mb-1 font-medium">Last Login</p>
                <p className="text-body text-text-primary truncate font-semibold">{lastLogin}</p>
              </div>
            </div>
          </motion.div>

          {/* Account Status */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.6 }}
            className={cn(
              'bg-background-surface hover:bg-background-paper group border-success/20 rounded-lg border p-4',
              'transition-all duration-200'
            )}
          >
            <div className="flex items-start gap-3">
              <div className="bg-success/10 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg">
                <Shield className="text-success h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-caption text-text-secondary mb-1 font-medium">Account Status</p>
                <p className="text-body text-success truncate font-semibold">Active & Secure</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.7 }}
          className="border-background-surface flex flex-wrap gap-3 border-t pt-6"
        >
          <button
            onClick={() => setIsPasswordModalOpen(true)}
            className={cn(
              'inline-flex items-center gap-2 rounded-lg px-4 py-2',
              'from-primary-accent to-primary-accent-light bg-gradient-to-r',
              'text-caption font-medium text-white',
              'hover:scale-105 hover:shadow-lg',
              'transition-all duration-200',
              'focus-visible:ring-primary-accent focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none'
            )}
          >
            <Key className="h-4 w-4" />
            Update Password
          </button>

          <Link
            href="/pricing"
            className={cn(
              'inline-flex items-center gap-2 rounded-lg px-4 py-2',
              'border-primary-accent/30 bg-background-surface border',
              'text-text-primary text-caption font-medium',
              'hover:bg-background-paper hover:border-primary-accent/50',
              'transition-all duration-200',
              'focus-visible:ring-primary-accent focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none'
            )}
          >
            <CreditCard className="h-4 w-4" />
            Manage Subscription
          </Link>
        </motion.div>
      </GlassCard>

      {/* Password Update Modal */}
      <UpdatePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
      />
    </motion.div>
  );
}
