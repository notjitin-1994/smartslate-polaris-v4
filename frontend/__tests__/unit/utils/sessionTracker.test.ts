/**
 * Unit Tests: Session Tracker Utilities
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { parseUserAgent } from '@/lib/utils/sessionTracker';

describe('Session Tracker Utilities', () => {
  describe('parseUserAgent', () => {
    it('should detect desktop Chrome on Windows', () => {
      const ua =
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
      const result = parseUserAgent(ua);

      expect(result.device_type).toBe('desktop');
      expect(result.browser).toBe('Chrome');
      expect(result.os).toBe('Windows');
    });

    it('should detect mobile Safari on iPhone', () => {
      const ua =
        'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1';
      const result = parseUserAgent(ua);

      expect(result.device_type).toBe('mobile');
      expect(result.browser).toBe('Safari');
      expect(result.os).toBe('iOS');
    });

    it('should detect tablet iPad', () => {
      const ua =
        'Mozilla/5.0 (iPad; CPU OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1';
      const result = parseUserAgent(ua);

      expect(result.device_type).toBe('tablet');
      expect(result.browser).toBe('Safari');
      expect(result.os).toBe('iOS');
    });

    it('should detect Firefox on Linux', () => {
      const ua = 'Mozilla/5.0 (X11; Linux x86_64; rv:109.0) Gecko/20100101 Firefox/120.0';
      const result = parseUserAgent(ua);

      expect(result.device_type).toBe('desktop');
      expect(result.browser).toBe('Firefox');
      expect(result.os).toBe('Linux');
    });

    it('should detect Edge browser', () => {
      const ua =
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0';
      const result = parseUserAgent(ua);

      expect(result.browser).toBe('Edge');
      expect(result.os).toBe('Windows');
    });

    it('should detect Chrome on macOS', () => {
      const ua =
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
      const result = parseUserAgent(ua);

      expect(result.device_type).toBe('desktop');
      expect(result.browser).toBe('Chrome');
      expect(result.os).toBe('macOS');
    });

    it('should detect Android mobile', () => {
      const ua =
        'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36';
      const result = parseUserAgent(ua);

      expect(result.device_type).toBe('mobile');
      expect(result.browser).toBe('Chrome');
      expect(result.os).toBe('Android');
    });

    it('should detect Android tablet', () => {
      const ua =
        'Mozilla/5.0 (Linux; Android 13; Pixel Tablet) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
      const result = parseUserAgent(ua);

      expect(result.device_type).toBe('tablet');
      expect(result.os).toBe('Android');
    });

    it('should handle unknown user agents gracefully', () => {
      const ua = 'UnknownBot/1.0';
      const result = parseUserAgent(ua);

      expect(result.device_type).toBe('desktop');
      expect(result.browser).toBe('Unknown');
      expect(result.os).toBe('Unknown');
    });

    it('should detect Opera browser', () => {
      const ua =
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 OPR/105.0.0.0';
      const result = parseUserAgent(ua);

      expect(result.browser).toBe('Opera');
    });

    it('should handle empty user agent string', () => {
      const ua = '';
      const result = parseUserAgent(ua);

      expect(result).toHaveProperty('device_type');
      expect(result).toHaveProperty('browser');
      expect(result).toHaveProperty('os');
    });

    it('should be case insensitive', () => {
      const ua = 'MOZILLA/5.0 (WINDOWS NT 10.0) CHROME/120.0.0.0';
      const result = parseUserAgent(ua);

      expect(result.browser).toBe('Chrome');
      expect(result.os).toBe('Windows');
    });
  });
});
