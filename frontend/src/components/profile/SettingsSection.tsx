'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown,
  ChevronUp,
  Bell,
  Shield,
  Download,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { cn } from '@/lib/utils';
import { ExportDataModal } from './ExportDataModal';
import { DeleteAccountModal } from './DeleteAccountModal';
import { NotificationPreferencesSection } from './NotificationPreferencesSection';

/**
 * SettingsSection - Collapsible settings panel (progressive disclosure)
 * Features:
 * - Collapsed by default to reduce clutter
 * - Integrates notification preferences
 * - Privacy controls (export data, delete account)
 * - Smooth expand/collapse animation
 */
export function SettingsSection() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.5 }}
    >
      <GlassCard className="overflow-hidden p-0">
        {/* Collapsible Header */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={cn(
            'flex w-full items-center justify-between p-6',
            'hover:bg-background-surface transition-colors duration-200',
            'focus-visible:ring-primary-accent focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-inset'
          )}
          aria-expanded={isExpanded}
          aria-controls="settings-content"
        >
          <div className="flex items-center gap-3">
            <Shield className="text-primary-accent h-5 w-5" />
            <div className="text-left">
              <h2 className="text-heading text-text-primary font-semibold">Settings & Privacy</h2>
              <p className="text-caption text-text-secondary">
                Notifications, data export, and account controls
              </p>
            </div>
          </div>
          {isExpanded ? (
            <ChevronUp className="text-text-secondary h-5 w-5 transition-transform" />
          ) : (
            <ChevronDown className="text-text-secondary h-5 w-5 transition-transform" />
          )}
        </button>

        {/* Expandable Content */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              id="settings-content"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div className="border-background-surface space-y-6 border-t p-6">
                {/* Notification Preferences */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                >
                  <div className="mb-4 flex items-center gap-2">
                    <Bell className="text-primary-accent h-5 w-5" />
                    <h3 className="text-body text-text-primary font-semibold">
                      Notification Preferences
                    </h3>
                  </div>
                  <NotificationPreferencesSection />
                </motion.div>

                {/* Privacy & Data Controls */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.2 }}
                  className="space-y-4"
                >
                  <div className="mb-4 flex items-center gap-2">
                    <Shield className="text-primary-accent h-5 w-5" />
                    <h3 className="text-body text-text-primary font-semibold">
                      Privacy & Data Control
                    </h3>
                  </div>

                  {/* Export Data */}
                  <div
                    className={cn(
                      'hover:bg-background-surface border-primary-accent/20 rounded-lg border p-4',
                      'transition-colors duration-200'
                    )}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <Download className="text-primary-accent h-4 w-4" />
                          <h4 className="text-body text-text-primary font-medium">
                            Export Your Data
                          </h4>
                        </div>
                        <p className="text-caption text-text-secondary">
                          Download a complete copy of your profile, blueprints, and activity logs in
                          JSON/CSV format.
                        </p>
                      </div>
                      <button
                        onClick={() => setIsExportModalOpen(true)}
                        className={cn(
                          'flex-shrink-0 rounded-lg px-4 py-2',
                          'bg-primary-accent text-caption font-medium text-white',
                          'hover:bg-primary-accent-dark hover:shadow-lg',
                          'transition-all duration-200',
                          'focus-visible:ring-primary-accent focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none'
                        )}
                      >
                        Export
                      </button>
                    </div>
                  </div>

                  {/* Delete Account (Danger Zone) */}
                  <div
                    className={cn(
                      'hover:bg-error/5 border-error/30 bg-error/5 rounded-lg border p-4',
                      'transition-colors duration-200'
                    )}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <Trash2 className="text-error h-4 w-4" />
                          <h4 className="text-body text-error font-medium">Delete Account</h4>
                        </div>
                        <p className="text-caption text-text-secondary">
                          Permanently delete your account and all data. This action cannot be
                          undone.
                        </p>
                        <div className="bg-warning/10 mt-2 flex items-center gap-1.5 rounded-md px-2 py-1">
                          <AlertTriangle className="text-warning h-3 w-3" />
                          <span className="text-small text-warning font-medium">
                            30-day grace period
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => setIsDeleteModalOpen(true)}
                        className={cn(
                          'flex-shrink-0 rounded-lg px-4 py-2',
                          'border-error/50 bg-error/10 text-error text-caption border font-medium',
                          'hover:bg-error/20 hover:border-error',
                          'transition-all duration-200',
                          'focus-visible:ring-error focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none'
                        )}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </GlassCard>

      {/* Modals */}
      <ExportDataModal isOpen={isExportModalOpen} onClose={() => setIsExportModalOpen(false)} />
      <DeleteAccountModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} />
    </motion.div>
  );
}
