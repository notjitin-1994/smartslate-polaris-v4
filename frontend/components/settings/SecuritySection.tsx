'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Key, Smartphone, Monitor, Trash2, AlertTriangle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/ui/GlassCard';

export function SecuritySection() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  // Mock security data
  const activeSessions = [
    {
      id: '1',
      device: 'Chrome on MacBook Pro',
      location: 'San Francisco, CA',
      ip: '192.168.1.100',
      lastActive: '2 minutes ago',
      current: true,
    },
    {
      id: '2',
      device: 'Safari on iPhone',
      location: 'San Francisco, CA',
      ip: '192.168.1.101',
      lastActive: '1 hour ago',
      current: false,
    },
    {
      id: '3',
      device: 'Firefox on Windows PC',
      location: 'San Francisco, CA',
      ip: '192.168.1.102',
      lastActive: '3 days ago',
      current: false,
    },
  ];

  const handlePasswordChange = async (newPassword: string) => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setShowPasswordForm(false);
    } catch (error) {
      console.error('Failed to change password:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      // Remove session from list
    } catch (error) {
      console.error('Failed to revoke session:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnable2FA = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));
      // Show 2FA setup modal
    } catch (error) {
      console.error('Failed to enable 2FA:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="bg-primary/20 flex h-10 w-10 items-center justify-center rounded-xl">
          <Shield className="text-primary h-5 w-5" />
        </div>
        <div>
          <h2 className="text-title text-foreground">Security Settings</h2>
          <p className="text-caption text-text-secondary">
            Manage your password, sessions, and account security
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Password & Authentication */}
        <div className="space-y-6">
          <GlassCard className="p-6">
            <h3 className="text-heading text-foreground mb-6">Password & Authentication</h3>

            <div className="space-y-6">
              {/* Change Password */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-body text-foreground font-medium">Password</p>
                    <p className="text-caption text-text-secondary">Last changed 3 months ago</p>
                  </div>
                  <Button
                    onClick={() => setShowPasswordForm(!showPasswordForm)}
                    className="btn-secondary"
                  >
                    Change Password
                  </Button>
                </div>

                {showPasswordForm && (
                  <div className="bg-surface/30 space-y-4 rounded-lg p-4">
                    <div>
                      <label className="text-caption text-foreground mb-2 block">
                        Current Password
                      </label>
                      <input
                        type="password"
                        className="bg-background text-foreground placeholder:text-text-disabled focus:ring-secondary/50 focus:border-secondary w-full rounded-lg border border-neutral-300 px-4 py-3 focus:ring-2"
                        placeholder="Enter current password"
                      />
                    </div>
                    <div>
                      <label className="text-caption text-foreground mb-2 block">
                        New Password
                      </label>
                      <input
                        type="password"
                        className="bg-background text-foreground placeholder:text-text-disabled focus:ring-secondary/50 focus:border-secondary w-full rounded-lg border border-neutral-300 px-4 py-3 focus:ring-2"
                        placeholder="Enter new password"
                      />
                    </div>
                    <div>
                      <label className="text-caption text-foreground mb-2 block">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        className="bg-background text-foreground placeholder:text-text-disabled focus:ring-secondary/50 focus:border-secondary w-full rounded-lg border border-neutral-300 px-4 py-3 focus:ring-2"
                        placeholder="Confirm new password"
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <Button className="btn-primary">Update Password</Button>
                      <Button onClick={() => setShowPasswordForm(false)} className="btn-ghost">
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Two-Factor Authentication */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-success/20 flex h-8 w-8 items-center justify-center rounded-lg">
                      <CheckCircle className="text-success h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-body text-foreground font-medium">
                        Two-Factor Authentication
                      </p>
                      <p className="text-caption text-text-secondary">
                        Enabled via authenticator app
                      </p>
                    </div>
                  </div>
                  <span className="bg-success/20 text-success rounded-full px-2 py-1 text-xs">
                    Active
                  </span>
                </div>

                <Button className="btn-secondary">Manage 2FA Settings</Button>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Active Sessions */}
        <div className="space-y-6">
          <GlassCard className="p-6">
            <h3 className="text-heading text-foreground mb-6">Active Sessions</h3>

            <div className="space-y-4">
              {activeSessions.map((session) => (
                <div
                  key={session.id}
                  className={`rounded-lg border p-4 transition-all duration-200 ${
                    session.current
                      ? 'border-primary bg-primary/5'
                      : 'hover:border-primary/50 border-neutral-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/20 flex h-8 w-8 items-center justify-center rounded-lg">
                        {session.device.includes('iPhone') ? (
                          <Smartphone className="text-primary h-4 w-4" />
                        ) : (
                          <Monitor className="text-primary h-4 w-4" />
                        )}
                      </div>
                      <div>
                        <p className="text-body text-foreground font-medium">
                          {session.device}
                          {session.current && (
                            <span className="bg-primary text-primary-foreground ml-2 rounded-full px-2 py-0.5 text-xs">
                              Current
                            </span>
                          )}
                        </p>
                        <p className="text-caption text-text-secondary">
                          {session.location} • {session.ip}
                        </p>
                        <p className="text-caption text-text-secondary">
                          Last active: {session.lastActive}
                        </p>
                      </div>
                    </div>

                    {!session.current && (
                      <Button
                        onClick={() => handleRevokeSession(session.id)}
                        disabled={isLoading}
                        className="btn-ghost text-error hover:bg-error/10"
                      >
                        <div className="flex items-center gap-2">
                          <Trash2 className="h-4 w-4" />
                          Revoke
                        </div>
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 border-t border-neutral-300 pt-6">
              <Button className="btn-secondary w-full">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Revoke All Other Sessions
                </div>
              </Button>
            </div>
          </GlassCard>
        </div>
      </div>

      {/* Danger Zone */}
      <GlassCard className="border-error/20 p-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="bg-error/20 flex h-8 w-8 items-center justify-center rounded-lg">
            <AlertTriangle className="text-error h-4 w-4" />
          </div>
          <div>
            <h3 className="text-heading text-foreground">Danger Zone</h3>
            <p className="text-caption text-text-secondary">
              Irreversible actions that affect your account
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-error/10 border-error/20 flex items-center justify-between rounded-lg border p-4">
            <div>
              <p className="text-body text-foreground font-medium">Delete Account</p>
              <p className="text-caption text-text-secondary">
                Permanently delete your account and all associated data
              </p>
            </div>
            <Button className="btn-ghost text-error hover:bg-error/10">Delete Account</Button>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}
