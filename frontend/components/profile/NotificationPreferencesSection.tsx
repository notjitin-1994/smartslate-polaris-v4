'use client';

import { useState, useEffect } from 'react';
import { Bell, Mail, Activity, Shield, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface NotificationPreferences {
  email_notifications: boolean;
  push_notifications: boolean;
  blueprint_updates: boolean;
  activity_digest: boolean;
  marketing_emails: boolean;
  security_alerts: boolean;
}

/**
 * NotificationPreferencesSection - Minimalist notification toggles
 * Simplified from verbose cards to compact toggle switches
 * Features:
 * - Clean toggle switches
 * - Optimistic updates
 * - Grouped by category
 * - No verbose descriptions (kept minimal)
 */
export function NotificationPreferencesSection() {
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    email_notifications: true,
    push_notifications: false,
    blueprint_updates: true,
    activity_digest: true,
    marketing_emails: false,
    security_alerts: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch preferences on mount
  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/user/notification-preferences');

      if (!response.ok) {
        throw new Error('Failed to fetch notification preferences');
      }

      const data = await response.json();
      setPreferences(data);
    } catch (error) {
      console.error('Error fetching preferences:', error);
      setError(error instanceof Error ? error.message : 'Failed to load preferences');
    } finally {
      setLoading(false);
    }
  };

  const updatePreference = async (key: keyof NotificationPreferences, value: boolean) => {
    try {
      setSaving(true);

      // Optimistic update
      setPreferences((prev) => ({ ...prev, [key]: value }));

      const response = await fetch('/api/user/notification-preferences', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ [key]: value }),
      });

      if (!response.ok) {
        // Revert on error
        setPreferences((prev) => ({ ...prev, [key]: !value }));
        throw new Error('Failed to update preference');
      }

      toast.success('Preference updated');
    } catch (error) {
      console.error('Error updating preference:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update preference');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="text-primary-accent h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-error/5 border-error/20 rounded-lg border p-4">
        <div className="flex items-center gap-3">
          <AlertCircle className="text-error h-5 w-5" />
          <div>
            <h3 className="text-error text-body font-medium">Failed to load preferences</h3>
            <p className="text-text-secondary text-caption mt-1">{error}</p>
          </div>
        </div>
        <button
          onClick={fetchPreferences}
          className="border-error/50 text-error hover:bg-error/10 mt-3 rounded-lg border px-3 py-1 text-sm font-medium transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  const preferenceGroups = [
    {
      title: 'Communication',
      icon: Mail,
      preferences: [
        {
          key: 'email_notifications' as const,
          label: 'Email Notifications',
          icon: Mail,
        },
        {
          key: 'push_notifications' as const,
          label: 'Push Notifications',
          icon: Bell,
          disabled: true,
          comingSoon: true,
        },
      ],
    },
    {
      title: 'Content Updates',
      icon: Activity,
      preferences: [
        {
          key: 'blueprint_updates' as const,
          label: 'Blueprint Updates',
          icon: Activity,
        },
        {
          key: 'activity_digest' as const,
          label: 'Weekly Activity Digest',
          icon: Activity,
        },
      ],
    },
    {
      title: 'Security & Marketing',
      icon: Shield,
      preferences: [
        {
          key: 'security_alerts' as const,
          label: 'Security Alerts',
          icon: Shield,
          recommended: true,
        },
        {
          key: 'marketing_emails' as const,
          label: 'Marketing Emails',
          icon: Mail,
        },
      ],
    },
  ];

  return (
    <div className="space-y-4">
      {preferenceGroups.map((group, groupIndex) => (
        <div
          key={groupIndex}
          className="bg-background-surface border-primary-accent/10 rounded-lg border p-4"
        >
          {/* Group Header */}
          <div className="mb-3 flex items-center gap-2">
            <group.icon className="text-primary-accent h-4 w-4" />
            <h4 className="text-caption text-text-primary font-semibold">{group.title}</h4>
          </div>

          {/* Preferences */}
          <div className="space-y-2">
            {group.preferences.map((pref) => {
              const Icon = pref.icon;
              const isEnabled = preferences[pref.key];

              return (
                <div
                  key={pref.key}
                  className="hover:bg-background-paper flex items-center justify-between rounded-md px-3 py-2 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Icon className="text-text-secondary h-4 w-4" />
                    <span className="text-caption text-text-primary font-medium">{pref.label}</span>
                    {pref.recommended && (
                      <span className="bg-success/10 text-success rounded-full px-2 py-0.5 text-xs font-medium">
                        Recommended
                      </span>
                    )}
                    {pref.comingSoon && (
                      <span className="bg-text-disabled/10 text-text-disabled rounded-full px-2 py-0.5 text-xs font-medium">
                        Coming Soon
                      </span>
                    )}
                  </div>

                  {/* Toggle Switch */}
                  <button
                    onClick={() => updatePreference(pref.key, !isEnabled)}
                    disabled={saving || pref.disabled}
                    className={cn(
                      'relative h-5 w-9 flex-shrink-0 rounded-full transition-colors',
                      isEnabled
                        ? 'from-primary-accent to-primary-accent-light bg-gradient-to-r'
                        : 'bg-text-disabled/30',
                      pref.disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
                    )}
                    role="switch"
                    aria-checked={isEnabled}
                    aria-label={`Toggle ${pref.label}`}
                  >
                    <span
                      className={cn(
                        'absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-md transition-transform',
                        isEnabled ? 'translate-x-4' : 'translate-x-0.5'
                      )}
                    />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
