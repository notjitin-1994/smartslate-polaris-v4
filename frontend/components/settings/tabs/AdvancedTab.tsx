'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, FileJson, FileText, AlertTriangle, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { GlassCard } from '@/components/ui/GlassCard';
import { useRouter } from 'next/navigation';
import { toast } from '@/lib/utils/toast';
import { cn } from '@/lib/utils';

/**
 * AdvancedTab - Data export and account deletion
 * Contains potentially destructive actions with appropriate warnings
 */
export function AdvancedTab() {
  const router = useRouter();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleExportData = async (format: 'json' | 'csv') => {
    setIsExporting(true);
    try {
      const response = await fetch(`/api/account/export?format=${format}`);

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `smartslate-data-${Date.now()}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Export Complete', `Your data has been exported as ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Export Failed', 'Could not export your data. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      toast.error('Confirmation Required', 'Please type DELETE to confirm');
      return;
    }

    setIsDeletingAccount(true);

    try {
      const response = await fetch('/api/account/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmationText: deleteConfirmText }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete account');
      }

      toast.success('Account Deleted', 'Your account has been permanently deleted');

      // Redirect to homepage after a brief delay
      setTimeout(() => {
        router.push('/');
      }, 2000);
    } catch (error) {
      console.error('Failed to delete account:', error);
      toast.error(
        'Deletion Failed',
        error instanceof Error ? error.message : 'Could not delete account'
      );
      setIsDeletingAccount(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Data Export Card */}
      <GlassCard className="p-6 sm:p-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="bg-primary/20 flex h-10 w-10 items-center justify-center rounded-xl">
            <Download className="text-primary h-5 w-5" />
          </div>
          <div>
            <h3 className="text-heading text-foreground font-semibold">Data & Privacy</h3>
            <p className="text-caption text-text-secondary">Export your personal data</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-surface/30 rounded-xl border border-neutral-200/10 p-4">
            <div className="mb-4">
              <h4 className="text-body text-foreground mb-2 font-medium">Export Your Data</h4>
              <p className="text-caption text-text-secondary">
                Download a copy of your profile, blueprints, and activity history. Choose your
                preferred format below.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                variant="secondary"
                size="medium"
                onClick={() => handleExportData('json')}
                disabled={isExporting}
              >
                <FileJson className="mr-2 h-4 w-4" />
                Export as JSON
              </Button>
              <Button
                variant="secondary"
                size="medium"
                onClick={() => handleExportData('csv')}
                disabled={isExporting}
              >
                <FileText className="mr-2 h-4 w-4" />
                Export as CSV
              </Button>
            </div>

            {isExporting && (
              <div className="text-caption text-text-secondary mt-3 flex items-center gap-2">
                <div className="border-primary h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" />
                <span>Preparing your export...</span>
              </div>
            )}
          </div>

          <div className="border-info/20 bg-info/10 rounded-lg border p-3">
            <p className="text-caption text-text-secondary">
              Your data export includes all personal information, blueprints, and usage history.
              This process may take a few moments for large accounts.
            </p>
          </div>
        </div>
      </GlassCard>

      {/* Danger Zone Card */}
      <GlassCard className="border-error/30 bg-error/5 p-6 sm:p-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="bg-error/20 flex h-10 w-10 items-center justify-center rounded-xl">
            <AlertTriangle className="text-error h-5 w-5" />
          </div>
          <div>
            <h3 className="text-heading text-error font-semibold">Danger Zone</h3>
            <p className="text-caption text-text-secondary">
              Irreversible actions that permanently affect your account
            </p>
          </div>
        </div>

        <div className="border-error/30 bg-error/10 rounded-xl border-2 p-6">
          <div className="mb-4">
            <h4 className="text-body text-error mb-2 font-semibold">Delete Account</h4>
            <p className="text-caption text-text-secondary mb-3">
              Once you delete your account, there is no going back. This will permanently delete:
            </p>
            <ul className="text-caption text-text-secondary mb-4 list-inside list-disc space-y-1.5">
              <li>Your profile and personal information</li>
              <li>All your blueprints and starmaps</li>
              <li>Your subscription and billing information</li>
              <li>All saved preferences and settings</li>
            </ul>
          </div>

          {!showDeleteConfirm ? (
            <Button variant="destructive" size="medium" onClick={() => setShowDeleteConfirm(true)}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete My Account
            </Button>
          ) : (
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4"
              >
                <div className="border-error/30 bg-error/20 rounded-lg border p-4">
                  <div className="mb-3 flex items-start gap-2">
                    <AlertTriangle className="text-error h-5 w-5 flex-shrink-0" />
                    <div>
                      <p className="text-body text-error mb-1 font-semibold">
                        Are you absolutely sure?
                      </p>
                      <p className="text-caption text-text-secondary mb-3">
                        This action is PERMANENT and CANNOT be undone. Type{' '}
                        <span className="text-foreground font-mono font-semibold">DELETE</span> to
                        confirm.
                      </p>
                    </div>
                  </div>

                  <Input
                    type="text"
                    placeholder="Type DELETE to confirm"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    disabled={isDeletingAccount}
                    size="medium"
                    className={cn(
                      'font-mono',
                      deleteConfirmText && deleteConfirmText !== 'DELETE' && 'border-error'
                    )}
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="destructive"
                    size="medium"
                    onClick={handleDeleteAccount}
                    disabled={deleteConfirmText !== 'DELETE' || isDeletingAccount}
                  >
                    {isDeletingAccount ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Confirm Deletion
                      </>
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="medium"
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setDeleteConfirmText('');
                    }}
                    disabled={isDeletingAccount}
                  >
                    <X className="mr-2 h-4 w-4" />
                    Cancel
                  </Button>
                </div>
              </motion.div>
            </AnimatePresence>
          )}
        </div>

        <div className="border-warning/20 bg-warning/10 mt-4 rounded-lg border p-3">
          <p className="text-caption text-text-secondary">
            Need help or having issues? Contact our support team before deleting your account. We
            may be able to help resolve your concerns.
          </p>
        </div>
      </GlassCard>
    </motion.div>
  );
}
