'use client';

import { useState } from 'react';
import { Download, Trash2, Shield, FileText, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { ExportDataModal } from './ExportDataModal';
import { DeleteAccountModal } from './DeleteAccountModal';

export function PrivacySection() {
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg">
          <Shield className="h-5 w-5 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-white">Privacy & Data Control</h2>
          <p className="text-sm text-slate-400">Manage your data and privacy settings</p>
        </div>
      </div>

      {/* GDPR Compliance Notice */}
      <div className="rounded-xl border border-indigo-500/20 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 p-4 backdrop-blur-sm">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-indigo-400" />
          <div className="flex-1">
            <h3 className="font-medium text-white">GDPR Compliant</h3>
            <p className="mt-1 text-sm text-slate-300">
              We respect your privacy rights under GDPR and other data protection regulations. You
              have full control over your personal data.
            </p>
          </div>
        </div>
      </div>

      {/* Data Export Section */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition-all hover:border-white/20 hover:bg-white/10">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-600/20">
                <Download className="h-5 w-5 text-indigo-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Export Your Data</h3>
                <p className="text-sm text-slate-400">
                  GDPR Article 20 - Right to Data Portability
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <p className="text-sm text-slate-300">
                Download a complete copy of all your personal data stored in Smartslate Polaris. The
                export includes your profile, blueprints, activity logs, and preferences in
                machine-readable formats (JSON and CSV).
              </p>

              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-300">
                  <FileText className="h-3 w-3" />
                  JSON Format
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border border-purple-500/20 bg-purple-500/10 px-3 py-1 text-xs font-medium text-purple-300">
                  <FileText className="h-3 w-3" />
                  CSV Format
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border border-pink-500/20 bg-pink-500/10 px-3 py-1 text-xs font-medium text-pink-300">
                  <Download className="h-3 w-3" />
                  ZIP Archive
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setIsExportModalOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg transition-all hover:shadow-indigo-500/25"
          >
            <Download className="h-4 w-4" />
            Export Data
          </button>
        </div>
      </div>

      {/* Account Deletion Section */}
      <div className="rounded-xl border border-red-500/20 bg-gradient-to-br from-red-500/5 to-orange-500/5 p-6 backdrop-blur-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-red-500/20 to-orange-600/20">
                <Trash2 className="h-5 w-5 text-red-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Delete Your Account</h3>
                <p className="text-sm text-slate-400">GDPR Article 17 - Right to Erasure</p>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <p className="text-sm text-slate-300">
                Permanently delete your account and all associated data. This action is irreversible
                and will remove all your blueprints, activity logs, and personal information.
              </p>

              <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-400" />
                  <div className="flex-1">
                    <p className="text-xs font-medium text-amber-200">30-Day Grace Period</p>
                    <p className="mt-1 text-xs text-amber-200/80">
                      You'll have 30 days to cancel the deletion before it becomes permanent. We
                      recommend exporting your data first.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={() => setIsDeleteModalOpen(true)}
            className="flex items-center gap-2 rounded-lg border border-red-500/50 bg-gradient-to-r from-red-500/10 to-orange-600/10 px-4 py-2.5 text-sm font-medium text-red-300 transition-all hover:border-red-500 hover:bg-red-500/20"
          >
            <Trash2 className="h-4 w-4" />
            Delete Account
          </button>
        </div>
      </div>

      {/* Privacy Resources */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
        <h4 className="text-sm font-medium text-white">Privacy Resources</h4>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <a
            href="/privacy-policy"
            className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300 transition-colors hover:bg-white/10"
          >
            <FileText className="h-4 w-4 text-indigo-400" />
            Privacy Policy
          </a>
          <a
            href="/terms-of-service"
            className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300 transition-colors hover:bg-white/10"
          >
            <FileText className="h-4 w-4 text-indigo-400" />
            Terms of Service
          </a>
        </div>
      </div>

      {/* Modals */}
      <ExportDataModal isOpen={isExportModalOpen} onClose={() => setIsExportModalOpen(false)} />

      <DeleteAccountModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} />
    </div>
  );
}
