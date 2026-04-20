/**
 * Safe Regular Expression Utility for Scripts
 * Prevents RegExp DoS (ReDoS) attacks
 */

const MAX_PATTERN_LENGTH = 500;

export function safeRegExp(pattern: string, flags?: string): RegExp | null {
  if (!pattern || typeof pattern !== 'string') {
    return null;
  }

  if (pattern.length > MAX_PATTERN_LENGTH) {
    console.warn(`RegExp pattern too long (${pattern.length} > ${MAX_PATTERN_LENGTH})`);
    return null;
  }

  try {
    return new RegExp(pattern, flags);
  } catch (error) {
    console.warn('Invalid RegExp pattern:', error);
    return null;
  }
}

export function escapeRegExp(str: string): string {
  if (!str || typeof str !== 'string') {
    return '';
  }
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
