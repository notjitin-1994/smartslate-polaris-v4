'use client';

import { useState, useEffect } from 'react';
import { SettingCard, SettingRow } from './SettingCard';
import { Toggle } from './Toggle';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Shield,
  Key,
  Smartphone,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Clock,
  Trash2,
  Save,
  X,
  Monitor,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';

interface Session {
  id: string;
  createdAt: string;
  updatedAt: string;
  isCurrent: boolean;
}

/**
 * SecuritySettings - Security and privacy management
 * Password changes, 2FA, sessions, and privacy controls
 */
export function SecuritySettings() {
  const { user } = useAuth();
  const router = useRouter();

  // Password change
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // 2FA
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  // Privacy
  const [profilePublic, setProfilePublic] = useState(false);
  const [showActivity, setShowActivity] = useState(true);
  const [dataCollection, setDataCollection] = useState(true);

  // Sessions
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [isRevokingAll, setIsRevokingAll] = useState(false);

  // Account deletion
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  // Fetch sessions on mount
  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      setLoadingSessions(true);
      const response = await fetch('/api/account/sessions');
      const data = await response.json();

      if (data.success && data.sessions) {
        setSessions(data.sessions);
      }
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
    } finally {
      setLoadingSessions(false);
    }
  };

  const calculatePasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (password.length >= 12) strength += 25;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 25;
    if (/\d/.test(password)) strength += 12.5;
    if (/[^a-zA-Z\d]/.test(password)) strength += 12.5;
    return Math.min(strength, 100);
  };

  const handleNewPasswordChange = (value: string) => {
    setNewPassword(value);
    setPasswordStrength(calculatePasswordStrength(value));
    setPasswordError('');
  };

  const getPasswordStrengthColor = (strength: number) => {
    if (strength < 25) return 'from-error to-error';
    if (strength < 50) return 'from-warning to-orange-500';
    if (strength < 75) return 'from-info to-blue-500';
    return 'from-success to-emerald-500';
  };

  const getPasswordStrengthLabel = (strength: number) => {
    if (strength < 25) return 'Weak';
    if (strength < 50) return 'Fair';
    if (strength < 75) return 'Good';
    return 'Strong';
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters long');
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const response = await fetch('/api/account/password/change', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        setPasswordError(data.error || 'Failed to change password');
        return;
      }

      setPasswordSuccess('Password successfully updated');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordStrength(0);

      setTimeout(() => {
        setPasswordSuccess('');
      }, 3000);
    } catch (error) {
      console.error('Failed to change password:', error);
      setPasswordError('An unexpected error occurred');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleRevokeAllSessions = async () => {
    if (!confirm('Are you sure you want to revoke all other sessions?')) {
      return;
    }

    setIsRevokingAll(true);
    try {
      const response = await fetch('/api/account/sessions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ revokeAll: true }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || 'Failed to revoke sessions');
        return;
      }

      alert('All other sessions have been revoked successfully');
      fetchSessions();
    } catch (error) {
      console.error('Failed to revoke sessions:', error);
      alert('An unexpected error occurred');
    } finally {
      setIsRevokingAll(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      setDeleteError('Please type DELETE to confirm');
      return;
    }

    if (!confirm('This action is PERMANENT and CANNOT be undone. Are you absolutely sure?')) {
      return;
    }

    setIsDeletingAccount(true);
    setDeleteError('');

    try {
      const response = await fetch('/api/account/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmationText: deleteConfirmText }),
      });

      const data = await response.json();

      if (!response.ok) {
        setDeleteError(data.error || 'Failed to delete account');
        setIsDeletingAccount(false);
        return;
      }

      alert('Your account has been successfully deleted');
      router.push('/');
    } catch (error) {
      console.error('Failed to delete account:', error);
      setDeleteError('An unexpected error occurred');
      setIsDeletingAccount(false);
    }
  };

  return (
    <section id="security" className="scroll-mt-24 space-y-6">
      {/* Change Password */}
      <SettingCard
        title="Change Password"
        description="Update your password to keep your account secure"
      >
        <form onSubmit={handlePasswordUpdate} className="space-y-4">
          {/* Success/Error Messages */}
          <AnimatePresence>
            {passwordError && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-error/10 border-error/20 rounded-lg border p-3"
              >
                <p className="text-caption text-error">{passwordError}</p>
              </motion.div>
            )}
            {passwordSuccess && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-success/10 border-success/20 rounded-lg border p-3"
              >
                <p className="text-caption text-success">{passwordSuccess}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Current Password */}
          <div className="space-y-2">
            <label htmlFor="currentPassword" className="text-body text-foreground font-medium">
              Current Password
            </label>
            <div className="relative">
              <Input
                id="currentPassword"
                type={showCurrentPassword ? 'text' : 'password'}
                placeholder="Enter your current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                size="large"
                className="w-full pr-12"
                disabled={isUpdatingPassword}
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="text-text-disabled hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2 transition-colors"
                aria-label={showCurrentPassword ? 'Hide password' : 'Show password'}
                disabled={isUpdatingPassword}
              >
                {showCurrentPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div className="space-y-2">
            <label htmlFor="newPassword" className="text-body text-foreground font-medium">
              New Password
            </label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showNewPassword ? 'text' : 'password'}
                placeholder="Enter your new password"
                value={newPassword}
                onChange={(e) => handleNewPasswordChange(e.target.value)}
                size="large"
                className="w-full pr-12"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="text-text-disabled hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2 transition-colors"
                aria-label={showNewPassword ? 'Hide password' : 'Show password'}
              >
                {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>

            {/* Password Strength Indicator */}
            {newPassword && (
              <div className="space-y-2">
                <div className="text-caption flex items-center justify-between">
                  <span className="text-text-secondary">Password strength</span>
                  <span
                    className={cn(
                      'font-semibold',
                      passwordStrength < 50
                        ? 'text-error'
                        : passwordStrength < 75
                          ? 'text-warning'
                          : 'text-success'
                    )}
                  >
                    {getPasswordStrengthLabel(passwordStrength)}
                  </span>
                </div>
                <div className="relative h-2 overflow-hidden rounded-full bg-neutral-200">
                  <div
                    className={cn(
                      'absolute top-0 left-0 h-full rounded-full bg-gradient-to-r transition-all duration-500',
                      getPasswordStrengthColor(passwordStrength)
                    )}
                    style={{ width: `${passwordStrength}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <label htmlFor="confirmPassword" className="text-body text-foreground font-medium">
              Confirm New Password
            </label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Confirm your new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              size="large"
              className="w-full"
            />
          </div>

          {/* Password Requirements */}
          <div className="bg-info/5 border-info/20 space-y-2 rounded-xl border p-4">
            <p className="text-caption text-foreground mb-2 font-medium">Password requirements:</p>
            <ul className="text-caption text-text-secondary space-y-1.5">
              <li className="flex items-center gap-2">
                <CheckCircle2
                  className={cn(
                    'h-4 w-4 flex-shrink-0',
                    newPassword.length >= 8 ? 'text-success' : 'text-text-disabled'
                  )}
                />
                At least 8 characters
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2
                  className={cn(
                    'h-4 w-4 flex-shrink-0',
                    /[A-Z]/.test(newPassword) && /[a-z]/.test(newPassword)
                      ? 'text-success'
                      : 'text-text-disabled'
                  )}
                />
                Mix of uppercase and lowercase letters
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2
                  className={cn(
                    'h-4 w-4 flex-shrink-0',
                    /\d/.test(newPassword) ? 'text-success' : 'text-text-disabled'
                  )}
                />
                At least one number
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2
                  className={cn(
                    'h-4 w-4 flex-shrink-0',
                    /[^a-zA-Z\d]/.test(newPassword) ? 'text-success' : 'text-text-disabled'
                  )}
                />
                At least one special character
              </li>
            </ul>
          </div>

          {/* Update Button */}
          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              variant="primary"
              size="large"
              disabled={
                !currentPassword ||
                !newPassword ||
                !confirmPassword ||
                newPassword !== confirmPassword ||
                isUpdatingPassword
              }
            >
              {isUpdatingPassword ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Updating...
                </>
              ) : (
                <>
                  <Key className="mr-2 h-4 w-4" />
                  Update Password
                </>
              )}
            </Button>
          </div>
        </form>
      </SettingCard>

      {/* Two-Factor Authentication */}
      <SettingCard
        title="Two-Factor Authentication"
        description="Add an extra layer of security to your account"
      >
        <div
          className={cn(
            'rounded-xl border-2 p-6 transition-all duration-200',
            twoFactorEnabled
              ? 'bg-success/5 border-success/30'
              : 'border-neutral-200/10 bg-neutral-100/5'
          )}
        >
          <div className="flex items-start gap-4">
            <div
              className={cn(
                'flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl',
                twoFactorEnabled ? 'bg-success text-white' : 'text-text-disabled bg-neutral-300'
              )}
            >
              <Shield className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <div className="mb-2 flex items-center gap-2">
                <h4 className="text-body text-foreground font-semibold">
                  {twoFactorEnabled
                    ? 'Two-Factor Authentication Enabled'
                    : 'Enable Two-Factor Authentication'}
                </h4>
                {twoFactorEnabled && <CheckCircle2 className="text-success h-5 w-5" />}
              </div>
              <p className="text-caption text-text-secondary mb-4">
                {twoFactorEnabled
                  ? "Your account is protected with two-factor authentication. You'll need to enter a code from your authenticator app when signing in."
                  : "Protect your account with an additional security layer. You'll need your password and a verification code to sign in."}
              </p>
              <Button
                variant={twoFactorEnabled ? 'ghost' : 'primary'}
                size="medium"
                onClick={() => setTwoFactorEnabled(!twoFactorEnabled)}
              >
                <Smartphone className="mr-2 h-4 w-4" />
                {twoFactorEnabled ? 'Disable 2FA' : 'Enable 2FA'}
              </Button>
            </div>
          </div>
        </div>
      </SettingCard>

      {/* Active Sessions */}
      <SettingCard title="Active Sessions" description="Manage where you're logged in">
        <div className="space-y-4">
          {loadingSessions ? (
            <div className="flex items-center justify-center py-8">
              <div className="border-primary h-6 w-6 animate-spin rounded-full border-2 border-t-transparent" />
            </div>
          ) : sessions.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-body text-text-secondary">No active sessions found</p>
            </div>
          ) : (
            <>
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className={cn(
                    'rounded-xl border p-4 transition-all duration-200',
                    session.isCurrent
                      ? 'bg-primary/5 border-primary/30'
                      : 'bg-surface border-neutral-200/10'
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex flex-1 items-start gap-3">
                      <div
                        className={cn(
                          'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg',
                          session.isCurrent ? 'bg-primary/20' : 'bg-neutral-300'
                        )}
                      >
                        <Monitor
                          className={cn(
                            'h-5 w-5',
                            session.isCurrent ? 'text-primary' : 'text-text-disabled'
                          )}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex items-center gap-2">
                          <p className="text-body text-foreground font-medium">Browser Session</p>
                          {session.isCurrent && (
                            <span className="bg-primary/20 text-primary border-primary/30 rounded-md border px-2 py-0.5 text-xs font-medium">
                              Current
                            </span>
                          )}
                        </div>
                        <p className="text-caption text-text-secondary">
                          Created: {new Date(session.createdAt).toLocaleString()}
                        </p>
                        <div className="text-caption text-text-disabled mt-1.5 flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5" />
                          <span>Last active: {new Date(session.updatedAt).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {sessions.length > 1 && (
                <div className="border-t border-neutral-200/10 pt-4">
                  <Button
                    variant="secondary"
                    size="medium"
                    onClick={handleRevokeAllSessions}
                    disabled={isRevokingAll}
                    className="w-full"
                  >
                    {isRevokingAll ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        Revoking...
                      </>
                    ) : (
                      <>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Revoke All Other Sessions
                      </>
                    )}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </SettingCard>

      {/* Privacy */}
      <SettingCard
        title="Privacy & Data"
        description="Control your privacy and data collection settings"
      >
        <SettingRow label="Public Profile" description="Make your profile visible to other users">
          <Toggle
            checked={profilePublic}
            onCheckedChange={setProfilePublic}
            aria-label="Toggle public profile"
          />
        </SettingRow>

        <SettingRow
          label="Show Activity"
          description="Display your recent activity on your profile"
        >
          <Toggle
            checked={showActivity}
            onCheckedChange={setShowActivity}
            aria-label="Toggle show activity"
          />
        </SettingRow>

        <SettingRow
          label="Analytics & Improvement"
          description="Help us improve by sharing anonymous usage data"
        >
          <Toggle
            checked={dataCollection}
            onCheckedChange={setDataCollection}
            aria-label="Toggle analytics"
          />
        </SettingRow>

        <div className="mt-2 border-t border-neutral-200/10 pt-4">
          <div className="bg-info/5 border-info/20 flex items-start gap-3 rounded-xl border p-4">
            <Shield className="text-info mt-0.5 h-5 w-5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-caption text-text-secondary">
                We respect your privacy. Your data is encrypted and never shared with third parties
                without your consent.
              </p>
            </div>
          </div>
        </div>
      </SettingCard>

      {/* Danger Zone - Account Deletion */}
      <SettingCard title="Danger Zone" description="Irreversible actions that affect your account">
        <div className="border-error/30 bg-error/5 space-y-4 rounded-xl border-2 p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="text-error mt-0.5 h-6 w-6 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="text-body text-error mb-2 font-semibold">Delete Account</h4>
              <p className="text-caption text-text-secondary mb-4">
                Once you delete your account, there is no going back. This will permanently delete:
              </p>
              <ul className="text-caption text-text-secondary mb-4 list-inside list-disc space-y-1">
                <li>Your profile and personal information</li>
                <li>All your blueprints and starmaps</li>
                <li>Your subscription and billing information</li>
                <li>All saved preferences and settings</li>
              </ul>

              {!showDeleteConfirm ? (
                <Button
                  onClick={() => setShowDeleteConfirm(true)}
                  variant="destructive"
                  size="medium"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete My Account
                </Button>
              ) : (
                <div className="space-y-3">
                  <div className="bg-error/10 border-error/30 rounded-lg border p-4">
                    <p className="text-body text-error mb-2 font-semibold">
                      Are you absolutely sure?
                    </p>
                    <p className="text-caption text-text-secondary mb-3">
                      This action is PERMANENT and CANNOT be undone. Type{' '}
                      <span className="text-foreground font-mono font-semibold">DELETE</span> to
                      confirm.
                    </p>
                    <Input
                      type="text"
                      placeholder="Type DELETE to confirm"
                      value={deleteConfirmText}
                      onChange={(e) => setDeleteConfirmText(e.target.value)}
                      disabled={isDeletingAccount}
                      size="medium"
                      className={deleteError ? 'border-error' : ''}
                    />
                    {deleteError && <p className="text-caption text-error mt-2">{deleteError}</p>}
                  </div>
                  <div className="flex gap-3">
                    <Button
                      onClick={handleDeleteAccount}
                      disabled={deleteConfirmText !== 'DELETE' || isDeletingAccount}
                      variant="destructive"
                      size="medium"
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
                      onClick={() => {
                        setShowDeleteConfirm(false);
                        setDeleteConfirmText('');
                        setDeleteError('');
                      }}
                      disabled={isDeletingAccount}
                      variant="ghost"
                      size="medium"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </SettingCard>
    </section>
  );
}
