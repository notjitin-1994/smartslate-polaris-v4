'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Download, Trash2, FileText, Shield, AlertTriangle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/ui/GlassCard';

export function DataPrivacySection() {
  const [isLoading, setIsLoading] = useState(false);

  // Mock data privacy information
  const dataInfo = {
    accountCreated: 'January 15, 2024',
    lastLogin: '2 minutes ago',
    totalBlueprints: 12,
    dataSize: '2.4 GB',
    dataRetention: '30 days after cancellation',
  };

  const handleExportData = async () => {
    setIsLoading(true);
    try {
      // Simulate data export
      await new Promise((resolve) => setTimeout(resolve, 2000));
      // In real app, this would trigger a download
      console.log('Exporting user data...');
    } catch (error) {
      console.error('Failed to export data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsLoading(true);
    try {
      // Simulate account deletion
      await new Promise((resolve) => setTimeout(resolve, 3000));
      // In real app, this would redirect to login or show confirmation
      console.log('Account deletion initiated...');
    } catch (error) {
      console.error('Failed to delete account:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="bg-primary/20 flex h-10 w-10 items-center justify-center rounded-xl">
          <Lock className="text-primary h-5 w-5" />
        </div>
        <div>
          <h2 className="text-title text-foreground">Privacy & Data</h2>
          <p className="text-caption text-text-secondary">
            Control your data, privacy settings, and account deletion
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Data Overview */}
        <GlassCard className="p-6">
          <h3 className="text-heading text-foreground mb-6">Your Data</h3>

          <div className="space-y-4">
            <div className="bg-surface/30 flex items-center justify-between rounded-lg p-4">
              <div className="flex items-center gap-3">
                <FileText className="text-primary h-5 w-5" />
                <div>
                  <p className="text-body text-foreground font-medium">Account Created</p>
                  <p className="text-caption text-text-secondary">{dataInfo.accountCreated}</p>
                </div>
              </div>
            </div>

            <div className="bg-surface/30 flex items-center justify-between rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Shield className="text-primary h-5 w-5" />
                <div>
                  <p className="text-body text-foreground font-medium">Last Login</p>
                  <p className="text-caption text-text-secondary">{dataInfo.lastLogin}</p>
                </div>
              </div>
            </div>

            <div className="bg-surface/30 flex items-center justify-between rounded-lg p-4">
              <div className="flex items-center gap-3">
                <FileText className="text-primary h-5 w-5" />
                <div>
                  <p className="text-body text-foreground font-medium">Total Blueprints</p>
                  <p className="text-caption text-text-secondary">
                    {dataInfo.totalBlueprints} created
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-surface/30 flex items-center justify-between rounded-lg p-4">
              <div className="flex items-center gap-3">
                <FileText className="text-primary h-5 w-5" />
                <div>
                  <p className="text-body text-foreground font-medium">Data Storage</p>
                  <p className="text-caption text-text-secondary">{dataInfo.dataSize} used</p>
                </div>
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Privacy Controls */}
        <div className="space-y-6">
          <GlassCard className="p-6">
            <h3 className="text-heading text-foreground mb-6">Data Export</h3>

            <div className="space-y-4">
              <p className="text-body text-text-secondary">
                Download a copy of all your data including blueprints, settings, and account
                information.
              </p>

              <Button
                onClick={handleExportData}
                disabled={isLoading}
                className="btn-primary w-full"
              >
                <div className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  {isLoading ? 'Preparing Export...' : 'Export All Data'}
                </div>
              </Button>

              <p className="text-caption text-text-secondary">
                Export includes: Profile data, blueprints, usage statistics, and settings. File will
                be available for download for 7 days.
              </p>
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <h3 className="text-heading text-foreground mb-6">Data Retention</h3>

            <div className="space-y-4">
              <div className="bg-info/10 border-info/20 flex items-start gap-3 rounded-lg border p-4">
                <CheckCircle className="text-info mt-0.5 h-5 w-5 flex-shrink-0" />
                <div>
                  <p className="text-body text-foreground font-medium">Active Account</p>
                  <p className="text-caption text-text-secondary">
                    Your data is retained indefinitely while your account is active.
                  </p>
                </div>
              </div>

              <div className="bg-warning/10 border-warning/20 flex items-start gap-3 rounded-lg border p-4">
                <AlertTriangle className="text-warning mt-0.5 h-5 w-5 flex-shrink-0" />
                <div>
                  <p className="text-body text-foreground font-medium">Account Deletion</p>
                  <p className="text-caption text-text-secondary">
                    If you delete your account, all data will be permanently removed after{' '}
                    {dataInfo.dataRetention}.
                  </p>
                </div>
              </div>
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
              Irreversible actions that permanently affect your data
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-error/10 border-error/20 rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-body text-foreground font-medium">Delete Account</p>
                <p className="text-caption text-text-secondary">
                  Permanently delete your account and all associated data. This action cannot be
                  undone.
                </p>
              </div>
              <Button
                onClick={handleDeleteAccount}
                disabled={isLoading}
                className="btn-ghost text-error hover:bg-error/10"
              >
                <div className="flex items-center gap-2">
                  <Trash2 className="h-4 w-4" />
                  {isLoading ? 'Deleting...' : 'Delete Account'}
                </div>
              </Button>
            </div>
          </div>

          <div className="bg-warning/10 border-warning/20 rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-body text-foreground font-medium">Reset All Data</p>
                <p className="text-caption text-text-secondary">
                  Clear all blueprints, settings, and usage history. Your account will remain
                  active.
                </p>
              </div>
              <Button className="btn-secondary text-warning hover:bg-warning/10">
                <div className="flex items-center gap-2">
                  <Trash2 className="h-4 w-4" />
                  Reset Data
                </div>
              </Button>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Privacy Policy */}
      <GlassCard className="p-6">
        <h3 className="text-heading text-foreground mb-4">Privacy & Legal</h3>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Button className="btn-ghost justify-start">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Privacy Policy
            </div>
          </Button>

          <Button className="btn-ghost justify-start">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Terms of Service
            </div>
          </Button>

          <Button className="btn-ghost justify-start">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Data Processing Agreement
            </div>
          </Button>

          <Button className="btn-ghost justify-start">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              GDPR Information
            </div>
          </Button>
        </div>
      </GlassCard>
    </motion.div>
  );
}
