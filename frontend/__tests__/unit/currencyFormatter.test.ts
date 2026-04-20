/**
 * Tests for currency formatter utility
 */

import { describe, it, expect } from 'vitest';
import {
  formatCurrency,
  getCurrencySymbol,
  getCurrencyLocale,
  parseCurrency,
} from '@/lib/utils/currencyFormatter';

describe('currencyFormatter', () => {
  describe('getCurrencySymbol', () => {
    it('should return correct symbols for common currencies', () => {
      expect(getCurrencySymbol('USD')).toBe('$');
      expect(getCurrencySymbol('EUR')).toBe('€');
      expect(getCurrencySymbol('GBP')).toBe('£');
      expect(getCurrencySymbol('INR')).toBe('₹');
      expect(getCurrencySymbol('JPY')).toBe('¥');
    });

    it('should handle lowercase currency codes', () => {
      expect(getCurrencySymbol('usd')).toBe('$');
      expect(getCurrencySymbol('inr')).toBe('₹');
    });

    it('should fallback to currency code if symbol not found', () => {
      expect(getCurrencySymbol('XYZ')).toBe('XYZ');
    });
  });

  describe('getCurrencyLocale', () => {
    it('should return correct locales for common currencies', () => {
      expect(getCurrencyLocale('USD')).toBe('en-US');
      expect(getCurrencyLocale('EUR')).toBe('de-DE');
      expect(getCurrencyLocale('INR')).toBe('en-IN');
      expect(getCurrencyLocale('JPY')).toBe('ja-JP');
    });

    it('should fallback to en-US if locale not found', () => {
      expect(getCurrencyLocale('XYZ')).toBe('en-US');
    });
  });

  describe('formatCurrency', () => {
    it('should format USD correctly', () => {
      expect(formatCurrency(1000000, 'USD')).toBe('$1,000,000');
      expect(formatCurrency(1500.5, 'USD')).toBe('$1,501');
      expect(formatCurrency(500, 'USD')).toBe('$500');
    });

    it('should format INR correctly with Indian numbering system', () => {
      // INR uses lakhs and crores: 10,00,000 (10 lakhs) = 1,000,000
      const formatted = formatCurrency(1000000, 'INR');
      expect(formatted).toContain('₹');
      expect(formatted).toContain('10');
    });

    it('should format EUR correctly', () => {
      const formatted = formatCurrency(1000000, 'EUR');
      expect(formatted).toContain('€');
      expect(formatted).toContain('1');
    });

    it('should format GBP correctly', () => {
      const formatted = formatCurrency(1000000, 'GBP');
      expect(formatted).toContain('£');
      expect(formatted).toContain('1');
    });

    it('should use currency code instead of symbol when useCode is true', () => {
      expect(formatCurrency(1000000, 'USD', { useCode: true })).toBe('USD 1,000,000');
      expect(formatCurrency(1000000, 'INR', { useCode: true })).toContain('INR');
    });

    it('should format without symbol when useSymbol is false', () => {
      const formatted = formatCurrency(1000000, 'USD', { useSymbol: false });
      expect(formatted).not.toContain('$');
      expect(formatted).toContain('1,000,000');
    });

    it('should handle compact formatting for large numbers', () => {
      // USD
      expect(formatCurrency(1200000, 'USD', { compact: true })).toBe('$1.2M');
      expect(formatCurrency(50000, 'USD', { compact: true })).toBe('$50.0K');
      expect(formatCurrency(1500000000, 'USD', { compact: true })).toBe('$1.5B');

      // INR - uses Lakhs (L) and Crores (Cr)
      expect(formatCurrency(10000000, 'INR', { compact: true })).toBe('₹1.0Cr');
      expect(formatCurrency(500000, 'INR', { compact: true })).toBe('₹5.0L');
    });

    it('should default to USD if no currency code provided', () => {
      expect(formatCurrency(1000000)).toBe('$1,000,000');
    });

    it('should handle zero and negative values', () => {
      expect(formatCurrency(0, 'USD')).toBe('$0');
      expect(formatCurrency(-1000, 'USD')).toContain('-');
    });

    it('should handle decimal values by rounding', () => {
      // The formatter rounds to 0 decimal places
      expect(formatCurrency(1234.56, 'USD')).toBe('$1,235');
    });
  });

  describe('parseCurrency', () => {
    it('should parse currency strings correctly', () => {
      expect(parseCurrency('$1,000,000')).toEqual({
        amount: 1000000,
        currencyCode: '$',
      });

      expect(parseCurrency('₹10,00,000')).toEqual({
        amount: 1000000,
        currencyCode: '₹',
      });

      expect(parseCurrency('USD 1,000,000')).toEqual({
        amount: 1000000,
        currencyCode: 'USD',
      });
    });

    it('should handle strings without currency symbols', () => {
      const result = parseCurrency('1000000');
      expect(result.amount).toBe(1000000);
      expect(result.currencyCode).toBeNull();
    });

    it('should handle invalid strings', () => {
      expect(parseCurrency('invalid')).toEqual({
        amount: 0,
        currencyCode: null,
      });
    });
  });

  describe('Real-world blueprint scenarios', () => {
    it('should format blueprint budget correctly for USD', () => {
      const budget = {
        currency: 'USD',
        total: 150000,
      };

      const formatted = formatCurrency(budget.total, budget.currency);
      expect(formatted).toBe('$150,000');
    });

    it('should format blueprint budget correctly for INR', () => {
      const budget = {
        currency: 'INR',
        total: 1000000, // 10 lakhs in INR
      };

      const formatted = formatCurrency(budget.total, budget.currency);
      expect(formatted).toContain('₹');
      // INR formatting uses Indian numbering system
      expect(formatted).toContain('10');
    });

    it('should handle budget with undefined currency', () => {
      const budget = {
        total: 1000000,
      };

      // Should default to USD
      const formatted = formatCurrency(budget.total, budget.currency || 'USD');
      expect(formatted).toBe('$1,000,000');
    });

    it('should format compact budget display for card', () => {
      const budget = {
        currency: 'INR',
        total: 1000000,
      };

      const formatted = formatCurrency(budget.total, budget.currency, { compact: true });
      expect(formatted).toBe('₹10.0L'); // 10 Lakhs
    });
  });
});
