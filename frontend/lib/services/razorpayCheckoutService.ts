/**
 * Razorpay Checkout Service
 *
 * Production-ready service for handling Razorpay payments with custom checkout UI
 * Integrates with the actual Razorpay SDK for secure payment processing
 */

import type { CheckoutFormData } from '@/types/checkout';
import type { RazorpayOptions, RazorpayInstance } from '@/types/razorpay';

interface CreateOrderResponse {
  success: boolean;
  order: {
    id: string;
    amount: number;
    currency: string;
    receipt: string;
  };
  breakdown: {
    baseAmount: number;
    gstAmount: number;
    totalAmount: number;
  };
  prefill: {
    name: string;
    email: string;
    contact: string;
  };
}

interface PaymentVerificationResponse {
  success: boolean;
  message: string;
  subscription?: {
    tier: string;
    billingCycle: string;
    status: string;
    nextBillingDate: string;
  };
}

interface PaymentActivationResponse {
  success: boolean;
  message: string;
  subscription: {
    id?: string;
    tier: string;
    billingCycle: string;
    status: string;
    startsAt?: string;
    endsAt?: string;
  };
  payment?: {
    orderId: string;
    paymentId: string;
    amount: number;
    currency: string;
  };
  redirectUrl?: string;
}

/**
 * Load Razorpay script dynamically
 */
function loadRazorpayScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window !== 'undefined' && window.Razorpay) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Razorpay SDK'));
    document.body.appendChild(script);
  });
}

/**
 * Create a Razorpay order
 */
export async function createRazorpayOrder(
  tier: string,
  billingCycle: 'monthly' | 'annual',
  amount?: number,
  seats?: number
): Promise<CreateOrderResponse> {
  const body: any = {
    tier,
    billingCycle,
    currency: 'INR',
  };

  // Add optional amount and seats for team plans
  if (amount !== undefined) {
    body.amount = amount;
  }
  if (seats !== undefined) {
    body.seats = seats;
  }

  const response = await fetch('/api/payments/create-order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create order');
  }

  return response.json();
}

/**
 * Process card payment using Razorpay SDK
 */
export async function processCardPayment(
  orderId: string,
  amount: number,
  formData: CheckoutFormData,
  prefill: { name: string; email: string; contact: string }
): Promise<{ paymentId: string; signature: string }> {
  // Ensure Razorpay script is loaded
  await loadRazorpayScript();

  if (!window.Razorpay) {
    throw new Error('Razorpay SDK not available');
  }

  return new Promise((resolve, reject) => {
    const options: RazorpayOptions = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
      amount: amount * 100, // Amount in paise
      currency: 'INR',
      order_id: orderId,
      name: 'Smartslate Polaris',
      description: 'AI-Assisted Learning Experience Design',
      image: '/logo.png',
      prefill: {
        name: formData.nameOnCard || prefill.name,
        email: prefill.email,
        contact: prefill.contact,
      },
      theme: {
        color: '#4F46E5', // Brand indigo
        backdrop_color: '#020C1B', // Deep space background
      },
      modal: {
        ondismiss: () => {
          reject(new Error('Payment cancelled by user'));
        },
      },
      handler: (response: any) => {
        resolve({
          paymentId: response.razorpay_payment_id,
          signature: response.razorpay_signature,
        });
      },
      method: {
        card: true,
        netbanking: false,
        wallet: false,
        upi: false,
      },
    };

    const razorpay = new window.Razorpay(options);

    // For card payments with custom UI, we need to use the card number tokenization
    // This requires additional setup with Razorpay's card tokenization API
    // For now, we'll open the standard checkout with card-only option
    razorpay.open();
  });
}

/**
 * Process UPI payment
 */
export async function processUPIPayment(
  orderId: string,
  amount: number,
  formData: CheckoutFormData,
  prefill: { name: string; email: string; contact: string }
): Promise<{ paymentId: string; signature: string }> {
  await loadRazorpayScript();

  if (!window.Razorpay) {
    throw new Error('Razorpay SDK not available');
  }

  return new Promise((resolve, reject) => {
    const options: RazorpayOptions = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
      amount: amount * 100,
      currency: 'INR',
      order_id: orderId,
      name: 'Smartslate Polaris',
      description: 'AI-Assisted Learning Experience Design',
      image: '/logo.png',
      prefill: {
        name: prefill.name,
        email: prefill.email,
        contact: prefill.contact,
      },
      theme: {
        color: '#4F46E5',
        backdrop_color: '#020C1B',
      },
      modal: {
        ondismiss: () => {
          reject(new Error('Payment cancelled by user'));
        },
      },
      handler: (response: any) => {
        resolve({
          paymentId: response.razorpay_payment_id,
          signature: response.razorpay_signature,
        });
      },
      method: {
        card: false,
        netbanking: false,
        wallet: false,
        upi: true,
      },
      config: {
        display: {
          blocks: {
            banks: {
              name: 'UPI Apps',
              instruments: [{ method: 'upi' }],
            },
          },
          sequence: ['block.banks'],
          preferences: {
            show_default_blocks: false,
          },
        },
      },
    };

    // If UPI ID is provided, add it to options
    if (formData.upiId) {
      options.prefill = {
        ...options.prefill,
        vpa: formData.upiId,
      };
    }

    const razorpay = new window.Razorpay(options);
    razorpay.open();
  });
}

/**
 * Process Netbanking payment
 */
export async function processNetbankingPayment(
  orderId: string,
  amount: number,
  formData: CheckoutFormData,
  prefill: { name: string; email: string; contact: string }
): Promise<{ paymentId: string; signature: string }> {
  await loadRazorpayScript();

  if (!window.Razorpay) {
    throw new Error('Razorpay SDK not available');
  }

  return new Promise((resolve, reject) => {
    const options: RazorpayOptions = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
      amount: amount * 100,
      currency: 'INR',
      order_id: orderId,
      name: 'Smartslate Polaris',
      description: 'AI-Assisted Learning Experience Design',
      image: '/logo.png',
      prefill: {
        name: prefill.name,
        email: prefill.email,
        contact: prefill.contact,
      },
      theme: {
        color: '#4F46E5',
        backdrop_color: '#020C1B',
      },
      modal: {
        ondismiss: () => {
          reject(new Error('Payment cancelled by user'));
        },
      },
      handler: (response: any) => {
        resolve({
          paymentId: response.razorpay_payment_id,
          signature: response.razorpay_signature,
        });
      },
      method: {
        card: false,
        netbanking: true,
        wallet: false,
        upi: false,
      },
    };

    // If bank is selected, add it to options
    if (formData.bankCode) {
      options.prefill = {
        ...options.prefill,
        bank: formData.bankCode,
      };
    }

    const razorpay = new window.Razorpay(options);
    razorpay.open();
  });
}

/**
 * Process Wallet payment
 */
export async function processWalletPayment(
  orderId: string,
  amount: number,
  formData: CheckoutFormData,
  prefill: { name: string; email: string; contact: string }
): Promise<{ paymentId: string; signature: string }> {
  await loadRazorpayScript();

  if (!window.Razorpay) {
    throw new Error('Razorpay SDK not available');
  }

  return new Promise((resolve, reject) => {
    const options: RazorpayOptions = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
      amount: amount * 100,
      currency: 'INR',
      order_id: orderId,
      name: 'Smartslate Polaris',
      description: 'AI-Assisted Learning Experience Design',
      image: '/logo.png',
      prefill: {
        name: prefill.name,
        email: prefill.email,
        contact: prefill.contact,
      },
      theme: {
        color: '#4F46E5',
        backdrop_color: '#020C1B',
      },
      modal: {
        ondismiss: () => {
          reject(new Error('Payment cancelled by user'));
        },
      },
      handler: (response: any) => {
        resolve({
          paymentId: response.razorpay_payment_id,
          signature: response.razorpay_signature,
        });
      },
      method: {
        card: false,
        netbanking: false,
        wallet: true,
        upi: false,
      },
    };

    // If wallet is selected, add it to options
    if (formData.walletProvider) {
      options.prefill = {
        ...options.prefill,
        wallet: formData.walletProvider.toLowerCase(),
      };
    }

    const razorpay = new window.Razorpay(options);
    razorpay.open();
  });
}

/**
 * Verify payment on server
 */
export async function verifyPayment(
  orderId: string,
  paymentId: string,
  signature: string,
  paymentMethod: string,
  metadata?: {
    tier: string;
    billingCycle: string;
    amount: number;
  }
): Promise<PaymentVerificationResponse> {
  const response = await fetch('/api/payments/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      razorpay_order_id: orderId,
      razorpay_payment_id: paymentId,
      razorpay_signature: signature,
      paymentMethod,
      metadata,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Payment verification failed');
  }

  return response.json();
}

// Removed activateSubscription function as subscription activation
// is now handled directly in the verify endpoint

/**
 * Process complete payment flow
 */
export async function processPayment(
  formData: CheckoutFormData,
  tier: string,
  billingCycle: 'monthly' | 'annual',
  amount: number
): Promise<PaymentActivationResponse> {
  try {
    // Step 1: Create order
    const orderData = await createRazorpayOrder(tier, billingCycle);

    // Step 2: Process payment based on method
    let paymentResult: { paymentId: string; signature: string };

    switch (formData.paymentMethod) {
      case 'card':
        paymentResult = await processCardPayment(
          orderData.order.id,
          orderData.order.amount,
          formData,
          orderData.prefill
        );
        break;

      case 'upi':
        paymentResult = await processUPIPayment(
          orderData.order.id,
          orderData.order.amount,
          formData,
          orderData.prefill
        );
        break;

      case 'netbanking':
        paymentResult = await processNetbankingPayment(
          orderData.order.id,
          orderData.order.amount,
          formData,
          orderData.prefill
        );
        break;

      case 'wallet':
        paymentResult = await processWalletPayment(
          orderData.order.id,
          orderData.order.amount,
          formData,
          orderData.prefill
        );
        break;

      default:
        throw new Error('Invalid payment method');
    }

    // Step 3: Verify payment and activate subscription
    const verificationResult = await verifyPayment(
      orderData.order.id,
      paymentResult.paymentId,
      paymentResult.signature,
      formData.paymentMethod,
      {
        tier,
        billingCycle,
        amount,
      }
    );

    // Return the verification result as activation response
    // The verify endpoint already handles subscription activation
    return {
      success: verificationResult.success,
      message: verificationResult.message,
      subscription: verificationResult.subscription || {
        tier,
        billingCycle,
        status: 'active',
      },
      payment: {
        orderId: orderData.order.id,
        paymentId: paymentResult.paymentId,
        amount: orderData.order.amount,
        currency: orderData.order.currency,
      },
      redirectUrl: '/dashboard', // Default redirect after successful payment
    };
  } catch (error) {
    console.error('Payment processing failed:', error);
    throw error;
  }
}

/**
 * Initialize Razorpay for custom checkout
 */
export async function initializeRazorpay(): Promise<boolean> {
  try {
    await loadRazorpayScript();
    return !!window.Razorpay;
  } catch (error) {
    console.error('Failed to initialize Razorpay:', error);
    return false;
  }
}

/**
 * Add backdrop blur effect to page
 */
function addBackdropBlur(): () => void {
  // Create backdrop element
  const backdrop = document.createElement('div');
  backdrop.id = 'razorpay-backdrop-blur';
  backdrop.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(2, 12, 27, 0.3);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    z-index: 999998;
    pointer-events: none;
    transition: all 0.3s ease-in-out;
  `;

  document.body.appendChild(backdrop);

  // Prevent body scroll
  document.body.style.overflow = 'hidden';

  // Return cleanup function
  return () => {
    backdrop.style.opacity = '0';
    setTimeout(() => {
      backdrop.remove();
      document.body.style.overflow = '';
    }, 300);
  };
}

/**
 * Open Razorpay checkout directly with all payment methods
 */
export async function openRazorpayCheckout(
  tier: string,
  billingCycle: 'monthly' | 'annual',
  amount: number,
  seats?: number
): Promise<PaymentActivationResponse> {
  let removeBackdrop: (() => void) | null = null;

  try {
    // Step 1: Load Razorpay script
    await loadRazorpayScript();

    if (!window.Razorpay) {
      throw new Error('Razorpay SDK not available');
    }

    // Step 2: Create order (pass amount and seats for team plans)
    const orderData = await createRazorpayOrder(tier, billingCycle, amount, seats);

    // Step 3: Add backdrop blur
    removeBackdrop = addBackdropBlur();

    // Step 4: Open Razorpay checkout with all payment methods
    return new Promise((resolve, reject) => {
      const options: RazorpayOptions = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
        amount: orderData.order.amount * 100, // Amount in paise
        currency: 'INR',
        order_id: orderData.order.id,
        name: 'Smartslate Polaris',
        description: 'AI-Assisted Learning Experience Design',
        image: '/logo.png',
        prefill: {
          name: orderData.prefill.name,
          email: orderData.prefill.email,
          contact: orderData.prefill.contact,
        },
        theme: {
          color: '#4F46E5', // Brand indigo
          backdrop_color: '#020C1B', // Deep space background
        },
        modal: {
          ondismiss: () => {
            // Remove backdrop on dismiss
            if (removeBackdrop) removeBackdrop();
            reject(new Error('Payment cancelled by user'));
          },
        },
        handler: async (response: any) => {
          try {
            // Verify payment on server
            const verificationResult = await verifyPayment(
              response.razorpay_order_id,
              response.razorpay_payment_id,
              response.razorpay_signature,
              'card', // Default to card, server will detect actual method
              {
                tier,
                billingCycle,
                amount,
              }
            );

            // Remove backdrop on success
            if (removeBackdrop) removeBackdrop();

            resolve({
              success: verificationResult.success,
              message: verificationResult.message,
              subscription: verificationResult.subscription || {
                tier,
                billingCycle,
                status: 'active',
              },
              payment: {
                orderId: response.razorpay_order_id,
                paymentId: response.razorpay_payment_id,
                amount: orderData.order.amount,
                currency: orderData.order.currency,
              },
              redirectUrl: '/dashboard',
            });
          } catch (error) {
            // Remove backdrop on error
            if (removeBackdrop) removeBackdrop();
            reject(error);
          }
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    });
  } catch (error) {
    // Remove backdrop on error during setup
    if (removeBackdrop) removeBackdrop();
    console.error('Razorpay checkout failed:', error);
    throw error;
  }
}
