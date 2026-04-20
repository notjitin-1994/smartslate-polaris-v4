'use client';

import { useState } from 'react';
import { SettingCard, SettingRow } from './SettingCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Crown, Mail, AlertTriangle, Trash2, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

/**
 * AccountSettings - Account management and subscription
 * Includes email management, subscription details, and account deletion
 */
export function AccountSettings() {
  const [email, setEmail] = useState('user@example.com');
  const [isChangingEmail, setIsChangingEmail] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Mock subscription data - replace with real data from backend
  const subscriptionTier = 'free'; // or 'premium', 'enterprise'
  const blueprintsUsed = 0;
  const blueprintsLimit = 2;

  return (
    <section id="account" className="scroll-mt-24 space-y-6">
      {/* Email Management */}
      <SettingCard
        title="Email Address"
        description="Manage your account email and communication preferences"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="flex-1 space-y-2">
              <label htmlFor="email" className="text-body text-foreground font-medium">
                Primary Email
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={!isChangingEmail}
                size="large"
                className="w-full"
              />
            </div>
            <div className="pt-8">
              {!isChangingEmail ? (
                <Button variant="ghost" size="medium" onClick={() => setIsChangingEmail(true)}>
                  Change
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button variant="primary" size="medium" onClick={() => setIsChangingEmail(false)}>
                    Save
                  </Button>
                  <Button
                    variant="ghost"
                    size="medium"
                    onClick={() => {
                      setIsChangingEmail(false);
                      setEmail('user@example.com');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="bg-info/5 border-info/20 flex items-start gap-3 rounded-xl border p-4">
            <Mail className="text-info mt-0.5 h-5 w-5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-caption text-text-secondary">
                Changing your email will require verification. We'll send a confirmation link to
                your new address.
              </p>
            </div>
          </div>
        </div>
      </SettingCard>

      {/* Subscription */}
      <SettingCard
        title="Subscription & Billing"
        description="Manage your plan and billing information"
      >
        <div className="space-y-6">
          {/* Current Plan */}
          <div
            className={cn(
              'rounded-xl border-2 p-6',
              subscriptionTier === 'free'
                ? 'border-neutral-200/20 bg-neutral-100/5'
                : 'from-primary/10 to-secondary/10 border-primary/30 bg-gradient-to-br'
            )}
          >
            <div className="mb-4 flex items-start justify-between">
              <div className="flex items-center gap-3">
                {subscriptionTier !== 'free' && (
                  <div className="from-primary to-secondary flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br">
                    <Crown className="h-6 w-6 text-white" />
                  </div>
                )}
                <div>
                  <h4 className="text-heading text-foreground font-bold capitalize">
                    {subscriptionTier} Plan
                  </h4>
                  <p className="text-caption text-text-secondary">
                    {subscriptionTier === 'free'
                      ? 'Limited starmaps'
                      : 'Unlimited starmaps and premium features'}
                  </p>
                </div>
              </div>

              {subscriptionTier === 'free' && (
                <Link href="/pricing">
                  <Button variant="primary" size="medium">
                    <Crown className="mr-2 h-4 w-4" />
                    Upgrade
                  </Button>
                </Link>
              )}
            </div>

            {/* Usage Stats */}
            <div className="space-y-3">
              <div className="text-caption flex items-center justify-between">
                <span className="text-text-secondary">Starmaps Used</span>
                <span className="text-foreground font-semibold">
                  {blueprintsUsed} / {subscriptionTier === 'free' ? blueprintsLimit : '∞'}
                </span>
              </div>

              {subscriptionTier === 'free' && (
                <div className="relative h-2 overflow-hidden rounded-full bg-neutral-200">
                  <div
                    className="from-primary to-primary-accent-light absolute top-0 left-0 h-full rounded-full bg-gradient-to-r transition-all duration-500"
                    style={{ width: `${(blueprintsUsed / blueprintsLimit) * 100}%` }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Billing Actions */}
          {subscriptionTier !== 'free' && (
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button variant="outline" size="medium" className="flex-1">
                <ExternalLink className="mr-2 h-4 w-4" />
                Manage Billing
              </Button>
              <Button variant="ghost" size="medium" className="flex-1">
                View Invoices
              </Button>
            </div>
          )}

          {subscriptionTier === 'free' && (
            <div className="from-primary/10 to-secondary/10 border-primary/20 rounded-xl border bg-gradient-to-r p-4">
              <div className="flex items-start gap-3">
                <Crown className="text-primary mt-0.5 h-5 w-5 flex-shrink-0" />
                <div className="flex-1">
                  <h5 className="text-body text-foreground mb-1 font-semibold">
                    Unlock Premium Features
                  </h5>
                  <p className="text-caption text-text-secondary mb-3">
                    Get unlimited starmaps, advanced analytics, priority support, and more.
                  </p>
                  <Link href="/pricing">
                    <Button variant="primary" size="medium">
                      View Plans
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </SettingCard>

      {/* Danger Zone */}
      <SettingCard title="Danger Zone" description="Irreversible actions that affect your account">
        <div className={cn('border-error/30 bg-error/5 rounded-xl border-2 p-6', 'space-y-4')}>
          <div className="flex items-start gap-3">
            <AlertTriangle className="text-error mt-0.5 h-6 w-6 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="text-body text-error mb-2 font-semibold">Delete Account</h4>
              <p className="text-caption text-text-secondary mb-4">
                Once you delete your account, there is no going back. This will permanently delete
                all your starmaps, data, and settings. This action cannot be undone.
              </p>

              {!showDeleteConfirm ? (
                <Button
                  variant="destructive"
                  size="medium"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete My Account
                </Button>
              ) : (
                <div className="space-y-3">
                  <div className="bg-error/10 border-error/30 rounded-lg border p-4">
                    <p className="text-body text-error mb-2 font-semibold">
                      Are you absolutely sure?
                    </p>
                    <p className="text-caption text-text-secondary">
                      Type <span className="text-foreground font-mono font-semibold">DELETE</span>{' '}
                      to confirm
                    </p>
                    <Input
                      type="text"
                      placeholder="Type DELETE to confirm"
                      size="medium"
                      className="mt-3"
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button variant="destructive" size="medium" disabled>
                      Confirm Deletion
                    </Button>
                    <Button
                      variant="ghost"
                      size="medium"
                      onClick={() => setShowDeleteConfirm(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </SettingCard>
    </section>
  );
}
