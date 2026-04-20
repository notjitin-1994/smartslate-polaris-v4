/**
 * UPI Payment Form Component
 * UPI ID input with verification
 */

'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Smartphone, AlertCircle, CheckCircle2, QrCode } from 'lucide-react';
import { upiPaymentSchema, type UPIPaymentFormData } from '@/lib/validation/checkoutSchemas';

interface UPIPaymentFormProps {
  onSubmit: (data: UPIPaymentFormData) => void;
  isProcessing?: boolean;
}

export function UPIPaymentForm({ onSubmit, isProcessing = false }: UPIPaymentFormProps) {
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [showQR, setShowQR] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    trigger,
  } = useForm<UPIPaymentFormData>({
    resolver: zodResolver(upiPaymentSchema),
    mode: 'onBlur',
    defaultValues: {
      upiId: '',
    },
  });

  const upiId = watch('upiId', '');

  const handleVerifyUPI = async () => {
    const isValid = await trigger('upiId');
    if (!isValid) return;

    setIsVerifying(true);
    // Simulate verification delay
    setTimeout(() => {
      setIsVerifying(false);
      setIsVerified(true);
    }, 1500);
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* UPI ID Input */}
        <div className="space-y-2">
          <label htmlFor="upiId" className="text-caption text-text-primary font-medium">
            UPI ID
          </label>
          <div className="relative">
            <div className="absolute top-1/2 left-3 -translate-y-1/2">
              <Smartphone className="text-text-disabled h-5 w-5" aria-hidden="true" />
            </div>
            <input
              id="upiId"
              type="text"
              placeholder="yourname@bankname"
              {...register('upiId')}
              disabled={isProcessing || isVerifying}
              onChange={() => setIsVerified(false)}
              className={`bg-background-surface/50 text-text-primary placeholder:text-text-disabled focus:ring-primary-accent/50 focus:border-primary-accent/50 min-h-[44px] w-full rounded-md border px-4 py-3 pr-11 pl-11 backdrop-blur-sm transition-all duration-200 focus:ring-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 ${
                errors.upiId
                  ? 'border-error'
                  : isVerified
                    ? 'border-success'
                    : 'border-white/10 hover:border-white/20'
              } `}
              aria-invalid={errors.upiId ? 'true' : 'false'}
              aria-describedby={errors.upiId ? 'upiId-error' : undefined}
            />
            {isVerified && (
              <div className="absolute top-1/2 right-3 -translate-y-1/2">
                <CheckCircle2 className="text-success h-5 w-5" aria-hidden="true" />
              </div>
            )}
          </div>
          {errors.upiId && (
            <p
              id="upiId-error"
              className="text-caption text-error flex items-center gap-1"
              role="alert"
            >
              <AlertCircle className="h-3 w-3" aria-hidden="true" />
              {errors.upiId.message}
            </p>
          )}
        </div>

        {/* Verify Button */}
        {!isVerified && (
          <button
            type="button"
            onClick={handleVerifyUPI}
            disabled={isVerifying || isProcessing || !upiId?.trim()}
            className="bg-background-surface/50 border-primary-accent/30 text-primary-accent hover:bg-primary-accent/10 focus-visible:ring-primary-accent/50 min-h-[44px] w-full rounded-md border px-6 py-3 font-medium backdrop-blur-sm transition-all duration-200 focus-visible:ring-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isVerifying ? 'Verifying...' : 'Verify UPI ID'}
          </button>
        )}

        {/* Verified Badge */}
        {isVerified && (
          <div className="bg-success/10 border-success/20 flex items-center gap-2 rounded-md border px-4 py-3">
            <CheckCircle2 className="text-success h-5 w-5" aria-hidden="true" />
            <span className="text-caption text-success font-medium">
              UPI ID verified successfully
            </span>
          </div>
        )}
      </form>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-white/10"></div>
        </div>
        <div className="text-caption relative flex justify-center">
          <span className="bg-background-dark text-text-disabled px-4">OR</span>
        </div>
      </div>

      {/* QR Code Option */}
      <button
        type="button"
        onClick={() => setShowQR(!showQR)}
        className="glass-card hover-lift text-text-primary focus-visible:ring-primary-accent/50 flex min-h-[44px] w-full items-center justify-center gap-2 rounded-md px-6 py-3 font-medium transition-all duration-200 focus-visible:ring-2 focus-visible:outline-none"
      >
        <QrCode className="h-5 w-5" aria-hidden="true" />
        {showQR ? 'Hide QR Code' : 'Pay with QR Code'}
      </button>

      {/* QR Code Display */}
      {showQR && (
        <div className="glass-card animate-fade-in-up space-y-4 p-6">
          <div className="space-y-2 text-center">
            <h4 className="text-body text-text-primary font-semibold">Scan to Pay</h4>
            <p className="text-caption text-text-secondary">
              Use any UPI app to scan and complete payment
            </p>
          </div>

          {/* QR Code Placeholder */}
          <div className="mx-auto aspect-square max-w-[240px] rounded-lg bg-white p-4">
            <div className="flex h-full w-full items-center justify-center rounded bg-gradient-to-br from-gray-200 to-gray-300">
              <QrCode className="h-16 w-16 text-gray-400" aria-hidden="true" />
            </div>
          </div>

          {/* Supported Apps */}
          <div className="space-y-2">
            <p className="text-caption text-text-disabled text-center">Supported UPI Apps</p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              {['GPay', 'PhonePe', 'Paytm', 'BHIM', 'Amazon Pay'].map((app) => (
                <span
                  key={app}
                  className="text-caption text-text-secondary rounded-md border border-white/10 bg-white/5 px-3 py-1.5"
                >
                  {app}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Popular UPI Apps Info */}
      <div className="glass-card space-y-2 p-4">
        <h4 className="text-caption text-text-primary font-semibold">Quick Tips</h4>
        <ul className="text-small text-text-secondary space-y-1">
          <li className="flex items-start gap-2">
            <span className="text-primary-accent mt-0.5">•</span>
            <span>Enter your UPI ID in the format: username@bankname</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary-accent mt-0.5">•</span>
            <span>You'll receive a payment request in your UPI app</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary-accent mt-0.5">•</span>
            <span>Approve the request to complete your payment</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
