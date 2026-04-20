/**
 * Razorpay Initialization Check Component
 * Verifies Razorpay is properly configured before allowing payments
 */

'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { getRazorpayConfiguration, validateRazorpayConfig } from '@/lib/utils/razorpayConfig';
import { initializeRazorpay } from '@/lib/services/razorpayCheckoutService';

interface RazorpayInitCheckProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function RazorpayInitCheck({ children, fallback }: RazorpayInitCheckProps) {
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);

  useEffect(() => {
    async function checkRazorpay() {
      try {
        // Validate configuration
        const validation = validateRazorpayConfig();

        if (!validation.isValid) {
          setError(validation.errors.join(', '));
          setStatus('error');
          return;
        }

        if (validation.warnings.length > 0) {
          setWarnings(validation.warnings);
          console.warn('Razorpay configuration warnings:', validation.warnings);
        }

        // Initialize Razorpay SDK
        const initialized = await initializeRazorpay();

        if (!initialized) {
          setError('Failed to load Razorpay SDK');
          setStatus('error');
          return;
        }

        setStatus('ready');
      } catch (err) {
        console.error('Razorpay initialization error:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize payment system');
        setStatus('error');
      }
    }

    checkRazorpay();
  }, []);

  // Loading state
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="text-primary-accent h-6 w-6 animate-spin" />
        <span className="text-text-secondary ml-2">Initializing payment system...</span>
      </div>
    );
  }

  // Error state with detailed information
  if (status === 'error') {
    if (fallback) {
      return <>{fallback}</>;
    }

    const config = getRazorpayConfiguration();

    return (
      <div className="border-error/20 bg-error/5 rounded-lg border p-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="text-error mt-0.5 h-5 w-5" />
          <div className="flex-1">
            <h3 className="text-body text-text-primary mb-2 font-medium">
              Payment System Not Available
            </h3>
            <p className="text-caption text-text-secondary mb-3">
              {error || 'The payment system is not properly configured.'}
            </p>

            {process.env.NODE_ENV === 'development' && (
              <div className="bg-background-surface/50 mt-4 rounded-md p-3">
                <p className="text-caption text-text-disabled mb-2">
                  <strong>Developer Info:</strong>
                </p>
                <ul className="text-caption text-text-disabled space-y-1">
                  <li>• Key configured: {config.isConfigured ? 'Yes' : 'No'}</li>
                  <li>• Mode: {config.isLiveMode ? 'Live' : 'Test'}</li>
                  <li>
                    • Key prefix: {config.keyId ? config.keyId.substring(0, 10) + '...' : 'Not set'}
                  </li>
                </ul>
                <p className="text-caption text-warning mt-3">
                  Add NEXT_PUBLIC_RAZORPAY_KEY_ID to your .env.local file
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Ready state with warnings
  return (
    <>
      {warnings.length > 0 && process.env.NODE_ENV === 'development' && (
        <div className="border-warning/20 bg-warning/5 mb-4 rounded-lg border p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="text-warning mt-0.5 h-5 w-5" />
            <div className="flex-1">
              <p className="text-caption text-text-primary mb-1 font-medium">
                Configuration Warnings
              </p>
              <ul className="text-caption text-text-secondary space-y-1">
                {warnings.map((warning, index) => (
                  <li key={index}>• {warning}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
      {children}
    </>
  );
}
