'use client';

export const dynamic = 'force-dynamic';
import { motion } from 'framer-motion';
import { Settings as SettingsIcon, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { SettingsTabs } from '@/components/settings/SettingsTabs';
import { cn } from '@/lib/utils';

/**
 * SettingsPage - Revamped settings interface with tabbed navigation
 * Minimalist design focusing on essential functionality
 * Organizes settings into 4 logical tabs: Profile, Account, Preferences, Advanced
 */
function SettingsContent() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-6 pb-20 sm:px-6 lg:px-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        {/* Back Navigation */}
        <Link
          href="/"
          className={cn(
            'mb-4 inline-flex items-center gap-2',
            'text-text-secondary hover:text-primary',
            'transition-colors duration-200',
            'text-caption font-medium',
            'focus-visible:ring-primary focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
            'rounded-lg px-2 py-1'
          )}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        {/* Page Title */}
        <div className="mb-2 flex items-center gap-4">
          <div className="from-primary/20 to-secondary/20 border-primary/30 flex h-12 w-12 items-center justify-center rounded-xl border bg-gradient-to-br">
            <SettingsIcon className="text-primary h-6 w-6" />
          </div>
          <div>
            <h1 className="text-display text-foreground font-bold">Settings</h1>
            <p className="text-body text-text-secondary mt-1">
              Manage your account and preferences
            </p>
          </div>
        </div>
      </motion.div>

      {/* Tabbed Settings Interface */}
      <motion.main
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <SettingsTabs />
      </motion.main>
    </div>
  );
}

/**
 * SettingsPage - Protected settings route
 */
export default function SettingsPage() {
  return (
    <ProtectedRoute>
      <SettingsContent />
    </ProtectedRoute>
  );
}
