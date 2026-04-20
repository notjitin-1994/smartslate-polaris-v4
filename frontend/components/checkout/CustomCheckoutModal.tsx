/**
 * Custom Checkout Modal Component
 * Premium branded checkout experience for SmartSlate Polaris
 */

'use client';

import { useState, useEffect } from 'react';
import { X, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import type {
  CheckoutModalProps,
  PaymentMethod,
  PaymentData,
  CheckoutFormData,
  PaymentStatus,
} from '@/types/checkout';
import { OrderSummary } from './OrderSummary';
import { PaymentMethodTabs } from './PaymentMethodTabs';
import { CardPaymentForm } from './CardPaymentForm';
import { UPIPaymentForm } from './UPIPaymentForm';
import { NetbankingForm } from './NetbankingForm';
import { WalletSelector } from './WalletSelector';
import { SecurityBadges } from './SecurityBadges';
import { processPayment } from '@/lib/services/razorpayCheckoutService';
import { CheckoutModalPortal } from './CheckoutModalPortal';

export function CustomCheckoutModal({
  isOpen,
  onClose,
  orderDetails,
  onPaymentSuccess,
  onPaymentError,
}: CheckoutModalProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setPaymentStatus('idle');
      setErrorMessage(null);
    }
  }, [isOpen]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handlePaymentSubmit = async (paymentData: any) => {
    setIsProcessing(true);
    setPaymentStatus('processing');
    setErrorMessage(null);

    try {
      // Add paymentMethod to the form data
      const checkoutData: CheckoutFormData = {
        paymentMethod: selectedMethod,
        ...paymentData,
        // Map wallet provider if it's wallet payment
        walletProvider: paymentData.provider,
      };

      console.log('Processing payment with data:', {
        paymentMethod: checkoutData.paymentMethod,
        tier: orderDetails.tier,
        billingCycle: orderDetails.billingCycle,
        amount: orderDetails.totalAmount,
      });

      // Process payment using Razorpay SDK
      const result = await processPayment(
        checkoutData,
        orderDetails.tier,
        orderDetails.billingCycle === 'yearly' ? 'annual' : 'monthly',
        orderDetails.totalAmount
      );

      setPaymentStatus('success');
      onPaymentSuccess(result);

      // Redirect after success
      if (result.redirectUrl) {
        setTimeout(() => {
          window.location.href = result.redirectUrl;
        }, 2000);
      } else {
        // Close modal after success animation
        setTimeout(() => {
          onClose();
        }, 2000);
      }
    } catch (error) {
      console.error('Payment error:', error);
      setPaymentStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Payment failed. Please try again.');

      const paymentError = {
        code: 'PAYMENT_FAILED',
        description: error instanceof Error ? error.message : 'Payment could not be processed',
        source: 'api',
        step: 'payment',
        metadata: {
          timestamp: Date.now(),
        },
      };

      onPaymentError(error instanceof Error ? error : new Error('Payment failed'));
    } finally {
      setIsProcessing(false);
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleClose = () => {
    if (!isProcessing) {
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && !isProcessing) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <CheckoutModalPortal>
      <div
        className="fixed inset-0 z-[9999] overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="checkout-modal-title"
        onKeyDown={handleKeyDown}
      >
        {/* Backdrop */}
        <div
          className="bg-background-dark/80 fixed inset-0 backdrop-blur-sm transition-opacity"
          onClick={handleClose}
          aria-hidden="true"
        />

        {/* Modal Container */}
        <div className="pointer-events-none fixed inset-0 flex items-center justify-center p-4">
          <div
            className="glass-card animate-fade-in-up pointer-events-auto relative w-full max-w-4xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="border-b border-white/10 px-6 py-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-1">
                  <h2
                    id="checkout-modal-title"
                    className="text-title text-primary-accent font-semibold"
                  >
                    Polaris {orderDetails.tier}:{' '}
                    {orderDetails.billingCycle === 'monthly' ? 'Monthly' : 'Yearly'}
                  </h2>
                  <p className="text-body text-text-secondary">
                    AI-Assisted Learning Experience Design
                  </p>
                </div>
                <button
                  onClick={handleClose}
                  disabled={isProcessing}
                  className="focus-visible:ring-primary-accent/50 min-h-[44px] min-w-[44px] rounded-md p-2 transition-all duration-200 hover:bg-white/10 focus-visible:ring-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label="Close checkout"
                >
                  <X className="text-text-secondary h-6 w-6" aria-hidden="true" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Left Column - Payment Form */}
                <div className="space-y-6 lg:col-span-2">
                  {/* Payment Method Tabs */}
                  <PaymentMethodTabs
                    selectedMethod={selectedMethod}
                    onMethodChange={setSelectedMethod}
                  />

                  {/* Payment Forms */}
                  <div
                    role="tabpanel"
                    id={`${selectedMethod}-panel`}
                    aria-labelledby={`${selectedMethod}-tab`}
                    className="animate-fade-in-up"
                  >
                    {selectedMethod === 'card' && (
                      <CardPaymentForm onSubmit={handlePaymentSubmit} isProcessing={isProcessing} />
                    )}
                    {selectedMethod === 'upi' && (
                      <UPIPaymentForm onSubmit={handlePaymentSubmit} isProcessing={isProcessing} />
                    )}
                    {selectedMethod === 'netbanking' && (
                      <NetbankingForm onSubmit={handlePaymentSubmit} isProcessing={isProcessing} />
                    )}
                    {selectedMethod === 'wallet' && (
                      <WalletSelector onSubmit={handlePaymentSubmit} isProcessing={isProcessing} />
                    )}
                  </div>
                </div>

                {/* Right Column - Order Summary */}
                <div className="space-y-6 lg:col-span-1">
                  <OrderSummary orderDetails={orderDetails} />

                  {/* Payment Status Messages */}
                  {paymentStatus === 'success' && (
                    <div className="glass-card border-success/30 bg-success/5 animate-fade-in-up border p-4">
                      <div className="flex items-start gap-3">
                        <CheckCircle2
                          className="text-success mt-0.5 h-5 w-5 flex-shrink-0"
                          aria-hidden="true"
                        />
                        <div className="space-y-1">
                          <p className="text-caption text-success font-semibold">
                            Payment Successful!
                          </p>
                          <p className="text-small text-text-secondary">
                            Your subscription is now active
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {paymentStatus === 'error' && errorMessage && (
                    <div className="glass-card border-error/30 bg-error/5 animate-fade-in-up border p-4">
                      <div className="flex items-start gap-3">
                        <AlertCircle
                          className="text-error mt-0.5 h-5 w-5 flex-shrink-0"
                          aria-hidden="true"
                        />
                        <div className="space-y-1">
                          <p className="text-caption text-error font-semibold">Payment Failed</p>
                          <p className="text-small text-text-secondary">{errorMessage}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="space-y-4 border-t border-white/10 px-6 py-5">
              {/* Pay Button */}
              <button
                type="submit"
                form="payment-form"
                onClick={() => {
                  // Trigger form submission based on selected method
                  const formElement = document.querySelector('form');
                  if (formElement) {
                    formElement.requestSubmit();
                  }
                }}
                disabled={isProcessing || paymentStatus === 'success'}
                className="bg-secondary-accent hover:bg-secondary-accent-dark text-body focus-visible:ring-secondary-accent/50 flex min-h-[56px] w-full items-center justify-center gap-3 rounded-md px-8 py-4 font-semibold text-white shadow-lg transition-all duration-200 hover:shadow-xl focus-visible:ring-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                    <span>Processing Payment...</span>
                  </>
                ) : paymentStatus === 'success' ? (
                  <>
                    <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
                    <span>Payment Successful</span>
                  </>
                ) : (
                  <>
                    <span>Pay {formatCurrency(orderDetails.totalAmount)}</span>
                  </>
                )}
              </button>

              {/* Security Badges */}
              <SecurityBadges />
            </div>
          </div>
        </div>
      </div>
    </CheckoutModalPortal>
  );
}
