'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings, Moon, Sun, Monitor, Bell, Volume2, Globe, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/ui/GlassCard';

export function PreferencesSection() {
  const [preferences, setPreferences] = useState({
    theme: 'dark' as 'light' | 'dark' | 'system',
    language: 'en',
    timezone: 'America/Los_Angeles',
    notifications: {
      email: true,
      push: true,
      blueprintComplete: true,
      weeklyReport: false,
      marketing: false,
    },
    display: {
      compactMode: false,
      showAnimations: true,
      highContrast: false,
    },
  });

  const handlePreferenceChange = (category: string, key: string, value: any) => {
    setPreferences((prev) => {
      if (category === 'notifications' && typeof prev.notifications === 'object') {
        return {
          ...prev,
          notifications: {
            ...prev.notifications,
            [key]: value,
          },
        };
      }
      if (category === 'display' && typeof prev.display === 'object') {
        return {
          ...prev,
          display: {
            ...prev.display,
            [key]: value,
          },
        };
      }
      return prev;
    });
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="bg-primary/20 flex h-10 w-10 items-center justify-center rounded-xl">
          <Settings className="text-primary h-5 w-5" />
        </div>
        <div>
          <h2 className="text-title text-foreground">Preferences</h2>
          <p className="text-caption text-text-secondary">
            Customize your experience and notification settings
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Appearance */}
        <GlassCard className="p-6">
          <h3 className="text-heading text-foreground mb-6">Appearance</h3>

          <div className="space-y-6">
            {/* Theme Selection */}
            <div className="space-y-4">
              <label className="text-body text-foreground block font-medium">Theme</label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: 'light', label: 'Light', icon: Sun },
                  { value: 'dark', label: 'Dark', icon: Moon },
                  { value: 'system', label: 'System', icon: Monitor },
                ].map((theme) => {
                  const Icon = theme.icon;
                  const isSelected = preferences.theme === theme.value;

                  return (
                    <button
                      key={theme.value}
                      onClick={() =>
                        setPreferences((prev) => ({ ...prev, theme: theme.value as any }))
                      }
                      className={`rounded-lg border p-4 transition-all duration-200 ${
                        isSelected
                          ? 'border-primary bg-primary/10'
                          : 'hover:border-primary/50 border-neutral-300'
                      }`}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <Icon
                          className={`h-5 w-5 ${isSelected ? 'text-primary' : 'text-text-secondary'}`}
                        />
                        <span
                          className={`text-caption ${isSelected ? 'text-foreground' : 'text-text-secondary'}`}
                        >
                          {theme.label}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Display Options */}
            <div className="space-y-4">
              <label className="text-body text-foreground block font-medium">Display Options</label>

              <div className="space-y-3">
                <label className="flex items-center justify-between">
                  <span className="text-body text-foreground">Compact Mode</span>
                  <input
                    type="checkbox"
                    checked={preferences.display.compactMode}
                    onChange={(e) =>
                      handlePreferenceChange('display', 'compactMode', e.target.checked)
                    }
                    className="text-primary focus:ring-secondary/50 rounded border-neutral-300"
                  />
                </label>

                <label className="flex items-center justify-between">
                  <span className="text-body text-foreground">Show Animations</span>
                  <input
                    type="checkbox"
                    checked={preferences.display.showAnimations}
                    onChange={(e) =>
                      handlePreferenceChange('display', 'showAnimations', e.target.checked)
                    }
                    className="text-primary focus:ring-secondary/50 rounded border-neutral-300"
                  />
                </label>

                <label className="flex items-center justify-between">
                  <span className="text-body text-foreground">High Contrast</span>
                  <input
                    type="checkbox"
                    checked={preferences.display.highContrast}
                    onChange={(e) =>
                      handlePreferenceChange('display', 'highContrast', e.target.checked)
                    }
                    className="text-primary focus:ring-secondary/50 rounded border-neutral-300"
                  />
                </label>
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Notifications */}
        <GlassCard className="p-6">
          <h3 className="text-heading text-foreground mb-6">Notifications</h3>

          <div className="space-y-6">
            {/* Email Notifications */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Bell className="text-primary h-5 w-5" />
                <div>
                  <p className="text-body text-foreground font-medium">Email Notifications</p>
                  <p className="text-caption text-text-secondary">
                    Receive notifications via email
                  </p>
                </div>
              </div>

              <div className="ml-8 space-y-3">
                <label className="flex items-center justify-between">
                  <span className="text-body text-foreground">Blueprint Complete</span>
                  <input
                    type="checkbox"
                    checked={preferences.notifications.blueprintComplete}
                    onChange={(e) =>
                      handlePreferenceChange('notifications', 'blueprintComplete', e.target.checked)
                    }
                    className="text-primary focus:ring-secondary/50 rounded border-neutral-300"
                  />
                </label>

                <label className="flex items-center justify-between">
                  <span className="text-body text-foreground">Weekly Report</span>
                  <input
                    type="checkbox"
                    checked={preferences.notifications.weeklyReport}
                    onChange={(e) =>
                      handlePreferenceChange('notifications', 'weeklyReport', e.target.checked)
                    }
                    className="text-primary focus:ring-secondary/50 rounded border-neutral-300"
                  />
                </label>

                <label className="flex items-center justify-between">
                  <span className="text-body text-foreground">Marketing Updates</span>
                  <input
                    type="checkbox"
                    checked={preferences.notifications.marketing}
                    onChange={(e) =>
                      handlePreferenceChange('notifications', 'marketing', e.target.checked)
                    }
                    className="text-primary focus:ring-secondary/50 rounded border-neutral-300"
                  />
                </label>
              </div>
            </div>

            {/* Push Notifications */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Volume2 className="text-primary h-5 w-5" />
                <div>
                  <p className="text-body text-foreground font-medium">Push Notifications</p>
                  <p className="text-caption text-text-secondary">Receive browser notifications</p>
                </div>
              </div>

              <div className="ml-8">
                <label className="flex items-center justify-between">
                  <span className="text-body text-foreground">Enable Push Notifications</span>
                  <input
                    type="checkbox"
                    checked={preferences.notifications.push}
                    onChange={(e) =>
                      handlePreferenceChange('notifications', 'push', e.target.checked)
                    }
                    className="text-primary focus:ring-secondary/50 rounded border-neutral-300"
                  />
                </label>
              </div>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Language & Region */}
      <GlassCard className="p-6">
        <h3 className="text-heading text-foreground mb-6">Language & Region</h3>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-body text-foreground block font-medium">Language</label>
            <select
              value={preferences.language}
              onChange={(e) => setPreferences((prev) => ({ ...prev, language: e.target.value }))}
              className="bg-background text-foreground focus:ring-secondary/50 focus:border-secondary w-full rounded-lg border border-neutral-300 px-4 py-3 focus:ring-2"
            >
              <option value="en">English</option>
              <option value="es">Español</option>
              <option value="fr">Français</option>
              <option value="de">Deutsch</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-body text-foreground block font-medium">Timezone</label>
            <select
              value={preferences.timezone}
              onChange={(e) => setPreferences((prev) => ({ ...prev, timezone: e.target.value }))}
              className="bg-background text-foreground focus:ring-secondary/50 focus:border-secondary w-full rounded-lg border border-neutral-300 px-4 py-3 focus:ring-2"
            >
              <option value="America/Los_Angeles">Pacific Time (PT)</option>
              <option value="America/Denver">Mountain Time (MT)</option>
              <option value="America/Chicago">Central Time (CT)</option>
              <option value="America/New_York">Eastern Time (ET)</option>
              <option value="Europe/London">London (GMT)</option>
              <option value="Europe/Paris">Paris (CET)</option>
              <option value="Asia/Tokyo">Tokyo (JST)</option>
            </select>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}
