'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { LoadingButton } from '@/components/ui/button';
import { useToast } from '../ui/toast';
import { Eye, EyeOff, Lock, CheckCircle2 } from 'lucide-react';

interface SetPasswordModalProps {
  open: boolean;
  email?: string;
  onSuccess?: () => void;
}

export function SetPasswordModal({ open, email, onSuccess }: SetPasswordModalProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [errors, setErrors] = useState<{
    password?: string;
    confirmPassword?: string;
    general?: string;
  }>({});

  const { showSuccess, showError } = useToast();

  // Reset form state when modal closes
  useEffect(() => {
    if (!open) {
      setPassword('');
      setConfirmPassword('');
      setShowPassword(false);
      setShowConfirmPassword(false);
      setLoading(false);
      setIsVerifying(false);
      setErrors({});
    }
  }, [open]);

  // Password strength validation
  const validatePassword = (pwd: string) => {
    const errors: string[] = [];

    if (pwd.length < 8) {
      errors.push('at least 8 characters');
    }
    if (!/[a-z]/.test(pwd)) {
      errors.push('one lowercase letter');
    }
    if (!/[A-Z]/.test(pwd)) {
      errors.push('one uppercase letter');
    }
    if (!/\d/.test(pwd)) {
      errors.push('one number');
    }

    return errors;
  };

  const getPasswordStrength = (pwd: string) => {
    const validationErrors = validatePassword(pwd);
    if (validationErrors.length === 0) return { strength: 'Strong', color: 'text-green-500' };
    if (validationErrors.length <= 2) return { strength: 'Medium', color: 'text-yellow-500' };
    return { strength: 'Weak', color: 'text-red-500' };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Clear previous errors
    setErrors({});

    // Validate password
    const passwordErrors = validatePassword(password);
    if (passwordErrors.length > 0) {
      setErrors({
        password: `Password must contain ${passwordErrors.join(', ')}`,
      });
      return;
    }

    // Validate password match
    if (password !== confirmPassword) {
      setErrors({
        confirmPassword: 'Passwords do not match',
      });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/set-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to set password');
      }

      showSuccess('Password Set Successfully', 'Verifying your password...');
      setLoading(false);
      setIsVerifying(true);

      // Call success callback with retry logic to ensure password check succeeds
      try {
        if (onSuccess) {
          await onSuccess();
        }
      } catch (callbackError) {
        console.error('Error in success callback:', callbackError);
      } finally {
        // Reset verifying state after callback completes
        setIsVerifying(false);
      }
    } catch (error) {
      console.error('Error setting password:', error);
      setErrors({
        general:
          error instanceof Error ? error.message : 'Failed to set password. Please try again.',
      });
      showError(
        'Failed to set password',
        'Please try again or contact support if the issue persists.'
      );
      setLoading(false);
      setIsVerifying(false);
    }
  };

  const passwordStrength = password ? getPasswordStrength(password) : null;
  const passwordValidationErrors = password ? validatePassword(password) : [];

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="sm:max-w-[500px]"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="bg-primary/10 mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full">
            <Lock className="text-primary h-6 w-6" />
          </div>
          <DialogTitle className="text-center text-2xl">Set Your Password</DialogTitle>
          <DialogDescription className="text-center">
            {email && (
              <>
                You signed in with <span className="font-semibold">{email}</span> using Google.
                <br />
              </>
            )}
            For security, please set a password to access your account.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Password Field */}
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">
              Enter new password
              <span className="ml-1 text-red-500">*</span>
            </label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="pr-10"
                disabled={loading || isVerifying}
                variant={errors.password ? 'error' : 'default'}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {/* Password Strength Indicator */}
            {password && (
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">Strength:</span>
                  <span className={`text-xs font-medium ${passwordStrength?.color}`}>
                    {passwordStrength?.strength}
                  </span>
                </div>

                {/* Password Requirements */}
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-1.5">
                    {password.length >= 8 ? (
                      <CheckCircle2 className="h-3 w-3 text-green-500" />
                    ) : (
                      <div className="h-3 w-3 rounded-full border border-gray-300" />
                    )}
                    <span className={password.length >= 8 ? 'text-green-600' : 'text-gray-500'}>
                      At least 8 characters
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {/[a-z]/.test(password) ? (
                      <CheckCircle2 className="h-3 w-3 text-green-500" />
                    ) : (
                      <div className="h-3 w-3 rounded-full border border-gray-300" />
                    )}
                    <span className={/[a-z]/.test(password) ? 'text-green-600' : 'text-gray-500'}>
                      One lowercase letter
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {/[A-Z]/.test(password) ? (
                      <CheckCircle2 className="h-3 w-3 text-green-500" />
                    ) : (
                      <div className="h-3 w-3 rounded-full border border-gray-300" />
                    )}
                    <span className={/[A-Z]/.test(password) ? 'text-green-600' : 'text-gray-500'}>
                      One uppercase letter
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {/\d/.test(password) ? (
                      <CheckCircle2 className="h-3 w-3 text-green-500" />
                    ) : (
                      <div className="h-3 w-3 rounded-full border border-gray-300" />
                    )}
                    <span className={/\d/.test(password) ? 'text-green-600' : 'text-gray-500'}>
                      One number
                    </span>
                  </div>
                </div>
              </div>
            )}

            {errors.password && <p className="text-sm text-red-500">{errors.password}</p>}
          </div>

          {/* Confirm Password Field */}
          <div className="space-y-2">
            <label htmlFor="confirmPassword" className="text-sm font-medium">
              Confirm new password
              <span className="ml-1 text-red-500">*</span>
            </label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                className="pr-10"
                disabled={loading || isVerifying}
                variant={errors.confirmPassword ? 'error' : 'default'}
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                tabIndex={-1}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-sm text-red-500">{errors.confirmPassword}</p>
            )}
          </div>

          {/* General Error */}
          {errors.general && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">{errors.general}</div>
          )}

          <DialogFooter className="mt-6">
            <LoadingButton
              type="submit"
              loading={loading || isVerifying}
              loadingText={isVerifying ? 'Verifying...' : 'Setting Password...'}
              className="w-full bg-indigo-600 text-white hover:bg-indigo-700"
              disabled={
                !password ||
                !confirmPassword ||
                passwordValidationErrors.length > 0 ||
                password !== confirmPassword ||
                isVerifying
              }
            >
              Set Password
            </LoadingButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
