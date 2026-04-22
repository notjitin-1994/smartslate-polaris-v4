/**
 * Unit Tests: passwordStrength utilities
 *
 * Comprehensive test coverage for password strength evaluation using zxcvbn.
 * Tests both exported functions with focus on:
 * - Password strength scoring (0-4 scale)
 * - Label and color mapping for UI feedback
 * - Feedback generation from zxcvbn
 * - Crack time estimates
 * - User context validation (email, name)
 * - Minimum strength requirements
 * - Edge cases and empty password handling
 *
 * These utilities are CRITICAL for security - proper password validation prevents weak passwords.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { calculatePasswordStrength, meetsMinimumStrength } from '@/lib/utils/passwordStrength';
import type { ZXCVBNResult } from 'zxcvbn';

// Mock zxcvbn
vi.mock('zxcvbn', () => ({
  default: vi.fn(),
}));

describe('passwordStrength utilities', () => {
  describe('calculatePasswordStrength', () => {
    describe('Empty Password Handling', () => {
      it('should return score 0 for empty password', () => {
        const result = calculatePasswordStrength('');
        expect(result.score).toBe(0);
        expect(result.label).toBe('Too weak');
        expect(result.color).toBe('text-red-600');
        expect(result.bgColor).toBe('bg-red-500');
        expect(result.feedback).toEqual(['Password is required']);
        expect(result.crackTime).toBe('Instant');
      });

      it('should handle null password as empty', () => {
        const result = calculatePasswordStrength(null as any);
        expect(result.score).toBe(0);
        expect(result.label).toBe('Too weak');
      });

      it('should handle undefined password as empty', () => {
        const result = calculatePasswordStrength(undefined as any);
        expect(result.score).toBe(0);
        expect(result.label).toBe('Too weak');
      });
    });

    describe('Password Strength Scores', () => {
      beforeEach(() => {
        vi.clearAllMocks();
      });

      it('should return "Too weak" for score 0', async () => {
        const { default: zxcvbn } = await import('zxcvbn');
        vi.mocked(zxcvbn).mockReturnValue({
          score: 0,
          feedback: { warning: 'This is a very common password', suggestions: [] },
          crack_times_display: { offline_slow_hashing_1e4_per_second: 'instant' },
        } as ZXCVBNResult);

        const result = calculatePasswordStrength('password');
        expect(result.score).toBe(0);
        expect(result.label).toBe('Too weak');
        expect(result.color).toBe('text-red-600');
        expect(result.bgColor).toBe('bg-red-500');
      });

      it('should return "Weak" for score 1', async () => {
        const { default: zxcvbn } = await import('zxcvbn');
        vi.mocked(zxcvbn).mockReturnValue({
          score: 1,
          feedback: { warning: '', suggestions: [] },
          crack_times_display: { offline_slow_hashing_1e4_per_second: '2 hours' },
        } as ZXCVBNResult);

        const result = calculatePasswordStrength('password123');
        expect(result.score).toBe(1);
        expect(result.label).toBe('Weak');
        expect(result.color).toBe('text-orange-600');
        expect(result.bgColor).toBe('bg-orange-500');
      });

      it('should return "Fair" for score 2', async () => {
        const { default: zxcvbn } = await import('zxcvbn');
        vi.mocked(zxcvbn).mockReturnValue({
          score: 2,
          feedback: { warning: '', suggestions: [] },
          crack_times_display: { offline_slow_hashing_1e4_per_second: '3 months' },
        } as ZXCVBNResult);

        const result = calculatePasswordStrength('Pass123!word');
        expect(result.score).toBe(2);
        expect(result.label).toBe('Fair');
        expect(result.color).toBe('text-yellow-600');
        expect(result.bgColor).toBe('bg-yellow-500');
      });

      it('should return "Good" for score 3', async () => {
        const { default: zxcvbn } = await import('zxcvbn');
        vi.mocked(zxcvbn).mockReturnValue({
          score: 3,
          feedback: { warning: '', suggestions: [] },
          crack_times_display: { offline_slow_hashing_1e4_per_second: '5 years' },
        } as ZXCVBNResult);

        const result = calculatePasswordStrength('MyS3cur3P@ssw0rd');
        expect(result.score).toBe(3);
        expect(result.label).toBe('Good');
        expect(result.color).toBe('text-lime-600');
        expect(result.bgColor).toBe('bg-lime-500');
      });

      it('should return "Strong" for score 4', async () => {
        const { default: zxcvbn } = await import('zxcvbn');
        vi.mocked(zxcvbn).mockReturnValue({
          score: 4,
          feedback: { warning: '', suggestions: [] },
          crack_times_display: { offline_slow_hashing_1e4_per_second: 'centuries' },
        } as ZXCVBNResult);

        const result = calculatePasswordStrength('c0mpl3x!P@ssw0rd#2024$Secure');
        expect(result.score).toBe(4);
        expect(result.label).toBe('Strong');
        expect(result.color).toBe('text-green-600');
        expect(result.bgColor).toBe('bg-green-500');
      });
    });

    describe('Feedback Generation', () => {
      it('should include warning in feedback', async () => {
        const { default: zxcvbn } = await import('zxcvbn');
        vi.mocked(zxcvbn).mockReturnValue({
          score: 1,
          feedback: {
            warning: 'This is a top-10 common password',
            suggestions: [],
          },
          crack_times_display: { offline_slow_hashing_1e4_per_second: 'instant' },
        } as ZXCVBNResult);

        const result = calculatePasswordStrength('password');
        expect(result.feedback).toContain('This is a top-10 common password');
      });

      it('should include suggestions in feedback', async () => {
        const { default: zxcvbn } = await import('zxcvbn');
        vi.mocked(zxcvbn).mockReturnValue({
          score: 1,
          feedback: {
            warning: '',
            suggestions: ['Add another word or two', 'Use a longer keyboard pattern'],
          },
          crack_times_display: { offline_slow_hashing_1e4_per_second: '2 days' },
        } as ZXCVBNResult);

        const result = calculatePasswordStrength('abc123');
        expect(result.feedback).toContain('Add another word or two');
        expect(result.feedback).toContain('Use a longer keyboard pattern');
        expect(result.feedback).toHaveLength(2);
      });

      it('should include both warning and suggestions', async () => {
        const { default: zxcvbn } = await import('zxcvbn');
        vi.mocked(zxcvbn).mockReturnValue({
          score: 0,
          feedback: {
            warning: 'This is a very common password',
            suggestions: ['Avoid common words', 'Use a mix of characters'],
          },
          crack_times_display: { offline_slow_hashing_1e4_per_second: 'instant' },
        } as ZXCVBNResult);

        const result = calculatePasswordStrength('password');
        expect(result.feedback).toHaveLength(3);
        expect(result.feedback[0]).toBe('This is a very common password');
        expect(result.feedback[1]).toBe('Avoid common words');
        expect(result.feedback[2]).toBe('Use a mix of characters');
      });

      it('should return empty feedback array when no warnings or suggestions', async () => {
        const { default: zxcvbn } = await import('zxcvbn');
        vi.mocked(zxcvbn).mockReturnValue({
          score: 4,
          feedback: { warning: '', suggestions: [] },
          crack_times_display: { offline_slow_hashing_1e4_per_second: 'centuries' },
        } as ZXCVBNResult);

        const result = calculatePasswordStrength('V3ry$tr0ng!P@ssw0rd#2024');
        expect(result.feedback).toEqual([]);
      });
    });

    describe('Crack Time Estimates', () => {
      it('should format crack time for instant cracking', async () => {
        const { default: zxcvbn } = await import('zxcvbn');
        vi.mocked(zxcvbn).mockReturnValue({
          score: 0,
          feedback: { warning: '', suggestions: [] },
          crack_times_display: { offline_slow_hashing_1e4_per_second: 'instant' },
        } as ZXCVBNResult);

        const result = calculatePasswordStrength('12345');
        expect(result.crackTime).toBe('instant');
      });

      it('should format crack time for hours', async () => {
        const { default: zxcvbn } = await import('zxcvbn');
        vi.mocked(zxcvbn).mockReturnValue({
          score: 1,
          feedback: { warning: '', suggestions: [] },
          crack_times_display: { offline_slow_hashing_1e4_per_second: '5 hours' },
        } as ZXCVBNResult);

        const result = calculatePasswordStrength('simple123');
        expect(result.crackTime).toBe('5 hours');
      });

      it('should format crack time for months', async () => {
        const { default: zxcvbn } = await import('zxcvbn');
        vi.mocked(zxcvbn).mockReturnValue({
          score: 2,
          feedback: { warning: '', suggestions: [] },
          crack_times_display: { offline_slow_hashing_1e4_per_second: '8 months' },
        } as ZXCVBNResult);

        const result = calculatePasswordStrength('Better!Pass123');
        expect(result.crackTime).toBe('8 months');
      });

      it('should format crack time for years', async () => {
        const { default: zxcvbn } = await import('zxcvbn');
        vi.mocked(zxcvbn).mockReturnValue({
          score: 3,
          feedback: { warning: '', suggestions: [] },
          crack_times_display: { offline_slow_hashing_1e4_per_second: '10 years' },
        } as ZXCVBNResult);

        const result = calculatePasswordStrength('Strong$Pass123!');
        expect(result.crackTime).toBe('10 years');
      });

      it('should format crack time for centuries', async () => {
        const { default: zxcvbn } = await import('zxcvbn');
        vi.mocked(zxcvbn).mockReturnValue({
          score: 4,
          feedback: { warning: '', suggestions: [] },
          crack_times_display: { offline_slow_hashing_1e4_per_second: 'centuries' },
        } as ZXCVBNResult);

        const result = calculatePasswordStrength('Extremely$tr0ng!P@ssw0rd#2024');
        expect(result.crackTime).toBe('centuries');
      });
    });

    describe('User Context Validation', () => {
      it('should pass user inputs to zxcvbn', async () => {
        const { default: zxcvbn } = await import('zxcvbn');
        vi.mocked(zxcvbn).mockReturnValue({
          score: 2,
          feedback: { warning: '', suggestions: [] },
          crack_times_display: { offline_slow_hashing_1e4_per_second: '3 months' },
        } as ZXCVBNResult);

        const userInputs = ['john', 'smith', 'john@example.com'];
        calculatePasswordStrength('MyPassword123', userInputs);

        expect(zxcvbn).toHaveBeenCalledWith('MyPassword123', userInputs);
      });

      it('should penalize passwords containing user email', async () => {
        const { default: zxcvbn } = await import('zxcvbn');
        vi.mocked(zxcvbn).mockReturnValue({
          score: 0,
          feedback: {
            warning: 'Passwords based on personal info are easy to guess',
            suggestions: ['Avoid using personal information'],
          },
          crack_times_display: { offline_slow_hashing_1e4_per_second: 'instant' },
        } as ZXCVBNResult);

        const result = calculatePasswordStrength('john@example.com', ['john@example.com']);
        expect(result.score).toBe(0);
        expect(result.feedback).toContain('Passwords based on personal info are easy to guess');
      });

      it('should penalize passwords containing user name', async () => {
        const { default: zxcvbn } = await import('zxcvbn');
        vi.mocked(zxcvbn).mockReturnValue({
          score: 1,
          feedback: {
            warning: 'Names and surnames are easy to guess',
            suggestions: [],
          },
          crack_times_display: { offline_slow_hashing_1e4_per_second: '1 hour' },
        } as ZXCVBNResult);

        const result = calculatePasswordStrength('johnsmith123', ['john', 'smith']);
        expect(result.score).toBeLessThanOrEqual(1);
      });

      it('should work without user inputs', async () => {
        const { default: zxcvbn } = await import('zxcvbn');
        vi.mocked(zxcvbn).mockReturnValue({
          score: 3,
          feedback: { warning: '', suggestions: [] },
          crack_times_display: { offline_slow_hashing_1e4_per_second: '5 years' },
        } as ZXCVBNResult);

        const result = calculatePasswordStrength('Secure!P@ssw0rd');
        expect(zxcvbn).toHaveBeenCalledWith('Secure!P@ssw0rd', []);
        expect(result.score).toBe(3);
      });
    });

    describe('Edge Cases', () => {
      it('should handle very short passwords', async () => {
        const { default: zxcvbn } = await import('zxcvbn');
        vi.mocked(zxcvbn).mockReturnValue({
          score: 0,
          feedback: {
            warning: 'Too short',
            suggestions: ['Use at least 8 characters'],
          },
          crack_times_display: { offline_slow_hashing_1e4_per_second: 'instant' },
        } as ZXCVBNResult);

        const result = calculatePasswordStrength('abc');
        expect(result.score).toBe(0);
        expect(result.label).toBe('Too weak');
      });

      it('should handle very long passwords', async () => {
        const { default: zxcvbn } = await import('zxcvbn');
        const longPassword = 'a'.repeat(100) + 'B1@cd';
        vi.mocked(zxcvbn).mockReturnValue({
          score: 4,
          feedback: { warning: '', suggestions: [] },
          crack_times_display: { offline_slow_hashing_1e4_per_second: 'centuries' },
        } as ZXCVBNResult);

        const result = calculatePasswordStrength(longPassword);
        expect(result.score).toBeGreaterThanOrEqual(3);
      });

      it('should handle passwords with special characters', async () => {
        const { default: zxcvbn } = await import('zxcvbn');
        vi.mocked(zxcvbn).mockReturnValue({
          score: 3,
          feedback: { warning: '', suggestions: [] },
          crack_times_display: { offline_slow_hashing_1e4_per_second: '7 years' },
        } as ZXCVBNResult);

        const result = calculatePasswordStrength('P@ssw0rd!#$%');
        expect(result.score).toBeGreaterThanOrEqual(2);
      });

      it('should handle passwords with unicode characters', async () => {
        const { default: zxcvbn } = await import('zxcvbn');
        vi.mocked(zxcvbn).mockReturnValue({
          score: 3,
          feedback: { warning: '', suggestions: [] },
          crack_times_display: { offline_slow_hashing_1e4_per_second: '4 years' },
        } as ZXCVBNResult);

        const result = calculatePasswordStrength('Pássw0rd™€');
        expect(result.score).toBeGreaterThanOrEqual(2);
      });

      it('should handle passwords with only numbers', async () => {
        const { default: zxcvbn } = await import('zxcvbn');
        vi.mocked(zxcvbn).mockReturnValue({
          score: 0,
          feedback: {
            warning: 'All-number passwords are easy to guess',
            suggestions: ['Use letters and symbols'],
          },
          crack_times_display: { offline_slow_hashing_1e4_per_second: 'instant' },
        } as ZXCVBNResult);

        const result = calculatePasswordStrength('123456789');
        expect(result.score).toBe(0);
      });

      it('should handle whitespace in passwords', async () => {
        const { default: zxcvbn } = await import('zxcvbn');
        vi.mocked(zxcvbn).mockReturnValue({
          score: 2,
          feedback: { warning: '', suggestions: [] },
          crack_times_display: { offline_slow_hashing_1e4_per_second: '6 months' },
        } as ZXCVBNResult);

        const result = calculatePasswordStrength('My Secure Password 123');
        expect(result).toBeDefined();
        expect(result.score).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('meetsMinimumStrength', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    describe('Default Minimum Score (2)', () => {
      it('should return false for score 0 (Too weak)', async () => {
        const { default: zxcvbn } = await import('zxcvbn');
        vi.mocked(zxcvbn).mockReturnValue({
          score: 0,
          feedback: { warning: '', suggestions: [] },
          crack_times_display: { offline_slow_hashing_1e4_per_second: 'instant' },
        } as ZXCVBNResult);

        expect(meetsMinimumStrength('password')).toBe(false);
      });

      it('should return false for score 1 (Weak)', async () => {
        const { default: zxcvbn } = await import('zxcvbn');
        vi.mocked(zxcvbn).mockReturnValue({
          score: 1,
          feedback: { warning: '', suggestions: [] },
          crack_times_display: { offline_slow_hashing_1e4_per_second: '2 hours' },
        } as ZXCVBNResult);

        expect(meetsMinimumStrength('password123')).toBe(false);
      });

      it('should return true for score 2 (Fair)', async () => {
        const { default: zxcvbn } = await import('zxcvbn');
        vi.mocked(zxcvbn).mockReturnValue({
          score: 2,
          feedback: { warning: '', suggestions: [] },
          crack_times_display: { offline_slow_hashing_1e4_per_second: '3 months' },
        } as ZXCVBNResult);

        expect(meetsMinimumStrength('Pass123!word')).toBe(true);
      });

      it('should return true for score 3 (Good)', async () => {
        const { default: zxcvbn } = await import('zxcvbn');
        vi.mocked(zxcvbn).mockReturnValue({
          score: 3,
          feedback: { warning: '', suggestions: [] },
          crack_times_display: { offline_slow_hashing_1e4_per_second: '5 years' },
        } as ZXCVBNResult);

        expect(meetsMinimumStrength('MyS3cur3P@ssw0rd')).toBe(true);
      });

      it('should return true for score 4 (Strong)', async () => {
        const { default: zxcvbn } = await import('zxcvbn');
        vi.mocked(zxcvbn).mockReturnValue({
          score: 4,
          feedback: { warning: '', suggestions: [] },
          crack_times_display: { offline_slow_hashing_1e4_per_second: 'centuries' },
        } as ZXCVBNResult);

        expect(meetsMinimumStrength('c0mpl3x!P@ssw0rd#2024')).toBe(true);
      });
    });

    describe('Custom Minimum Scores', () => {
      it('should accept score 0 with minScore 0', async () => {
        const { default: zxcvbn } = await import('zxcvbn');
        vi.mocked(zxcvbn).mockReturnValue({
          score: 0,
          feedback: { warning: '', suggestions: [] },
          crack_times_display: { offline_slow_hashing_1e4_per_second: 'instant' },
        } as ZXCVBNResult);

        expect(meetsMinimumStrength('weak', 0)).toBe(true);
      });

      it('should reject score 2 with minScore 3', async () => {
        const { default: zxcvbn } = await import('zxcvbn');
        vi.mocked(zxcvbn).mockReturnValue({
          score: 2,
          feedback: { warning: '', suggestions: [] },
          crack_times_display: { offline_slow_hashing_1e4_per_second: '3 months' },
        } as ZXCVBNResult);

        expect(meetsMinimumStrength('Pass123!word', 3)).toBe(false);
      });

      it('should accept score 3 with minScore 3', async () => {
        const { default: zxcvbn } = await import('zxcvbn');
        vi.mocked(zxcvbn).mockReturnValue({
          score: 3,
          feedback: { warning: '', suggestions: [] },
          crack_times_display: { offline_slow_hashing_1e4_per_second: '5 years' },
        } as ZXCVBNResult);

        expect(meetsMinimumStrength('MyS3cur3P@ssw0rd', 3)).toBe(true);
      });

      it('should reject score 3 with minScore 4 (require strong)', async () => {
        const { default: zxcvbn } = await import('zxcvbn');
        vi.mocked(zxcvbn).mockReturnValue({
          score: 3,
          feedback: { warning: '', suggestions: [] },
          crack_times_display: { offline_slow_hashing_1e4_per_second: '5 years' },
        } as ZXCVBNResult);

        expect(meetsMinimumStrength('MyS3cur3P@ssw0rd', 4)).toBe(false);
      });

      it('should accept score 4 with minScore 4', async () => {
        const { default: zxcvbn } = await import('zxcvbn');
        vi.mocked(zxcvbn).mockReturnValue({
          score: 4,
          feedback: { warning: '', suggestions: [] },
          crack_times_display: { offline_slow_hashing_1e4_per_second: 'centuries' },
        } as ZXCVBNResult);

        expect(meetsMinimumStrength('c0mpl3x!P@ssw0rd#2024$Secure', 4)).toBe(true);
      });
    });

    describe('Edge Cases', () => {
      it('should return false for empty password', () => {
        expect(meetsMinimumStrength('')).toBe(false);
      });

      it('should allow empty password with minScore 0 (edge case)', () => {
        // Note: Empty passwords get score 0, so they pass when minScore is 0
        // This is technically correct behavior but not recommended in practice
        expect(meetsMinimumStrength('', 0)).toBe(true);
      });

      it('should handle boundary score (exactly at minimum)', async () => {
        const { default: zxcvbn } = await import('zxcvbn');
        vi.mocked(zxcvbn).mockReturnValue({
          score: 2,
          feedback: { warning: '', suggestions: [] },
          crack_times_display: { offline_slow_hashing_1e4_per_second: '3 months' },
        } as ZXCVBNResult);

        expect(meetsMinimumStrength('boundary!Pass123', 2)).toBe(true);
      });
    });
  });

  describe('Integration Scenarios', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should validate sign-up form with minimum strength', async () => {
      const { default: zxcvbn } = await import('zxcvbn');

      // Weak password - should fail
      vi.mocked(zxcvbn).mockReturnValue({
        score: 1,
        feedback: { warning: 'Too common', suggestions: ['Add more words'] },
        crack_times_display: { offline_slow_hashing_1e4_per_second: '1 hour' },
      } as ZXCVBNResult);
      expect(meetsMinimumStrength('password123')).toBe(false);

      // Fair password - should pass default (minScore 2)
      vi.mocked(zxcvbn).mockReturnValue({
        score: 2,
        feedback: { warning: '', suggestions: [] },
        crack_times_display: { offline_slow_hashing_1e4_per_second: '5 months' },
      } as ZXCVBNResult);
      expect(meetsMinimumStrength('Better!Pass123')).toBe(true);
    });

    it('should provide UI feedback for password strength indicator', async () => {
      const { default: zxcvbn } = await import('zxcvbn');
      vi.mocked(zxcvbn).mockReturnValue({
        score: 2,
        feedback: {
          warning: '',
          suggestions: ['Add another word or two'],
        },
        crack_times_display: { offline_slow_hashing_1e4_per_second: '8 months' },
      } as ZXCVBNResult);

      const strength = calculatePasswordStrength('MyPass123!');

      // UI can use these values
      expect(strength.label).toBe('Fair'); // Display label
      expect(strength.color).toBe('text-yellow-600'); // Text color class
      expect(strength.bgColor).toBe('bg-yellow-500'); // Progress bar color
      expect(strength.crackTime).toBe('8 months'); // Time estimate
      expect(strength.feedback).toContain('Add another word or two'); // Suggestion
    });

    it('should check password against user context', async () => {
      const { default: zxcvbn } = await import('zxcvbn');
      const userEmail = 'alice@example.com';
      const userName = 'alice';

      vi.mocked(zxcvbn).mockReturnValue({
        score: 0,
        feedback: {
          warning: 'Passwords based on personal info are easy to guess',
          suggestions: [],
        },
        crack_times_display: { offline_slow_hashing_1e4_per_second: 'instant' },
      } as ZXCVBNResult);

      const strength = calculatePasswordStrength('alice123', [userName, userEmail]);
      expect(zxcvbn).toHaveBeenCalledWith('alice123', [userName, userEmail]);
      expect(strength.score).toBe(0);
    });
  });
});
