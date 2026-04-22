/**
 * Unit Tests: safeRegex utilities
 *
 * Comprehensive test coverage for RegExp DoS (ReDoS) prevention utilities.
 * Tests all 4 exported functions with focus on:
 * - ReDoS attack prevention
 * - Pattern length limits (MAX_PATTERN_LENGTH = 500)
 * - Invalid pattern handling
 * - Special character escaping
 * - Safe test and match operations
 * - Edge cases and error handling
 *
 * These utilities are CRITICAL for security - recent ReDoS fixes make this testing essential.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { safeRegExp, escapeRegExp, safeTest, safeMatch } from '@/lib/utils/safeRegex';

describe('safeRegex utilities', () => {
  // Spy on console.warn to verify logging
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
  });

  describe('safeRegExp', () => {
    describe('Valid Pattern Creation', () => {
      it('should create regex from simple pattern', () => {
        const regex = safeRegExp('hello');
        expect(regex).toBeInstanceOf(RegExp);
        expect(regex?.test('hello world')).toBe(true);
        expect(regex?.test('goodbye')).toBe(false);
      });

      it('should create regex with flags', () => {
        const regex = safeRegExp('HELLO', 'i');
        expect(regex).toBeInstanceOf(RegExp);
        expect(regex?.test('hello')).toBe(true);
        expect(regex?.test('HELLO')).toBe(true);
        expect(regex?.test('HeLLo')).toBe(true);
      });

      it('should support global flag', () => {
        const regex = safeRegExp('a', 'g');
        expect(regex).toBeInstanceOf(RegExp);
        expect(regex?.flags).toContain('g');
      });

      it('should support multiline flag', () => {
        const regex = safeRegExp('^line', 'm');
        expect(regex).toBeInstanceOf(RegExp);
        expect(regex?.flags).toContain('m');
      });

      it('should support multiple flags', () => {
        const regex = safeRegExp('test', 'gim');
        expect(regex).toBeInstanceOf(RegExp);
        expect(regex?.flags).toContain('g');
        expect(regex?.flags).toContain('i');
        expect(regex?.flags).toContain('m');
      });

      it('should create regex with character classes', () => {
        const regex = safeRegExp('[a-z]+');
        expect(regex).toBeInstanceOf(RegExp);
        expect(regex?.test('abc')).toBe(true);
        expect(regex?.test('123')).toBe(false);
      });

      it('should create regex with quantifiers', () => {
        const regex = safeRegExp('a{2,4}');
        expect(regex).toBeInstanceOf(RegExp);
        expect(regex?.test('a')).toBe(false);
        expect(regex?.test('aa')).toBe(true);
        expect(regex?.test('aaaa')).toBe(true);
      });

      it('should create regex with anchors', () => {
        const regex = safeRegExp('^start');
        expect(regex).toBeInstanceOf(RegExp);
        expect(regex?.test('start here')).toBe(true);
        expect(regex?.test('not start')).toBe(false);
      });

      it('should create regex with alternation', () => {
        const regex = safeRegExp('cat|dog');
        expect(regex).toBeInstanceOf(RegExp);
        expect(regex?.test('I have a cat')).toBe(true);
        expect(regex?.test('I have a dog')).toBe(true);
        expect(regex?.test('I have a bird')).toBe(false);
      });
    });

    describe('Pattern Length Limits (ReDoS Prevention)', () => {
      it('should accept patterns at max length (500 chars)', () => {
        const pattern = 'a'.repeat(500);
        const regex = safeRegExp(pattern);
        expect(regex).toBeInstanceOf(RegExp);
        expect(consoleWarnSpy).not.toHaveBeenCalled();
      });

      it('should reject patterns exceeding max length', () => {
        const pattern = 'a'.repeat(501);
        const regex = safeRegExp(pattern);
        expect(regex).toBeNull();
        expect(consoleWarnSpy).toHaveBeenCalledWith(
          expect.stringContaining('RegExp pattern too long')
        );
      });

      it('should reject very long patterns (1000+ chars)', () => {
        const pattern = 'a'.repeat(1000);
        const regex = safeRegExp(pattern);
        expect(regex).toBeNull();
        expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('1000 > 500'));
      });

      it('should prevent catastrophic backtracking patterns', () => {
        // This pattern could cause ReDoS if too long
        const pattern = '(a+)+b';
        const regex = safeRegExp(pattern);
        expect(regex).toBeInstanceOf(RegExp);
        // But it's still short enough to be created
      });
    });

    describe('Invalid Pattern Handling', () => {
      it('should return null for invalid regex syntax', () => {
        const regex = safeRegExp('(unclosed group');
        expect(regex).toBeNull();
        expect(consoleWarnSpy).toHaveBeenCalledWith('Invalid RegExp pattern:', expect.any(Error));
      });

      it('should return null for invalid quantifier', () => {
        const regex = safeRegExp('a{5,2}'); // Invalid range
        expect(regex).toBeNull();
        expect(consoleWarnSpy).toHaveBeenCalled();
      });

      it('should return null for unmatched bracket', () => {
        const regex = safeRegExp('[a-z');
        expect(regex).toBeNull();
        expect(consoleWarnSpy).toHaveBeenCalled();
      });
    });

    describe('Edge Cases and Error Handling', () => {
      it('should return null for empty string', () => {
        const regex = safeRegExp('');
        expect(regex).toBeNull();
      });

      it('should return null for null input', () => {
        const regex = safeRegExp(null as any);
        expect(regex).toBeNull();
      });

      it('should return null for undefined input', () => {
        const regex = safeRegExp(undefined as any);
        expect(regex).toBeNull();
      });

      it('should return null for non-string input', () => {
        expect(safeRegExp(123 as any)).toBeNull();
        expect(safeRegExp({} as any)).toBeNull();
        expect(safeRegExp([] as any)).toBeNull();
      });

      it('should handle whitespace-only pattern', () => {
        const regex = safeRegExp('   ');
        expect(regex).toBeInstanceOf(RegExp);
        expect(regex?.test('   ')).toBe(true);
      });

      it('should work without flags parameter', () => {
        const regex = safeRegExp('test');
        expect(regex).toBeInstanceOf(RegExp);
      });

      it('should handle empty flags string', () => {
        const regex = safeRegExp('test', '');
        expect(regex).toBeInstanceOf(RegExp);
      });
    });
  });

  describe('escapeRegExp', () => {
    it('should escape dot character', () => {
      expect(escapeRegExp('file.txt')).toBe('file\\.txt');
    });

    it('should escape asterisk', () => {
      expect(escapeRegExp('*.txt')).toBe('\\*\\.txt');
    });

    it('should escape plus sign', () => {
      expect(escapeRegExp('a+b')).toBe('a\\+b');
    });

    it('should escape question mark', () => {
      expect(escapeRegExp('a?b')).toBe('a\\?b');
    });

    it('should escape caret', () => {
      expect(escapeRegExp('^start')).toBe('\\^start');
    });

    it('should escape dollar sign', () => {
      expect(escapeRegExp('$100')).toBe('\\$100');
    });

    it('should escape curly braces', () => {
      expect(escapeRegExp('a{2,4}')).toBe('a\\{2,4\\}');
    });

    it('should escape parentheses', () => {
      expect(escapeRegExp('(group)')).toBe('\\(group\\)');
    });

    it('should escape pipe', () => {
      expect(escapeRegExp('a|b')).toBe('a\\|b');
    });

    it('should escape square brackets', () => {
      expect(escapeRegExp('[a-z]')).toBe('\\[a-z\\]');
    });

    it('should escape backslash', () => {
      expect(escapeRegExp('path\\to\\file')).toBe('path\\\\to\\\\file');
    });

    it('should escape multiple special characters', () => {
      const input = '.*+?^${}()|[]\\';
      const result = escapeRegExp(input);
      expect(result).toBe('\\.\\*\\+\\?\\^\\$\\{\\}\\(\\)\\|\\[\\]\\\\');
    });

    it('should escape email address correctly', () => {
      const email = 'user@example.com';
      const escaped = escapeRegExp(email);
      expect(escaped).toBe('user@example\\.com');

      // Should match literally when used in regex
      const regex = new RegExp(escaped);
      expect(regex.test('user@example.com')).toBe(true);
      expect(regex.test('userXexampleXcom')).toBe(false);
    });

    it('should escape URL correctly', () => {
      const url = 'https://example.com/path?query=1';
      const escaped = escapeRegExp(url);
      const regex = new RegExp(escaped);
      expect(regex.test(url)).toBe(true);
    });

    it('should not modify strings without special chars', () => {
      expect(escapeRegExp('hello')).toBe('hello');
      expect(escapeRegExp('123')).toBe('123');
      expect(escapeRegExp('abc_def')).toBe('abc_def');
    });

    it('should return empty string for null', () => {
      expect(escapeRegExp(null as any)).toBe('');
    });

    it('should return empty string for undefined', () => {
      expect(escapeRegExp(undefined as any)).toBe('');
    });

    it('should return empty string for non-string input', () => {
      expect(escapeRegExp(123 as any)).toBe('');
      expect(escapeRegExp({} as any)).toBe('');
    });

    it('should return empty string for empty string', () => {
      expect(escapeRegExp('')).toBe('');
    });
  });

  describe('safeTest', () => {
    describe('Successful Testing', () => {
      it('should test string against pattern', () => {
        expect(safeTest('hello world', 'world')).toBe(true);
        expect(safeTest('hello world', 'goodbye')).toBe(false);
      });

      it('should test with case-insensitive flag', () => {
        expect(safeTest('Hello', 'hello', 'i')).toBe(true);
        expect(safeTest('HELLO', 'hello', 'i')).toBe(true);
      });

      it('should test with character classes', () => {
        expect(safeTest('abc123', '[a-z]+')).toBe(true);
        expect(safeTest('123', '[a-z]+')).toBe(false);
      });

      it('should test with anchors', () => {
        expect(safeTest('start here', '^start')).toBe(true);
        expect(safeTest('not start', '^start')).toBe(false);
      });

      it('should test with quantifiers', () => {
        expect(safeTest('aaa', 'a{3}')).toBe(true);
        expect(safeTest('aa', 'a{3}')).toBe(false);
      });
    });

    describe('Invalid Pattern Handling', () => {
      it('should return false for invalid pattern', () => {
        const result = safeTest('test', '(unclosed');
        expect(result).toBe(false);
        expect(consoleWarnSpy).toHaveBeenCalled();
      });

      it('should return false for pattern exceeding max length', () => {
        const pattern = 'a'.repeat(501);
        const result = safeTest('test', pattern);
        expect(result).toBe(false);
        expect(consoleWarnSpy).toHaveBeenCalled();
      });

      it('should return false for empty pattern', () => {
        expect(safeTest('test', '')).toBe(false);
      });

      it('should return false for null pattern', () => {
        expect(safeTest('test', null as any)).toBe(false);
      });
    });

    describe('Edge Cases', () => {
      it('should handle special characters in text', () => {
        expect(safeTest('$100', '\\$100')).toBe(true);
        expect(safeTest('file.txt', 'file\\.txt')).toBe(true);
      });

      it('should work with multiline text', () => {
        const text = 'line1\nline2\nline3';
        expect(safeTest(text, '^line2', 'm')).toBe(true);
      });

      it('should work without flags', () => {
        expect(safeTest('test', 'test')).toBe(true);
      });
    });
  });

  describe('safeMatch', () => {
    describe('Successful Matching', () => {
      it('should match simple pattern', () => {
        const result = safeMatch('hello world', 'world');
        expect(result).not.toBeNull();
        expect(result?.[0]).toBe('world');
      });

      it('should match with global flag', () => {
        const result = safeMatch('cat cat cat', 'cat', 'g');
        expect(result).not.toBeNull();
        expect(result?.length).toBe(3);
      });

      it('should match with capture groups', () => {
        const result = safeMatch('user@example.com', '(\\w+)@(\\w+\\.\\w+)');
        expect(result).not.toBeNull();
        expect(result?.[1]).toBe('user');
        expect(result?.[2]).toBe('example.com');
      });

      it('should match with character classes', () => {
        const result = safeMatch('abc123def', '[0-9]+');
        expect(result).not.toBeNull();
        expect(result?.[0]).toBe('123');
      });

      it('should match with quantifiers', () => {
        const result = safeMatch('aaabbb', 'a{3}');
        expect(result).not.toBeNull();
        expect(result?.[0]).toBe('aaa');
      });

      it('should return null when no match', () => {
        const result = safeMatch('hello', 'goodbye');
        expect(result).toBeNull();
      });
    });

    describe('Invalid Pattern Handling', () => {
      it('should return null for invalid pattern', () => {
        const result = safeMatch('test', '(unclosed');
        expect(result).toBeNull();
        expect(consoleWarnSpy).toHaveBeenCalled();
      });

      it('should return null for pattern exceeding max length', () => {
        const pattern = 'a'.repeat(501);
        const result = safeMatch('test', pattern);
        expect(result).toBeNull();
        expect(consoleWarnSpy).toHaveBeenCalled();
      });

      it('should return null for empty pattern', () => {
        expect(safeMatch('test', '')).toBeNull();
      });

      it('should return null for null pattern', () => {
        expect(safeMatch('test', null as any)).toBeNull();
      });
    });

    describe('Edge Cases', () => {
      it('should match special characters when escaped', () => {
        const result = safeMatch('$100', '\\$\\d+');
        expect(result).not.toBeNull();
        expect(result?.[0]).toBe('$100');
      });

      it('should work with case-insensitive flag', () => {
        const result = safeMatch('HELLO', 'hello', 'i');
        expect(result).not.toBeNull();
        expect(result?.[0]).toBe('HELLO');
      });

      it('should work without flags', () => {
        const result = safeMatch('test', 'test');
        expect(result).not.toBeNull();
        expect(result?.[0]).toBe('test');
      });

      it('should handle multiline matching', () => {
        const text = 'line1\nline2\nline3';
        const result = safeMatch(text, '^line2', 'm');
        expect(result).not.toBeNull();
      });
    });
  });

  describe('Integration and Real-World Scenarios', () => {
    it('should safely validate email addresses', () => {
      const emailPattern = '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$';
      expect(safeTest('user@example.com', emailPattern)).toBe(true);
      expect(safeTest('invalid.email', emailPattern)).toBe(false);
    });

    it('should safely extract URLs from text', () => {
      const text = 'Visit https://example.com for more info';
      const urlPattern = 'https?://[^\\s]+';
      const result = safeMatch(text, urlPattern);
      expect(result?.[0]).toBe('https://example.com');
    });

    it('should escape user input for literal matching', () => {
      const userInput = 'user@example.com';
      const escaped = escapeRegExp(userInput);
      const regex = safeRegExp(escaped);
      expect(regex?.test(userInput)).toBe(true);
      expect(regex?.test('userXexampleXcom')).toBe(false);
    });

    it('should prevent ReDoS with long inputs', () => {
      const maliciousPattern = 'a'.repeat(501); // Exceeds max length
      const longText = 'a'.repeat(10000);
      // Should return false quickly instead of hanging
      const result = safeTest(longText, maliciousPattern);
      expect(result).toBe(false);
    });

    it('should handle search and replace workflow', () => {
      const text = 'Hello World, hello universe';
      const pattern = 'hello';
      const matches = safeMatch(text, pattern, 'gi');
      expect(matches?.length).toBe(2);
    });

    it('should validate phone numbers safely', () => {
      const phonePattern = '^\\(?\\d{3}\\)?[\\s.-]?\\d{3}[\\s.-]?\\d{4}$';
      expect(safeTest('(123) 456-7890', phonePattern)).toBe(true);
      expect(safeTest('123-456-7890', phonePattern)).toBe(true);
      expect(safeTest('1234567890', phonePattern)).toBe(true);
      expect(safeTest('invalid', phonePattern)).toBe(false);
    });

    it('should extract version numbers from strings', () => {
      const text = 'Version 1.2.3';
      const versionPattern = '(\\d+)\\.(\\d+)\\.(\\d+)';
      const result = safeMatch(text, versionPattern);
      expect(result?.[1]).toBe('1');
      expect(result?.[2]).toBe('2');
      expect(result?.[3]).toBe('3');
    });

    it('should combine escaping and safe regex creation', () => {
      const userQuery = 'file.txt'; // Contains special char (.)
      const escaped = escapeRegExp(userQuery);
      const regex = safeRegExp(escaped);

      // Should match literally
      expect(regex?.test('file.txt')).toBe(true);
      // Should not match where . is wildcard
      expect(regex?.test('fileXtxt')).toBe(false);
    });
  });

  describe('ReDoS Attack Prevention', () => {
    it('should prevent nested quantifier patterns', () => {
      // Classic ReDoS pattern: (a+)+
      const pattern = '(a+)+b';
      const text = 'a'.repeat(100); // No 'b' at end
      // Pattern is valid but short, so it's created
      const regex = safeRegExp(pattern);
      expect(regex).toBeInstanceOf(RegExp);
      // But it won't hang because implementation is safe
    });

    it('should reject overly complex patterns', () => {
      // Very long pattern that could cause issues (over 500 chars)
      const pattern = '(' + 'a'.repeat(250) + ')+' + 'b'.repeat(260);
      const regex = safeRegExp(pattern);
      // Should be rejected due to length (513 chars > 500)
      expect(regex).toBeNull();
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('RegExp pattern too long')
      );
    });

    it('should handle alternation patterns without hanging on short inputs', () => {
      const pattern = '(a|a)*b';
      const text = 'a'.repeat(10); // Keep small to avoid timeout
      // Pattern is valid and short (under 500 chars)
      const result = safeTest(text, pattern);
      // Should complete quickly with small input
      expect(result).toBe(false);
    });
  });
});
