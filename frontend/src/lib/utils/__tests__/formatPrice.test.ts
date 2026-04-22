import { describe, it, expect } from 'vitest';
import {
  formatPrice,
  formatPriceWithPeriod,
  formatAnnualSavings,
  getCurrencySymbol,
  getCurrencyName,
  convertToTargetCurrency,
  type PriceFormatOptions,
} from '../formatPrice';
import type { Currency } from '@/contexts/CurrencyContext';

describe('formatPrice utilities', () => {
  describe('formatPrice', () => {
    describe('USD Formatting', () => {
      it('should format USD without decimals by default', () => {
        const options: PriceFormatOptions = {
          currency: 'USD' as Currency,
          exchangeRate: 1,
        };

        expect(formatPrice(10, options)).toBe('$10');
        expect(formatPrice(99, options)).toBe('$99');
        expect(formatPrice(100, options)).toBe('$100');
        expect(formatPrice(1000, options)).toBe('$1000');
      });

      it('should format USD with decimals when showDecimals=true', () => {
        const options: PriceFormatOptions = {
          currency: 'USD' as Currency,
          exchangeRate: 1,
          showDecimals: true,
        };

        expect(formatPrice(10, options)).toBe('$10.00');
        expect(formatPrice(99.5, options)).toBe('$99.50');
        expect(formatPrice(99.99, options)).toBe('$99.99');
        expect(formatPrice(100.456, options)).toBe('$100.46'); // Rounds
      });

      it('should format USD without symbol when showSymbol=false', () => {
        const options: PriceFormatOptions = {
          currency: 'USD' as Currency,
          exchangeRate: 1,
          showSymbol: false,
        };

        expect(formatPrice(10, options)).toBe('10');
        expect(formatPrice(99, options)).toBe('99');
      });

      it('should format USD with decimals and no symbol', () => {
        const options: PriceFormatOptions = {
          currency: 'USD' as Currency,
          exchangeRate: 1,
          showDecimals: true,
          showSymbol: false,
        };

        expect(formatPrice(10, options)).toBe('10.00');
        expect(formatPrice(99.99, options)).toBe('99.99');
      });

      it('should round USD prices when showDecimals=false', () => {
        const options: PriceFormatOptions = {
          currency: 'USD' as Currency,
          exchangeRate: 1,
          showDecimals: false,
        };

        expect(formatPrice(10.4, options)).toBe('$10');
        expect(formatPrice(10.5, options)).toBe('$11');
        expect(formatPrice(10.9, options)).toBe('$11');
      });
    });

    describe('INR Formatting', () => {
      it('should convert USD to INR with exchange rate', () => {
        const options: PriceFormatOptions = {
          currency: 'INR' as Currency,
          exchangeRate: 83,
        };

        expect(formatPrice(10, options)).toBe('₹830'); // 10 * 83
        expect(formatPrice(100, options)).toBe('₹8,300'); // Uses Indian number format
      });

      it('should format INR with Indian number system', () => {
        const options: PriceFormatOptions = {
          currency: 'INR' as Currency,
          exchangeRate: 83,
        };

        // Indian numbering: uses commas at thousands
        expect(formatPrice(12, options)).toBe('₹996'); // 12 * 83
        expect(formatPrice(120, options)).toBe('₹9,960'); // 120 * 83 = 9,960
        expect(formatPrice(1000, options)).toBe('₹83,000'); // 1000 * 83 = 83,000
      });

      it('should round INR prices (no decimals)', () => {
        const options: PriceFormatOptions = {
          currency: 'INR' as Currency,
          exchangeRate: 83.5,
        };

        // 10 * 83.5 = 835, rounds to 835
        expect(formatPrice(10, options)).toBe('₹835');

        // 11 * 83.5 = 918.5, rounds to 919
        expect(formatPrice(11, options)).toBe('₹919');
      });

      it('should ignore showDecimals for INR', () => {
        const options: PriceFormatOptions = {
          currency: 'INR' as Currency,
          exchangeRate: 83,
          showDecimals: true, // Should be ignored for INR
        };

        expect(formatPrice(10, options)).toBe('₹830'); // No decimals
      });

      it('should format INR without symbol when showSymbol=false', () => {
        const options: PriceFormatOptions = {
          currency: 'INR' as Currency,
          exchangeRate: 83,
          showSymbol: false,
        };

        expect(formatPrice(10, options)).toBe('830');
        expect(formatPrice(100, options)).toBe('8,300');
      });

      it('should handle large INR amounts with lakhs formatting', () => {
        const options: PriceFormatOptions = {
          currency: 'INR' as Currency,
          exchangeRate: 83,
        };

        // 1000 * 83 = 83,000 (83 thousand)
        expect(formatPrice(1000, options)).toBe('₹83,000');

        // 10000 * 83 = 830,000 (8.3 lakhs)
        expect(formatPrice(10000, options)).toBe('₹8,30,000');

        // 100000 * 83 = 8,300,000 (83 lakhs)
        expect(formatPrice(100000, options)).toBe('₹83,00,000');
      });
    });

    describe('Edge Cases', () => {
      it('should handle zero price', () => {
        const usdOptions: PriceFormatOptions = {
          currency: 'USD' as Currency,
          exchangeRate: 1,
        };
        expect(formatPrice(0, usdOptions)).toBe('$0');

        const inrOptions: PriceFormatOptions = {
          currency: 'INR' as Currency,
          exchangeRate: 83,
        };
        expect(formatPrice(0, inrOptions)).toBe('₹0');
      });

      it('should handle negative prices', () => {
        const options: PriceFormatOptions = {
          currency: 'USD' as Currency,
          exchangeRate: 1,
        };
        expect(formatPrice(-10, options)).toBe('$-10');
      });

      it('should handle very small decimal prices', () => {
        const options: PriceFormatOptions = {
          currency: 'USD' as Currency,
          exchangeRate: 1,
          showDecimals: true,
        };
        expect(formatPrice(0.01, options)).toBe('$0.01');
        expect(formatPrice(0.99, options)).toBe('$0.99');
      });

      it('should handle very large prices', () => {
        const usdOptions: PriceFormatOptions = {
          currency: 'USD' as Currency,
          exchangeRate: 1,
        };
        expect(formatPrice(1000000, usdOptions)).toBe('$1000000');

        const inrOptions: PriceFormatOptions = {
          currency: 'INR' as Currency,
          exchangeRate: 83,
        };
        // 1,000,000 * 83 = 83,000,000
        expect(formatPrice(1000000, inrOptions)).toBe('₹8,30,00,000');
      });

      it('should handle fractional exchange rates', () => {
        const options: PriceFormatOptions = {
          currency: 'INR' as Currency,
          exchangeRate: 83.75,
        };

        // 10 * 83.75 = 837.5, rounds to 838
        expect(formatPrice(10, options)).toBe('₹838');
      });
    });
  });

  describe('formatPriceWithPeriod', () => {
    const baseOptions: PriceFormatOptions = {
      currency: 'USD' as Currency,
      exchangeRate: 1,
    };

    it('should format monthly price by default', () => {
      expect(formatPriceWithPeriod(10, baseOptions)).toBe('$10/month');
      expect(formatPriceWithPeriod(99, baseOptions)).toBe('$99/month');
    });

    it('should format monthly price explicitly', () => {
      expect(formatPriceWithPeriod(10, baseOptions, 'monthly')).toBe('$10/month');
    });

    it('should format annual price', () => {
      expect(formatPriceWithPeriod(120, baseOptions, 'annual')).toBe('$120/year');
    });

    it('should format per-seat price', () => {
      expect(formatPriceWithPeriod(25, baseOptions, 'seat')).toBe('$25/seat/month');
    });

    it('should work with INR currency', () => {
      const inrOptions: PriceFormatOptions = {
        currency: 'INR' as Currency,
        exchangeRate: 83,
      };

      expect(formatPriceWithPeriod(10, inrOptions, 'monthly')).toBe('₹830/month');
      expect(formatPriceWithPeriod(120, inrOptions, 'annual')).toBe('₹9,960/year');
      expect(formatPriceWithPeriod(25, inrOptions, 'seat')).toBe('₹2,075/seat/month');
    });

    it('should work with decimals when enabled', () => {
      const options: PriceFormatOptions = {
        currency: 'USD' as Currency,
        exchangeRate: 1,
        showDecimals: true,
      };

      expect(formatPriceWithPeriod(9.99, options, 'monthly')).toBe('$9.99/month');
    });

    it('should work without symbol', () => {
      const options: PriceFormatOptions = {
        currency: 'USD' as Currency,
        exchangeRate: 1,
        showSymbol: false,
      };

      expect(formatPriceWithPeriod(10, options, 'monthly')).toBe('10/month');
    });
  });

  describe('formatAnnualSavings', () => {
    it('should calculate 20% annual savings for USD', () => {
      const options: PriceFormatOptions = {
        currency: 'USD' as Currency,
        exchangeRate: 1,
      };

      // Monthly: $10, Annual savings: $10 * 0.2 * 12 = $24
      expect(formatAnnualSavings(10, options)).toBe('$24');

      // Monthly: $50, Annual savings: $50 * 0.2 * 12 = $120
      expect(formatAnnualSavings(50, options)).toBe('$120');

      // Monthly: $100, Annual savings: $100 * 0.2 * 12 = $240
      expect(formatAnnualSavings(100, options)).toBe('$240');
    });

    it('should calculate annual savings for INR', () => {
      const options: PriceFormatOptions = {
        currency: 'INR' as Currency,
        exchangeRate: 83,
      };

      // Monthly: $10, Savings: $24, INR: 24 * 83 = 1,992
      expect(formatAnnualSavings(10, options)).toBe('₹1,992');

      // Monthly: $50, Savings: $120, INR: 120 * 83 = 9,960
      expect(formatAnnualSavings(50, options)).toBe('₹9,960');
    });

    it('should ceil savings (always round up)', () => {
      const options: PriceFormatOptions = {
        currency: 'USD' as Currency,
        exchangeRate: 1,
      };

      // Monthly: $10.50, Savings: 10.5 * 0.2 * 12 = 25.2, ceil = 26
      expect(formatAnnualSavings(10.5, options)).toBe('$26');

      // Monthly: $99.99, Savings: 99.99 * 0.2 * 12 = 239.976, ceil = 240
      expect(formatAnnualSavings(99.99, options)).toBe('$240');
    });

    it('should handle zero monthly price', () => {
      const options: PriceFormatOptions = {
        currency: 'USD' as Currency,
        exchangeRate: 1,
      };

      expect(formatAnnualSavings(0, options)).toBe('$0');
    });

    it('should work with show decimals option', () => {
      const options: PriceFormatOptions = {
        currency: 'USD' as Currency,
        exchangeRate: 1,
        showDecimals: true,
      };

      // Ceil always produces integers, so decimals show .00
      expect(formatAnnualSavings(10, options)).toBe('$24.00');
    });
  });

  describe('getCurrencySymbol', () => {
    it('should return $ for USD', () => {
      expect(getCurrencySymbol('USD' as Currency)).toBe('$');
    });

    it('should return ₹ for INR', () => {
      expect(getCurrencySymbol('INR' as Currency)).toBe('₹');
    });
  });

  describe('getCurrencyName', () => {
    it('should return "US Dollar" for USD', () => {
      expect(getCurrencyName('USD' as Currency)).toBe('US Dollar');
    });

    it('should return "Indian Rupee" for INR', () => {
      expect(getCurrencyName('INR' as Currency)).toBe('Indian Rupee');
    });
  });

  describe('convertToTargetCurrency', () => {
    it('should return same value for USD', () => {
      expect(convertToTargetCurrency(10, 'USD' as Currency, 83)).toBe(10);
      expect(convertToTargetCurrency(100, 'USD' as Currency, 83)).toBe(100);
      expect(convertToTargetCurrency(999.99, 'USD' as Currency, 83)).toBe(999.99);
    });

    it('should convert to INR with exchange rate', () => {
      expect(convertToTargetCurrency(10, 'INR' as Currency, 83)).toBe(830);
      expect(convertToTargetCurrency(100, 'INR' as Currency, 83)).toBe(8300);
    });

    it('should round converted INR values', () => {
      // 10 * 83.5 = 835, rounds to 835
      expect(convertToTargetCurrency(10, 'INR' as Currency, 83.5)).toBe(835);

      // 11 * 83.5 = 918.5, rounds to 919
      expect(convertToTargetCurrency(11, 'INR' as Currency, 83.5)).toBe(919);
    });

    it('should handle zero conversion', () => {
      expect(convertToTargetCurrency(0, 'USD' as Currency, 83)).toBe(0);
      expect(convertToTargetCurrency(0, 'INR' as Currency, 83)).toBe(0);
    });

    it('should handle negative values', () => {
      expect(convertToTargetCurrency(-10, 'USD' as Currency, 83)).toBe(-10);
      expect(convertToTargetCurrency(-10, 'INR' as Currency, 83)).toBe(-830);
    });

    it('should handle very large values', () => {
      expect(convertToTargetCurrency(1000000, 'INR' as Currency, 83)).toBe(83000000);
    });

    it('should handle fractional USD prices', () => {
      expect(convertToTargetCurrency(9.99, 'INR' as Currency, 83)).toBe(829); // 9.99 * 83 = 829.17
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle typical pricing page display (USD)', () => {
      const options: PriceFormatOptions = {
        currency: 'USD' as Currency,
        exchangeRate: 1,
      };

      // Explorer tier (free)
      expect(formatPrice(0, options)).toBe('$0');

      // Navigator tier ($25/month)
      expect(formatPriceWithPeriod(25, options, 'monthly')).toBe('$25/month');

      // Annual savings
      expect(formatAnnualSavings(25, options)).toBe('$60'); // 25 * 0.2 * 12 = 60
    });

    it('should handle typical pricing page display (INR)', () => {
      const options: PriceFormatOptions = {
        currency: 'INR' as Currency,
        exchangeRate: 83,
      };

      // Navigator tier ($25/month = ₹2,075/month)
      expect(formatPriceWithPeriod(25, options, 'monthly')).toBe('₹2,075/month');

      // Annual savings ($60 = ₹4,980)
      expect(formatAnnualSavings(25, options)).toBe('₹4,980');
    });

    it('should handle team pricing with per-seat costs', () => {
      const options: PriceFormatOptions = {
        currency: 'USD' as Currency,
        exchangeRate: 1,
      };

      // Crew tier ($15/seat/month)
      expect(formatPriceWithPeriod(15, options, 'seat')).toBe('$15/seat/month');

      // Annual savings per seat
      expect(formatAnnualSavings(15, options)).toBe('$36');
    });

    it('should handle currency switching', () => {
      const usdOptions: PriceFormatOptions = {
        currency: 'USD' as Currency,
        exchangeRate: 1,
      };

      const inrOptions: PriceFormatOptions = {
        currency: 'INR' as Currency,
        exchangeRate: 83,
      };

      const priceUsd = 25;

      // Display in USD
      expect(formatPriceWithPeriod(priceUsd, usdOptions, 'monthly')).toBe('$25/month');

      // Switch to INR
      expect(formatPriceWithPeriod(priceUsd, inrOptions, 'monthly')).toBe('₹2,075/month');

      // Verify conversion is consistent
      const convertedInr = convertToTargetCurrency(priceUsd, 'INR' as Currency, 83);
      expect(convertedInr).toBe(2075);
      expect(formatPrice(priceUsd, inrOptions)).toBe('₹2,075');
    });

    it('should handle enterprise custom pricing display', () => {
      const options: PriceFormatOptions = {
        currency: 'USD' as Currency,
        exchangeRate: 1,
        showDecimals: false,
        showSymbol: false,
      };

      // Enterprise might show "Contact Us" or custom formatting
      // Here we test that no symbol works correctly
      expect(formatPrice(0, options)).toBe('0');
    });

    it('should handle annual vs monthly comparison', () => {
      const options: PriceFormatOptions = {
        currency: 'USD' as Currency,
        exchangeRate: 1,
      };

      const monthlyPrice = 50;
      const annualPrice = monthlyPrice * 12 * 0.8; // 20% discount = $480

      expect(formatPriceWithPeriod(monthlyPrice, options, 'monthly')).toBe('$50/month');
      expect(formatPriceWithPeriod(annualPrice, options, 'annual')).toBe('$480/year');
      expect(formatAnnualSavings(monthlyPrice, options)).toBe('$120'); // Savings if paid annually
    });
  });

  describe('Real-World Tier Prices', () => {
    it('should format all individual tier prices correctly (USD)', () => {
      const options: PriceFormatOptions = {
        currency: 'USD' as Currency,
        exchangeRate: 1,
      };

      // Assuming tier prices from the application
      expect(formatPriceWithPeriod(0, options, 'monthly')).toBe('$0/month'); // Explorer (free)
      expect(formatPriceWithPeriod(25, options, 'monthly')).toBe('$25/month'); // Navigator
      expect(formatPriceWithPeriod(40, options, 'monthly')).toBe('$40/month'); // Voyager
    });

    it('should format all team tier prices correctly (USD)', () => {
      const options: PriceFormatOptions = {
        currency: 'USD' as Currency,
        exchangeRate: 1,
      };

      expect(formatPriceWithPeriod(10, options, 'seat')).toBe('$10/seat/month'); // Crew
      expect(formatPriceWithPeriod(30, options, 'seat')).toBe('$30/seat/month'); // Fleet
      expect(formatPriceWithPeriod(60, options, 'seat')).toBe('$60/seat/month'); // Armada
    });

    it('should format all tier prices correctly (INR)', () => {
      const options: PriceFormatOptions = {
        currency: 'INR' as Currency,
        exchangeRate: 83,
      };

      // Individual tiers
      expect(formatPriceWithPeriod(0, options, 'monthly')).toBe('₹0/month'); // Explorer
      expect(formatPriceWithPeriod(25, options, 'monthly')).toBe('₹2,075/month'); // Navigator
      expect(formatPriceWithPeriod(40, options, 'monthly')).toBe('₹3,320/month'); // Voyager

      // Team tiers
      expect(formatPriceWithPeriod(10, options, 'seat')).toBe('₹830/seat/month'); // Crew
      expect(formatPriceWithPeriod(30, options, 'seat')).toBe('₹2,490/seat/month'); // Fleet
      expect(formatPriceWithPeriod(60, options, 'seat')).toBe('₹4,980/seat/month'); // Armada
    });
  });
});
