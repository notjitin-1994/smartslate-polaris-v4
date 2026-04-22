/**
 * Razorpay Integration Utilities
 * Helper functions for integrating custom checkout with Razorpay API
 */

import type {
  CardPaymentFormData,
  UPIPaymentFormData,
  NetbankingPaymentFormData,
  WalletPaymentFormData,
  RazorpaySuccessResponse,
  RazorpayErrorResponse,
} from '@/types/checkout';

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpaySuccessResponse) => void;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: Record<string, string>;
  theme?: {
    color?: string;
  };
  modal?: {
    ondismiss?: () => void;
  };
}

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => {
      open: () => void;
      close: () => void;
    };
  }
}

/**
 * Initialize Razorpay payment with custom data
 */
export async function initiateRazorpayPayment(options: RazorpayOptions): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window.Razorpay === 'undefined') {
      reject(new Error('Razorpay SDK not loaded'));
      return;
    }

    const razorpayOptions: RazorpayOptions = {
      ...options,
      theme: {
        color: '#4F46E5', // Polaris secondary accent (indigo)
      },
      modal: {
        ondismiss: () => {
          reject(new Error('Payment cancelled by user'));
        },
      },
    };

    const razorpayInstance = new window.Razorpay(razorpayOptions);
    razorpayInstance.open();
    resolve();
  });
}

/**
 * Create Razorpay order via API
 */
export async function createRazorpayOrder(
  amount: number,
  currency: string = 'INR'
): Promise<{ order_id: string; amount: number }> {
  try {
    const response = await fetch('/api/payment/create-order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: amount * 100, // Convert to paise
        currency,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create order');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Create order error:', error);
    throw error;
  }
}

/**
 * Verify payment signature on server
 */
export async function verifyPaymentSignature(
  response: RazorpaySuccessResponse
): Promise<{ verified: boolean }> {
  try {
    const verifyResponse = await fetch('/api/payment/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(response),
    });

    if (!verifyResponse.ok) {
      throw new Error('Payment verification failed');
    }

    const data = await verifyResponse.json();
    return data;
  } catch (error) {
    console.error('Verify payment error:', error);
    throw error;
  }
}

/**
 * Process card payment through Razorpay
 */
export async function processCardPayment(
  cardData: CardPaymentFormData,
  orderId: string,
  amount: number
): Promise<RazorpaySuccessResponse> {
  // Note: Razorpay handles card processing internally
  // This is a placeholder for custom card processing logic if needed
  console.log('Processing card payment:', { cardData, orderId, amount });

  // In practice, you'd call Razorpay's card payment method
  throw new Error('Card payment processing not implemented');
}

/**
 * Process UPI payment through Razorpay
 */
export async function processUPIPayment(
  upiData: UPIPaymentFormData,
  orderId: string,
  amount: number
): Promise<RazorpaySuccessResponse> {
  console.log('Processing UPI payment:', { upiData, orderId, amount });

  // Razorpay UPI payment implementation
  throw new Error('UPI payment processing not implemented');
}

/**
 * Process netbanking payment through Razorpay
 */
export async function processNetbankingPayment(
  netbankingData: NetbankingPaymentFormData,
  orderId: string,
  amount: number
): Promise<RazorpaySuccessResponse> {
  console.log('Processing netbanking payment:', {
    netbankingData,
    orderId,
    amount,
  });

  // Razorpay netbanking payment implementation
  throw new Error('Netbanking payment processing not implemented');
}

/**
 * Process wallet payment through Razorpay
 */
export async function processWalletPayment(
  walletData: WalletPaymentFormData,
  orderId: string,
  amount: number
): Promise<RazorpaySuccessResponse> {
  console.log('Processing wallet payment:', { walletData, orderId, amount });

  // Razorpay wallet payment implementation
  throw new Error('Wallet payment processing not implemented');
}

/**
 * Load Razorpay SDK script
 */
export function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window.Razorpay !== 'undefined') {
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

/**
 * Format Razorpay error for display
 */
export function formatRazorpayError(error: RazorpayErrorResponse): string {
  const errorMessages: Record<string, string> = {
    BAD_REQUEST_ERROR: 'Invalid payment details. Please check and try again.',
    GATEWAY_ERROR: 'Payment gateway error. Please try again later.',
    SERVER_ERROR: 'Server error. Please try again later.',
    PAYMENT_DECLINED: 'Payment declined by your bank. Please try another method.',
    INSUFFICIENT_FUNDS: 'Insufficient funds in your account.',
    NETWORK_ERROR: 'Network error. Please check your connection and try again.',
  };

  return errorMessages[error.code] || error.description || 'Payment failed. Please try again.';
}
