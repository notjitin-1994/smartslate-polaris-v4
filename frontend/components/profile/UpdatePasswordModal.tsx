'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Eye, EyeOff, X, AlertCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { passwordUpdateSchema, type PasswordUpdateInput } from '@/lib/schemas/passwordUpdateSchema';
import { calculatePasswordStrength } from '@/lib/utils/passwordStrength';
import { GlassCard } from '@/components/ui/GlassCard';

interface UpdatePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UpdatePasswordModal({ isOpen, onClose }: UpdatePasswordModalProps) {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
  } = useForm<PasswordUpdateInput>({
    resolver: zodResolver(passwordUpdateSchema),
    mode: 'onChange',
  });

  const newPassword = watch('newPassword', '');
  const passwordStrength = calculatePasswordStrength(newPassword);

  const handleClose = () => {
    reset();
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    onClose();
  };

  const onSubmit = async (data: PasswordUpdateInput) => {
    try {
      setIsSubmitting(true);

      const response = await fetch('/api/auth/update-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update password');
      }

      toast.success('Password updated successfully', {
        description: 'Your password has been changed. Please use it for your next login.',
      });

      handleClose();
    } catch (error) {
      console.error('Password update error:', error);
      toast.error('Failed to update password', {
        description: error instanceof Error ? error.message : 'Please try again later',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className="relative z-10 w-full max-w-md"
        >
          <GlassCard className="p-6">
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="from-primary/20 to-secondary/20 border-primary/30 flex h-10 w-10 items-center justify-center rounded-xl border bg-gradient-to-br">
                  <Lock className="text-primary h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-heading text-foreground font-semibold">Update Password</h2>
                  <p className="text-caption text-text-secondary">
                    Choose a strong password to keep your account secure
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="text-text-secondary hover:text-foreground rounded-lg p-1 transition-colors"
                aria-label="Close modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Current Password */}
              <div>
                <label
                  htmlFor="currentPassword"
                  className="text-body text-foreground mb-2 block font-medium"
                >
                  Current Password
                </label>
                <div className="relative">
                  <input
                    {...register('currentPassword')}
                    type={showCurrentPassword ? 'text' : 'password'}
                    id="currentPassword"
                    className={`bg-background/50 placeholder:text-text-secondary focus:border-primary focus:ring-primary/20 w-full rounded-lg border border-neutral-200/50 px-4 py-2.5 pr-10 transition-colors focus:ring-2 focus:outline-none ${
                      errors.currentPassword ? 'border-red-500' : ''
                    }`}
                    placeholder="Enter current password"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="text-text-secondary hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
                    aria-label={showCurrentPassword ? 'Hide password' : 'Show password'}
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.currentPassword && (
                  <p className="mt-1 flex items-center gap-1 text-sm text-red-600">
                    <AlertCircle className="h-3 w-3" />
                    {errors.currentPassword.message}
                  </p>
                )}
              </div>

              {/* New Password */}
              <div>
                <label
                  htmlFor="newPassword"
                  className="text-body text-foreground mb-2 block font-medium"
                >
                  New Password
                </label>
                <div className="relative">
                  <input
                    {...register('newPassword')}
                    type={showNewPassword ? 'text' : 'password'}
                    id="newPassword"
                    className={`bg-background/50 placeholder:text-text-secondary focus:border-primary focus:ring-primary/20 w-full rounded-lg border border-neutral-200/50 px-4 py-2.5 pr-10 transition-colors focus:ring-2 focus:outline-none ${
                      errors.newPassword ? 'border-red-500' : ''
                    }`}
                    placeholder="Enter new password"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="text-text-secondary hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
                    aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.newPassword && (
                  <p className="mt-1 flex items-center gap-1 text-sm text-red-600">
                    <AlertCircle className="h-3 w-3" />
                    {errors.newPassword.message}
                  </p>
                )}

                {/* Password Strength Meter */}
                {newPassword && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-3 space-y-2"
                  >
                    {/* Strength Bar */}
                    <div className="flex items-center gap-2">
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(passwordStrength.score / 4) * 100}%` }}
                          transition={{ duration: 0.3 }}
                          className={`h-full ${passwordStrength.bgColor}`}
                        />
                      </div>
                      <span className={`text-caption font-medium ${passwordStrength.color}`}>
                        {passwordStrength.label}
                      </span>
                    </div>

                    {/* Feedback */}
                    {passwordStrength.feedback.length > 0 && (
                      <ul className="text-caption text-text-secondary space-y-1">
                        {passwordStrength.feedback.map((item, index) => (
                          <li key={index} className="flex items-start gap-1.5">
                            <AlertCircle className="mt-0.5 h-3 w-3 flex-shrink-0" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    )}

                    {/* Crack Time */}
                    <p className="text-caption text-text-secondary">
                      Estimated crack time:{' '}
                      <span className="font-medium">{passwordStrength.crackTime}</span>
                    </p>
                  </motion.div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="text-body text-foreground mb-2 block font-medium"
                >
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    {...register('confirmPassword')}
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    className={`bg-background/50 placeholder:text-text-secondary focus:border-primary focus:ring-primary/20 w-full rounded-lg border border-neutral-200/50 px-4 py-2.5 pr-10 transition-colors focus:ring-2 focus:outline-none ${
                      errors.confirmPassword ? 'border-red-500' : ''
                    }`}
                    placeholder="Confirm new password"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="text-text-secondary hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 flex items-center gap-1 text-sm text-red-600">
                    <AlertCircle className="h-3 w-3" />
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>

              {/* Password Requirements */}
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-950/30">
                <p className="text-caption mb-2 font-medium text-blue-900 dark:text-blue-100">
                  Password must:
                </p>
                <ul className="text-caption space-y-1 text-blue-800 dark:text-blue-200">
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3 w-3" />
                    Be at least 8 characters long
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3 w-3" />
                    Contain uppercase and lowercase letters
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3 w-3" />
                    Include at least one number
                  </li>
                </ul>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="bg-background hover:bg-background/80 flex-1 rounded-lg border border-neutral-200 px-4 py-2.5 font-medium transition-colors"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || passwordStrength.score < 2}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 flex-1 rounded-lg px-4 py-2.5 font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSubmitting ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </GlassCard>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
