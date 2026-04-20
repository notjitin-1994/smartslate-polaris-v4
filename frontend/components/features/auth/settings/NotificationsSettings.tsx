'use client';

import { useState } from 'react';
import { SettingCard, SettingRow } from './SettingCard';
import { Toggle } from './Toggle';
import { Bell, Mail, MessageSquare, Smartphone, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * NotificationsSettings - Notification preferences
 * Manage email, push, and in-app notification settings
 */
export function NotificationsSettings() {
  // Email notifications
  const [emailStarmapComplete, setEmailStarmapComplete] = useState(true);
  const [emailWeeklyDigest, setEmailWeeklyDigest] = useState(true);
  const [emailProductUpdates, setEmailProductUpdates] = useState(false);
  const [emailMarketing, setEmailMarketing] = useState(false);

  // Push notifications
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushStarmapComplete, setPushStarmapComplete] = useState(false);
  const [pushReminders, setPushReminders] = useState(false);

  // In-app notifications
  const [inAppMessages, setInAppMessages] = useState(true);
  const [inAppUpdates, setInAppUpdates] = useState(true);

  return (
    <section id="notifications" className="scroll-mt-24 space-y-6">
      {/* Email Notifications */}
      <SettingCard
        title="Email Notifications"
        description="Choose what updates you want to receive via email"
      >
        <SettingRow
          label="Starmap Completion"
          description="Get notified when your starmap generation is complete"
          badge={<CheckCircle2 className="h-3 w-3" />}
        >
          <Toggle
            checked={emailStarmapComplete}
            onCheckedChange={setEmailStarmapComplete}
            aria-label="Toggle starmap completion emails"
          />
        </SettingRow>

        <SettingRow
          label="Weekly Digest"
          description="A summary of your activity and insights every week"
        >
          <Toggle
            checked={emailWeeklyDigest}
            onCheckedChange={setEmailWeeklyDigest}
            aria-label="Toggle weekly digest emails"
          />
        </SettingRow>

        <SettingRow label="Product Updates" description="Learn about new features and improvements">
          <Toggle
            checked={emailProductUpdates}
            onCheckedChange={setEmailProductUpdates}
            aria-label="Toggle product update emails"
          />
        </SettingRow>

        <SettingRow
          label="Marketing & Promotions"
          description="Special offers, tips, and recommendations"
        >
          <Toggle
            checked={emailMarketing}
            onCheckedChange={setEmailMarketing}
            aria-label="Toggle marketing emails"
          />
        </SettingRow>

        <div className="mt-2 border-t border-neutral-200/10 pt-4">
          <div className="bg-info/5 border-info/20 flex items-start gap-3 rounded-xl border p-4">
            <Mail className="text-info mt-0.5 h-5 w-5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-caption text-text-secondary">
                Important account and security notifications will always be sent, regardless of your
                preferences.
              </p>
            </div>
          </div>
        </div>
      </SettingCard>

      {/* Push Notifications */}
      <SettingCard title="Push Notifications" description="Receive notifications on your device">
        {/* Master Toggle */}
        <div
          className={cn(
            'rounded-xl border-2 p-4 transition-all duration-200',
            pushEnabled
              ? 'bg-primary/5 border-primary/30'
              : 'border-neutral-200/10 bg-neutral-100/5'
          )}
        >
          <SettingRow
            label="Enable Push Notifications"
            description="Allow the app to send you push notifications"
            badge={
              pushEnabled ? (
                <span className="text-xs">Enabled</span>
              ) : (
                <span className="text-xs">Disabled</span>
              )
            }
          >
            <Toggle
              checked={pushEnabled}
              onCheckedChange={setPushEnabled}
              aria-label="Toggle push notifications"
            />
          </SettingRow>
        </div>

        {/* Individual Push Settings */}
        <div className={cn('space-y-0', !pushEnabled && 'pointer-events-none opacity-40')}>
          <SettingRow
            label="Starmap Completion"
            description="Get a push notification when your starmap is ready"
          >
            <Toggle
              checked={pushStarmapComplete}
              onCheckedChange={setPushStarmapComplete}
              disabled={!pushEnabled}
              aria-label="Toggle starmap completion push notifications"
            />
          </SettingRow>

          <SettingRow
            label="Reminders"
            description="Helpful reminders to continue your learning journey"
          >
            <Toggle
              checked={pushReminders}
              onCheckedChange={setPushReminders}
              disabled={!pushEnabled}
              aria-label="Toggle reminder push notifications"
            />
          </SettingRow>
        </div>

        {!pushEnabled && (
          <div className="mt-2 border-t border-neutral-200/10 pt-4">
            <div className="bg-warning/5 border-warning/20 flex items-start gap-3 rounded-xl border p-4">
              <Smartphone className="text-warning mt-0.5 h-5 w-5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-caption text-text-secondary">
                  Push notifications are currently disabled. Enable them to receive real-time
                  updates on your device.
                </p>
              </div>
            </div>
          </div>
        )}
      </SettingCard>

      {/* In-App Notifications */}
      <SettingCard
        title="In-App Notifications"
        description="Control notifications you see while using the app"
      >
        <SettingRow
          label="Messages & Updates"
          description="Show notification badges and alerts within the app"
        >
          <Toggle
            checked={inAppMessages}
            onCheckedChange={setInAppMessages}
            aria-label="Toggle in-app messages"
          />
        </SettingRow>

        <SettingRow
          label="Feature Announcements"
          description="See announcements about new features and improvements"
        >
          <Toggle
            checked={inAppUpdates}
            onCheckedChange={setInAppUpdates}
            aria-label="Toggle in-app feature announcements"
          />
        </SettingRow>

        <div className="mt-2 border-t border-neutral-200/10 pt-4">
          <div className="bg-success/5 border-success/20 flex items-start gap-3 rounded-xl border p-4">
            <Bell className="text-success mt-0.5 h-5 w-5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-caption text-text-secondary">
                In-app notifications help you stay informed without leaving the application. They
                won't interrupt your workflow.
              </p>
            </div>
          </div>
        </div>
      </SettingCard>
    </section>
  );
}
