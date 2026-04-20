/**
 * Zod Validation Schemas for Checkout Forms
 * SmartSlate Polaris - Payment Data Validation
 */

import { z } from 'zod';

/**
 * Card number validation with Luhn algorithm
 */
const luhnCheck = (cardNumber: string): boolean => {
  const digits = cardNumber.replace(/\D/g, '');
  let sum = 0;
  let isEven = false;

  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits[i], 10);

    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0;
};

/**
 * Card Payment Schema
 */
export const cardPaymentSchema = z.object({
  cardNumber: z
    .string()
    .min(1, 'Card number is required')
    .regex(/^\d{13,19}$/, 'Card number must be 13-19 digits')
    .refine(luhnCheck, 'Invalid card number'),
  expiryMonth: z.string().regex(/^(0[1-9]|1[0-2])$/, 'Invalid month (01-12)'),
  expiryYear: z
    .string()
    .regex(/^\d{2}$/, 'Invalid year (YY format)')
    .refine((year) => {
      const currentYear = new Date().getFullYear() % 100;
      const inputYear = parseInt(year, 10);
      return inputYear >= currentYear && inputYear <= currentYear + 20;
    }, 'Card has expired or invalid year'),
  cvv: z.string().regex(/^\d{3,4}$/, 'CVV must be 3-4 digits'),
  nameOnCard: z
    .string()
    .min(1, 'Name on card is required')
    .regex(/^[a-zA-Z\s]+$/, 'Name can only contain letters and spaces')
    .min(3, 'Name must be at least 3 characters')
    .max(50, 'Name must not exceed 50 characters'),
  saveCard: z.boolean().optional().default(false),
});

export type CardPaymentFormData = z.infer<typeof cardPaymentSchema>;

/**
 * UPI Payment Schema
 */
export const upiPaymentSchema = z.object({
  upiId: z
    .string()
    .min(1, 'UPI ID is required')
    .regex(/^[a-zA-Z0-9._-]+@[a-zA-Z0-9]+$/, 'Invalid UPI ID format (e.g., user@bank)')
    .max(50, 'UPI ID too long'),
  verified: z.boolean().optional(),
});

export type UPIPaymentFormData = z.infer<typeof upiPaymentSchema>;

/**
 * Netbanking Payment Schema
 */
export const netbankingPaymentSchema = z.object({
  bankCode: z.enum(['HDFC', 'ICIC', 'SBIN', 'UTIB', 'KKBK', 'OTHER'], {
    errorMap: () => ({ message: 'Please select a bank' }),
  }),
  bankName: z.string().optional(),
});

export type NetbankingPaymentFormData = z.infer<typeof netbankingPaymentSchema>;

/**
 * Wallet Payment Schema
 */
export const walletPaymentSchema = z.object({
  provider: z.enum(['paytm', 'phonepe', 'amazonpay', 'mobikwik', 'freecharge', 'airtel'], {
    errorMap: () => ({ message: 'Please select a wallet provider' }),
  }),
});

export type WalletPaymentFormData = z.infer<typeof walletPaymentSchema>;

/**
 * Utility function to detect card type from number
 */
export const detectCardType = (cardNumber: string): string => {
  const sanitized = cardNumber.replace(/\D/g, '');

  if (/^4/.test(sanitized)) return 'visa';
  if (/^5[1-5]/.test(sanitized)) return 'mastercard';
  if (/^3[47]/.test(sanitized)) return 'amex';
  if (/^(6|60|65|508|353)/.test(sanitized)) return 'rupay';

  return 'unknown';
};

/**
 * Format card number with spaces for display
 */
export const formatCardNumber = (cardNumber: string): string => {
  const sanitized = cardNumber.replace(/\D/g, '');
  const groups = sanitized.match(/.{1,4}/g) || [];
  return groups.join(' ');
};

/**
 * Format expiry date for display
 */
export const formatExpiryDate = (month: string, year: string): string => {
  if (!month || !year) return '';
  return `${month}/${year}`;
};
