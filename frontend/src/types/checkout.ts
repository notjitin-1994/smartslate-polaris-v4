/**
 * Type definitions for Custom Checkout System
 * Smartslate Polaris - Premium Checkout Experience
 */

export type PaymentMethod = 'card' | 'upi' | 'netbanking' | 'wallet';

export type CardType = 'visa' | 'mastercard' | 'amex' | 'rupay' | 'unknown';

export type BankCode = 'HDFC' | 'ICIC' | 'SBIN' | 'UTIB' | 'KKBK' | 'OTHER';

export type WalletProvider =
  | 'paytm'
  | 'phonepe'
  | 'amazonpay'
  | 'mobikwik'
  | 'freecharge'
  | 'airtel';

export interface OrderDetails {
  planName: string;
  tier: string;
  billingCycle: 'monthly' | 'yearly';
  basePrice: number;
  gst: number;
  totalAmount: number;
  currency: 'INR';
}

export interface CardPaymentData {
  cardNumber: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
  nameOnCard: string;
  saveCard: boolean;
}

export interface UPIPaymentData {
  upiId: string;
  verified?: boolean;
}

export interface NetbankingPaymentData {
  bankCode: BankCode;
  bankName?: string;
}

export interface WalletPaymentData {
  provider: WalletProvider;
}

export type PaymentData =
  | { method: 'card'; data: CardPaymentData }
  | { method: 'upi'; data: UPIPaymentData }
  | { method: 'netbanking'; data: NetbankingPaymentData }
  | { method: 'wallet'; data: WalletPaymentData };

// Add the missing CheckoutFormData type
export interface CheckoutFormData {
  paymentMethod: PaymentMethod;
  cardNumber?: string;
  expiryMonth?: string;
  expiryYear?: string;
  cvv?: string;
  nameOnCard?: string;
  saveCard?: boolean;
  upiId?: string;
  bankCode?: BankCode;
  bankName?: string;
  walletProvider?: WalletProvider;
}

// Payment Status type for UI state management
export type PaymentStatus = 'idle' | 'processing' | 'success' | 'error';

export interface CheckoutState {
  isOpen: boolean;
  isProcessing: boolean;
  error: string | null;
  success: boolean;
  selectedMethod: PaymentMethod;
  orderDetails: OrderDetails;
}

export interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderDetails: OrderDetails;
  onPaymentSuccess: (response: RazorpaySuccessResponse) => void;
  onPaymentError: (error: RazorpayErrorResponse) => void;
}

export interface RazorpaySuccessResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export interface RazorpayErrorResponse {
  code: string;
  description: string;
  source: string;
  step: string;
  reason: string;
  metadata: {
    order_id: string;
    payment_id: string;
  };
}

export interface Bank {
  code: BankCode;
  name: string;
  logo?: string;
  popular: boolean;
}

export interface Wallet {
  provider: WalletProvider;
  name: string;
  logo?: string;
  available: boolean;
}
