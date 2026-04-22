'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Monitor, Moon, Sun, Globe, Bell, Zap } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Toggle } from '../Toggle';
import { cn } from '@/lib/utils';

type Theme = 'light' | 'dark' | 'system';
type Language = 'en' | 'es' | 'fr' | 'de' | 'ja';

/**
 * PreferencesTab - Appearance, language, notifications, and performance settings
 * Consolidates all user preferences into organized sections
 */
export function PreferencesTab() {
  // Appearance
  const [theme, setTheme] = useState<Theme>('dark');

  // Language
  const [language, setLanguage] = useState<Language>('en');

  // Notifications
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [starmapCompletion, setStarmapCompletion] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(true);
  const [marketingEmails, setMarketingEmails] = useState(false);

  // Performance
  const [reducedMotion, setReducedMotion] = useState(false);
  const [autoSave, setAutoSave] = useState(true);

  const themeOptions: Array<{ value: Theme; label: string; icon: typeof Sun }> = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor },
  ];

  const languageOptions: Array<{ value: Language; label: string; flag: string }> = [
    { value: 'en', label: 'English', flag: '🇺🇸' },
    { value: 'es', label: 'Español', flag: '🇪🇸' },
    { value: 'fr', label: 'Français', flag: '🇫🇷' },
    { value: 'de', label: 'Deutsch', flag: '🇩🇪' },
    { value: 'ja', label: '日本語', flag: '🇯🇵' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Appearance Card */}
      <GlassCard className="p-6 sm:p-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="bg-primary/20 flex h-10 w-10 items-center justify-center rounded-xl">
            <Monitor className="text-primary h-5 w-5" />
          </div>
          <div>
            <h3 className="text-heading text-foreground font-semibold">Appearance</h3>
            <p className="text-caption text-text-secondary">Choose your preferred theme</p>
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-body text-foreground font-medium">Theme</label>
          <div className="grid grid-cols-3 gap-3">
            {themeOptions.map((option) => {
              const Icon = option.icon;
              const isSelected = theme === option.value;

              return (
                <button
                  key={option.value}
                  onClick={() => setTheme(option.value)}
                  type="button"
                  className={cn(
                    'relative flex min-h-[48px] flex-col items-center gap-2 rounded-xl p-4',
                    'border-2 transition-all duration-200',
                    'hover:border-primary/30 hover:bg-primary/5',
                    'focus-visible:ring-primary focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
                    isSelected
                      ? 'border-primary bg-primary/10 shadow-sm'
                      : 'bg-surface border-neutral-200/10'
                  )}
                >
                  <Icon
                    className={cn(
                      'h-5 w-5 transition-colors',
                      isSelected ? 'text-primary' : 'text-text-secondary'
                    )}
                  />
                  <span
                    className={cn(
                      'text-caption font-medium transition-colors',
                      isSelected ? 'text-foreground' : 'text-text-secondary'
                    )}
                  >
                    {option.label}
                  </span>
                  {isSelected && (
                    <div className="bg-primary absolute top-2 right-2 h-2 w-2 animate-pulse rounded-full" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </GlassCard>

      {/* Language Card */}
      <GlassCard className="p-6 sm:p-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="bg-primary/20 flex h-10 w-10 items-center justify-center rounded-xl">
            <Globe className="text-primary h-5 w-5" />
          </div>
          <div>
            <h3 className="text-heading text-foreground font-semibold">Language & Region</h3>
            <p className="text-caption text-text-secondary">Select your preferred language</p>
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="language" className="text-body text-foreground font-medium">
            Display Language
          </label>
          <div className="relative">
            <Globe className="text-text-disabled pointer-events-none absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2" />
            <select
              id="language"
              value={language}
              onChange={(e) => setLanguage(e.target.value as Language)}
              className={cn(
                'bg-background-surface min-h-[48px] w-full appearance-none rounded-lg border border-neutral-200/10 py-3 pr-10 pl-12',
                'text-body text-foreground cursor-pointer',
                'hover:border-primary/20 focus-visible:ring-primary focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
                'transition-colors duration-200'
              )}
            >
              {languageOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.flag} {option.label}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2">
              <svg
                className="text-text-disabled h-5 w-5"
                fill="none"
                strokeWidth="2"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Notifications Card */}
      <GlassCard className="p-6 sm:p-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="bg-primary/20 flex h-10 w-10 items-center justify-center rounded-xl">
            <Bell className="text-primary h-5 w-5" />
          </div>
          <div>
            <h3 className="text-heading text-foreground font-semibold">Notifications</h3>
            <p className="text-caption text-text-secondary">
              Manage email notification preferences
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Master Toggle */}
          <div
            className={cn(
              'flex items-center justify-between rounded-xl border-2 p-4 transition-all',
              emailNotifications
                ? 'border-primary/30 bg-primary/5'
                : 'bg-surface/30 border-neutral-200/10'
            )}
          >
            <div>
              <p className="text-body text-foreground font-medium">Email notifications</p>
              <p className="text-caption text-text-secondary">Receive updates via email</p>
            </div>
            <Toggle
              checked={emailNotifications}
              onCheckedChange={setEmailNotifications}
              aria-label="Toggle email notifications"
            />
          </div>

          {/* Individual Notification Settings */}
          <div className={cn('space-y-3', !emailNotifications && 'pointer-events-none opacity-40')}>
            <div className="bg-surface/30 flex items-center justify-between rounded-lg border border-neutral-200/10 p-3">
              <div>
                <p className="text-body text-foreground font-medium">Starmap completion</p>
                <p className="text-caption text-text-secondary">When your blueprint is ready</p>
              </div>
              <Toggle
                checked={starmapCompletion}
                onCheckedChange={setStarmapCompletion}
                disabled={!emailNotifications}
                aria-label="Toggle starmap completion notifications"
              />
            </div>

            <div className="bg-surface/30 flex items-center justify-between rounded-lg border border-neutral-200/10 p-3">
              <div>
                <p className="text-body text-foreground font-medium">Weekly digest</p>
                <p className="text-caption text-text-secondary">Activity summary every week</p>
              </div>
              <Toggle
                checked={weeklyDigest}
                onCheckedChange={setWeeklyDigest}
                disabled={!emailNotifications}
                aria-label="Toggle weekly digest"
              />
            </div>

            <div className="bg-surface/30 flex items-center justify-between rounded-lg border border-neutral-200/10 p-3">
              <div>
                <p className="text-body text-foreground font-medium">Marketing emails</p>
                <p className="text-caption text-text-secondary">Tips and promotions</p>
              </div>
              <Toggle
                checked={marketingEmails}
                onCheckedChange={setMarketingEmails}
                disabled={!emailNotifications}
                aria-label="Toggle marketing emails"
              />
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Performance Card */}
      <GlassCard className="p-6 sm:p-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="bg-primary/20 flex h-10 w-10 items-center justify-center rounded-xl">
            <Zap className="text-primary h-5 w-5" />
          </div>
          <div>
            <h3 className="text-heading text-foreground font-semibold">Performance</h3>
            <p className="text-caption text-text-secondary">Optimize your experience</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="bg-surface/30 flex items-center justify-between rounded-lg border border-neutral-200/10 p-3">
            <div>
              <p className="text-body text-foreground font-medium">Reduce motion</p>
              <p className="text-caption text-text-secondary">Minimize animations</p>
            </div>
            <Toggle
              checked={reducedMotion}
              onCheckedChange={setReducedMotion}
              aria-label="Toggle reduced motion"
            />
          </div>

          <div className="bg-surface/30 flex items-center justify-between rounded-lg border border-neutral-200/10 p-3">
            <div>
              <p className="text-body text-foreground font-medium">Auto-save</p>
              <p className="text-caption text-text-secondary">Save work automatically</p>
            </div>
            <Toggle
              checked={autoSave}
              onCheckedChange={setAutoSave}
              aria-label="Toggle auto-save"
            />
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}
