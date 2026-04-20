'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, Trash2, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type DeletionStep = 'warning' | 'confirmation' | 'processing' | 'success';

export function DeleteAccountModal({ isOpen, onClose }: DeleteAccountModalProps) {
  const router = useRouter();
  const [step, setStep] = useState<DeletionStep>('warning');
  const [confirmationText, setConfirmationText] = useState('');
  const [reason, setReason] = useState('');
  const [feedback, setFeedback] = useState('');
  const [scheduledDeletion, setScheduledDeletion] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const CONFIRMATION_PHRASE = 'DELETE MY ACCOUNT';

  const handleRequestDeletion = async () => {
    try {
      setStep('processing');
      setError(null);

      const response = await fetch('/api/user/account-deletion/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reason: reason || null,
          feedback: feedback ? { user_feedback: feedback } : {},
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to request account deletion');
      }

      setScheduledDeletion(data.deletion_request.scheduled_deletion_at);
      setStep('success');
      toast.success('Account deletion requested');
    } catch (error) {
      console.error('Account deletion request error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to request deletion';
      setError(errorMessage);
      toast.error(errorMessage);
      setStep('confirmation');
    }
  };

  const handleClose = () => {
    if (step !== 'processing') {
      onClose();
      // Reset state after modal closes
      setTimeout(() => {
        setStep('warning');
        setConfirmationText('');
        setReason('');
        setFeedback('');
        setScheduledDeletion(null);
        setError(null);
      }, 300);
    }
  };

  const handleSuccess = () => {
    onClose();
    // Redirect to home page after a brief delay
    setTimeout(() => {
      router.push('/');
      router.refresh();
    }, 500);
  };

  const isConfirmationValid = confirmationText === CONFIRMATION_PHRASE;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/95 via-slate-800/95 to-slate-900/95 shadow-2xl backdrop-blur-xl"
            >
              {/* Header */}
              <div className="relative border-b border-white/10 bg-gradient-to-r from-red-500/10 via-orange-500/10 to-red-500/10 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-red-500 to-orange-600 shadow-lg">
                      <AlertTriangle className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-white">Delete Account</h2>
                      <p className="text-sm text-slate-400">This action cannot be undone</p>
                    </div>
                  </div>
                  <button
                    onClick={handleClose}
                    disabled={step === 'processing'}
                    className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label="Close modal"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <AnimatePresence mode="wait">
                  {/* Step 1: Warning */}
                  {step === 'warning' && (
                    <motion.div
                      key="warning"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-4"
                    >
                      <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4">
                        <div className="flex items-start gap-3">
                          <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-400" />
                          <div className="flex-1">
                            <h3 className="font-semibold text-red-200">
                              Important: 30-Day Grace Period
                            </h3>
                            <p className="mt-2 text-sm text-red-200/80">
                              Your account will be scheduled for deletion in 30 days. During this
                              grace period, you can cancel the deletion request at any time by
                              logging in.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <h4 className="font-medium text-white">
                          The following data will be permanently deleted:
                        </h4>
                        <div className="grid gap-2">
                          {[
                            'Your user profile and account information',
                            'All learning blueprints and versions',
                            'Activity logs and usage history',
                            'Login history and active sessions',
                            'Notification preferences and settings',
                            'All personal data associated with your account',
                          ].map((item, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 p-3"
                            >
                              <div className="h-2 w-2 rounded-full bg-red-400" />
                              <span className="text-sm text-slate-300">{item}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
                        <p className="text-sm text-amber-200/90">
                          <strong className="font-medium">GDPR Compliance:</strong> This process
                          follows Article 17 (Right to Erasure). You can export your data before
                          deletion using the "Export Data" button on your profile page.
                        </p>
                      </div>
                    </motion.div>
                  )}

                  {/* Step 2: Confirmation */}
                  {step === 'confirmation' && (
                    <motion.div
                      key="confirmation"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-4"
                    >
                      {error && (
                        <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4">
                          <div className="flex items-start gap-3">
                            <AlertCircle className="mt-0.5 h-5 w-5 text-red-400" />
                            <p className="text-sm text-red-200">{error}</p>
                          </div>
                        </div>
                      )}

                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label htmlFor="reason" className="block text-sm font-medium text-white">
                            Reason for leaving (optional)
                          </label>
                          <select
                            id="reason"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder-slate-400 transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                          >
                            <option value="">Select a reason...</option>
                            <option value="not_useful">Not useful for my needs</option>
                            <option value="too_expensive">Too expensive</option>
                            <option value="found_alternative">Found a better alternative</option>
                            <option value="privacy_concerns">Privacy concerns</option>
                            <option value="technical_issues">Technical issues</option>
                            <option value="other">Other</option>
                          </select>
                        </div>

                        <div className="space-y-2">
                          <label
                            htmlFor="feedback"
                            className="block text-sm font-medium text-white"
                          >
                            Additional feedback (optional)
                          </label>
                          <textarea
                            id="feedback"
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                            rows={3}
                            placeholder="Help us improve by sharing your thoughts..."
                            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder-slate-400 transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                          />
                        </div>

                        <div className="space-y-2">
                          <label
                            htmlFor="confirmation"
                            className="block text-sm font-medium text-white"
                          >
                            Type{' '}
                            <code className="rounded bg-red-500/20 px-2 py-1 font-mono text-sm text-red-200">
                              {CONFIRMATION_PHRASE}
                            </code>{' '}
                            to confirm
                          </label>
                          <input
                            id="confirmation"
                            type="text"
                            value={confirmationText}
                            onChange={(e) => setConfirmationText(e.target.value)}
                            placeholder="Type confirmation phrase..."
                            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 font-mono text-white placeholder-slate-400 transition-colors focus:border-red-500 focus:ring-2 focus:ring-red-500/20 focus:outline-none"
                            autoComplete="off"
                          />
                          {confirmationText && !isConfirmationValid && (
                            <p className="text-xs text-red-400">
                              Confirmation phrase does not match. Please type exactly:{' '}
                              {CONFIRMATION_PHRASE}
                            </p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Step 3: Processing */}
                  {step === 'processing' && (
                    <motion.div
                      key="processing"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex flex-col items-center justify-center gap-4 py-12"
                    >
                      <Loader2 className="h-12 w-12 animate-spin text-red-400" />
                      <p className="text-sm font-medium text-slate-300">
                        Processing deletion request...
                      </p>
                    </motion.div>
                  )}

                  {/* Step 4: Success */}
                  {step === 'success' && (
                    <motion.div
                      key="success"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="space-y-4"
                    >
                      <div className="flex flex-col items-center justify-center gap-4 py-8">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10">
                          <AlertTriangle className="h-8 w-8 text-amber-400" />
                        </div>
                        <div className="text-center">
                          <h3 className="text-lg font-semibold text-white">
                            Account Deletion Scheduled
                          </h3>
                          <p className="mt-2 text-sm text-slate-400">
                            Your account is scheduled for deletion on:
                          </p>
                          {scheduledDeletion && (
                            <p className="mt-1 text-lg font-medium text-red-400">
                              {new Date(scheduledDeletion).toLocaleDateString('en-US', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                              })}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
                        <h4 className="font-medium text-amber-200">Grace Period Active</h4>
                        <p className="mt-2 text-sm text-amber-200/80">
                          You have 30 days to cancel this deletion request. Simply log in to your
                          account during this period and navigate to your profile settings to cancel
                          the deletion.
                        </p>
                      </div>

                      <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                        <h4 className="font-medium text-white">What happens next?</h4>
                        <ul className="mt-2 space-y-2 text-sm text-slate-300">
                          <li className="flex items-start gap-2">
                            <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-indigo-400" />
                            <span>
                              You can still use your account normally during the grace period
                            </span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-indigo-400" />
                            <span>You can cancel the deletion request at any time</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-indigo-400" />
                            <span>After 30 days, all your data will be permanently deleted</span>
                          </li>
                        </ul>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Footer */}
              <div className="border-t border-white/10 bg-white/5 px-6 py-4">
                <div className="flex gap-3">
                  {step === 'warning' && (
                    <>
                      <button
                        onClick={handleClose}
                        className="flex-1 rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/10"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => setStep('confirmation')}
                        className="flex-1 rounded-lg bg-gradient-to-r from-red-500 to-orange-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg transition-all hover:shadow-red-500/25"
                      >
                        Continue
                      </button>
                    </>
                  )}

                  {step === 'confirmation' && (
                    <>
                      <button
                        onClick={() => setStep('warning')}
                        className="flex-1 rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/10"
                      >
                        Back
                      </button>
                      <button
                        onClick={handleRequestDeletion}
                        disabled={!isConfirmationValid}
                        className="flex-1 rounded-lg bg-gradient-to-r from-red-500 to-orange-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg transition-all hover:shadow-red-500/25 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <span className="flex items-center justify-center gap-2">
                          <Trash2 className="h-4 w-4" />
                          Delete Account
                        </span>
                      </button>
                    </>
                  )}

                  {step === 'success' && (
                    <button
                      onClick={handleSuccess}
                      className="w-full rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg transition-all hover:shadow-indigo-500/25"
                    >
                      Close
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
