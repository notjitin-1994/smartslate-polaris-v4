'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  CreditCard,
  Zap,
  Users,
  Shield,
  Key,
  Smartphone,
  ExternalLink,
  Eye,
  EyeOff,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { GlassCard } from '@/components/ui/GlassCard';
import { useUserProfile } from '@/lib/hooks/useUserProfile';
import { getTierDisplayName } from '@/lib/utils/tierDisplay';
import { toast } from '@/lib/utils/toast';
import { cn } from '@/lib/utils';

/**
 * AccountTab - Subscription, usage, and security overview
 * Consolidates subscription info, usage stats, and security settings
 */
export function AccountTab() {
  const { profile, loading, refreshProfile } = useUserProfile();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showPasswordSection, setShowPasswordSection] = useState(false);

  // Password change state
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // 2FA state
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshProfile();
      toast.success('Refreshed', 'Account data updated');
    } catch (err) {
      console.error('Failed to refresh:', err);
      toast.error('Refresh Failed', 'Could not refresh account data');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error('Passwords Do Not Match', 'Please ensure both passwords are identical');
      return;
    }

    if (newPassword.length < 8) {
      toast.error('Weak Password', 'Password must be at least 8 characters');
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const response = await fetch('/api/account/password/change', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to change password');
      }

      toast.success('Password Updated', 'Your password has been changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordSection(false);
    } catch (error) {
      console.error('Failed to change password:', error);
      toast.error(
        'Update Failed',
        error instanceof Error ? error.message : 'Could not update password'
      );
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const calculateUsagePercentage = (current: number, limit: number) => {
    if (limit === -1) return 0;
    return Math.min(Math.round((current / limit) * 100), 100);
  };

  const creationPercentage = calculateUsagePercentage(
    profile?.blueprint_creation_count || 0,
    profile?.blueprint_creation_limit || 0
  );
  const savingPercentage = calculateUsagePercentage(
    profile?.blueprint_saving_count || 0,
    profile?.blueprint_saving_limit || 0
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="border-primary h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Subscription & Usage Card */}
      <GlassCard className="p-6 sm:p-8">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary/20 flex h-10 w-10 items-center justify-center rounded-xl">
              <CreditCard className="text-primary h-5 w-5" />
            </div>
            <div>
              <h3 className="text-heading text-foreground font-semibold">Subscription & Usage</h3>
              <p className="text-caption text-text-secondary">Your current plan and usage limits</p>
            </div>
          </div>
          <Button onClick={handleRefresh} disabled={isRefreshing} variant="ghost" size="medium">
            <RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
          </Button>
        </div>

        {/* Current Plan Badge */}
        <div className="from-primary/10 to-secondary/10 border-primary/30 mb-6 rounded-xl border bg-gradient-to-br p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-caption text-text-secondary mb-1">Current Plan</p>
              <p className="text-title text-foreground font-bold">
                {getTierDisplayName(profile?.subscription_tier)}
              </p>
            </div>
            <Button variant="primary" size="medium">
              <ExternalLink className="mr-2 h-4 w-4" />
              Upgrade Plan
            </Button>
          </div>
        </div>

        {/* Usage Progress Bars */}
        <div className="space-y-4">
          {/* Creation Usage */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600">
                  <Zap className="h-4 w-4 text-white" />
                </div>
                <span className="text-body text-foreground font-medium">Created</span>
              </div>
              <span className="text-body text-text-secondary">
                {profile?.blueprint_creation_count || 0} /{' '}
                {profile?.blueprint_creation_limit === -1
                  ? '∞'
                  : profile?.blueprint_creation_limit || 0}
              </span>
            </div>
            <div className="relative h-3 overflow-hidden rounded-full bg-neutral-200/20">
              <div
                className="absolute top-0 left-0 h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-600 transition-all duration-500"
                style={{ width: `${creationPercentage}%` }}
              />
            </div>
            <p className="text-caption text-text-secondary">{creationPercentage}% used</p>
          </div>

          {/* Saving Usage */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600">
                  <Users className="h-4 w-4 text-white" />
                </div>
                <span className="text-body text-foreground font-medium">Saved</span>
              </div>
              <span className="text-body text-text-secondary">
                {profile?.blueprint_saving_count || 0} /{' '}
                {profile?.blueprint_saving_limit === -1
                  ? '∞'
                  : profile?.blueprint_saving_limit || 0}
              </span>
            </div>
            <div className="relative h-3 overflow-hidden rounded-full bg-neutral-200/20">
              <div
                className="absolute top-0 left-0 h-full rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 transition-all duration-500"
                style={{ width: `${savingPercentage}%` }}
              />
            </div>
            <p className="text-caption text-text-secondary">{savingPercentage}% used</p>
          </div>
        </div>

        {profile?.subscription_tier === 'free' && (
          <div className="border-info/20 bg-info/10 mt-4 rounded-lg border p-3">
            <p className="text-caption text-text-secondary text-center">
              These are lifetime limits. Delete starmaps to create new ones.
            </p>
          </div>
        )}
      </GlassCard>

      {/* Security Card */}
      <GlassCard className="p-6 sm:p-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="bg-primary/20 flex h-10 w-10 items-center justify-center rounded-xl">
            <Shield className="text-primary h-5 w-5" />
          </div>
          <div>
            <h3 className="text-heading text-foreground font-semibold">Security</h3>
            <p className="text-caption text-text-secondary">Password and authentication settings</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Password */}
          <div className="bg-surface/30 flex items-center justify-between rounded-xl border border-neutral-200/10 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-300">
                <Key className="text-text-disabled h-5 w-5" />
              </div>
              <div>
                <p className="text-body text-foreground font-medium">Password</p>
                <p className="text-caption text-text-secondary">••••••••</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="medium"
              onClick={() => setShowPasswordSection(!showPasswordSection)}
            >
              {showPasswordSection ? 'Cancel' : 'Change'}
            </Button>
          </div>

          {/* Password Change Form (Collapsible) */}
          {showPasswordSection && (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              onSubmit={handlePasswordUpdate}
              className="border-primary/20 bg-primary/5 space-y-4 rounded-xl border p-4"
            >
              <div className="space-y-2">
                <label
                  htmlFor="currentPassword"
                  className="text-caption text-foreground font-medium"
                >
                  Current Password
                </label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    size="medium"
                    className="pr-12"
                    disabled={isUpdatingPassword}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="text-text-disabled hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="newPassword" className="text-caption text-foreground font-medium">
                  New Password
                </label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    size="medium"
                    className="pr-12"
                    disabled={isUpdatingPassword}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="text-text-disabled hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
                  >
                    {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="confirmPassword"
                  className="text-caption text-foreground font-medium"
                >
                  Confirm Password
                </label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  size="medium"
                  disabled={isUpdatingPassword}
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                size="medium"
                disabled={
                  !currentPassword || !newPassword || !confirmPassword || isUpdatingPassword
                }
                className="w-full !text-black"
              >
                {isUpdatingPassword ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Key className="mr-2 h-4 w-4" />
                    Update Password
                  </>
                )}
              </Button>
            </motion.form>
          )}

          {/* 2FA */}
          <div
            className={cn(
              'flex items-center justify-between rounded-xl border p-4',
              twoFactorEnabled
                ? 'border-success/30 bg-success/5'
                : 'bg-surface/30 border-neutral-200/10'
            )}
          >
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-lg',
                  twoFactorEnabled ? 'bg-success' : 'bg-neutral-300'
                )}
              >
                <Smartphone
                  className={cn('h-5 w-5', twoFactorEnabled ? 'text-white' : 'text-text-disabled')}
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-body text-foreground font-medium">Two-Factor Authentication</p>
                  {twoFactorEnabled && <CheckCircle2 className="text-success h-4 w-4" />}
                </div>
                <p className="text-caption text-text-secondary">
                  {twoFactorEnabled ? 'Enabled' : 'Not enabled'}
                </p>
              </div>
            </div>
            <Button
              variant={twoFactorEnabled ? 'ghost' : 'secondary'}
              size="medium"
              onClick={() => setTwoFactorEnabled(!twoFactorEnabled)}
            >
              {twoFactorEnabled ? 'Disable' : 'Enable'}
            </Button>
          </div>

          {/* Sessions Link */}
          <Button variant="ghost" size="medium" className="w-full">
            View Active Sessions
          </Button>
        </div>
      </GlassCard>
    </motion.div>
  );
}
