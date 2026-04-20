'use client';

import { useState } from 'react';
import { SettingCard, SettingRow } from './SettingCard';
import { Toggle } from './Toggle';
import { Monitor, Moon, Sun, Globe, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

type Theme = 'light' | 'dark' | 'system';
type Language = 'en' | 'es' | 'fr' | 'de' | 'ja';

/**
 * PreferencesSettings - User preferences and display settings
 * Includes theme selection, language, and UI customization options
 */
export function PreferencesSettings() {
  const [theme, setTheme] = useState<Theme>('dark');
  const [language, setLanguage] = useState<Language>('en');
  const [reducedMotion, setReducedMotion] = useState(false);
  const [compactMode, setCompactMode] = useState(false);
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
    <section id="preferences" className="scroll-mt-24 space-y-6">
      {/* Appearance */}
      <SettingCard title="Appearance" description="Customize how the application looks and feels">
        <div className="space-y-6">
          {/* Theme Selection */}
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
                    className={cn(
                      'relative flex flex-col items-center gap-3 rounded-xl p-4',
                      'border-2 transition-all duration-200',
                      'hover:border-primary/30 hover:bg-primary/5',
                      'focus-visible:ring-primary focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
                      'min-h-[44px]',
                      isSelected
                        ? 'border-primary bg-primary/10 shadow-sm'
                        : 'bg-surface border-neutral-200/10'
                    )}
                    type="button"
                  >
                    <Icon
                      className={cn(
                        'h-6 w-6 transition-colors',
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

                    {/* Selected indicator */}
                    {isSelected && (
                      <div className="bg-primary absolute top-2 right-2 h-2 w-2 animate-pulse rounded-full" />
                    )}
                  </button>
                );
              })}
            </div>
            <p className="text-caption text-text-secondary">
              Choose your preferred color scheme. System follows your device settings.
            </p>
          </div>
        </div>
      </SettingCard>

      {/* Language & Region */}
      <SettingCard
        title="Language & Region"
        description="Set your preferred language and regional settings"
      >
        <div className="space-y-3">
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
                'w-full rounded-lg py-3 pr-4 pl-12',
                'bg-background-surface border border-neutral-200/10',
                'text-body text-foreground',
                'hover:border-primary/20',
                'focus-visible:ring-primary focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
                'transition-colors duration-200',
                'cursor-pointer',
                'appearance-none',
                'min-h-[48px]'
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
          <p className="text-caption text-text-secondary">
            Interface language will be updated immediately
          </p>
        </div>
      </SettingCard>

      {/* Accessibility & Display */}
      <SettingCard
        title="Accessibility & Display"
        description="Adjust settings to improve your experience"
      >
        <SettingRow
          label="Reduced Motion"
          description="Minimize animations and transitions throughout the interface"
        >
          <Toggle
            checked={reducedMotion}
            onCheckedChange={setReducedMotion}
            aria-label="Toggle reduced motion"
          />
        </SettingRow>

        <SettingRow
          label="Compact Mode"
          description="Display more content by reducing spacing and element sizes"
        >
          <Toggle
            checked={compactMode}
            onCheckedChange={setCompactMode}
            aria-label="Toggle compact mode"
          />
        </SettingRow>
      </SettingCard>

      {/* Behavior */}
      <SettingCard title="Behavior" description="Control how the application behaves">
        <SettingRow
          label="Auto-save"
          description="Automatically save your work as you make changes"
          badge={<Zap className="h-3 w-3" />}
        >
          <Toggle checked={autoSave} onCheckedChange={setAutoSave} aria-label="Toggle auto-save" />
        </SettingRow>
      </SettingCard>
    </section>
  );
}
