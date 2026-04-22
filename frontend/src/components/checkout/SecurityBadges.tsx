/**
 * Security Badges Component
 * Trust indicators for checkout process
 */

'use client';

import { Shield, Lock, Check } from 'lucide-react';

export function SecurityBadges() {
  return (
    <div className="space-y-3">
      {/* Security badges grid */}
      <div className="flex flex-wrap items-center justify-center gap-4">
        <div className="text-text-secondary text-caption flex items-center gap-1.5">
          <Shield className="text-success h-4 w-4" aria-hidden="true" />
          <span>PCI DSS Compliant</span>
        </div>
        <div className="text-text-secondary text-caption flex items-center gap-1.5">
          <Lock className="text-success h-4 w-4" aria-hidden="true" />
          <span>256-bit SSL</span>
        </div>
        <div className="text-text-secondary text-caption flex items-center gap-1.5">
          <Check className="text-success h-4 w-4" aria-hidden="true" />
          <span>Secure Payment</span>
        </div>
      </div>

      {/* Powered by Razorpay */}
      <div className="text-text-disabled text-small text-center">
        Powered by <span className="text-text-secondary font-medium">Razorpay</span>
      </div>
    </div>
  );
}
