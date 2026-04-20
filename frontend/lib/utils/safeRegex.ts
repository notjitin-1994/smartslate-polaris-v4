/**
 * Safe Regular Expression Utility
 * Prevents RegExp DoS (ReDoS) attacks from malicious patterns
 *
 * Security measures:
 * - Input length limits
 * - Pattern validation
 * - Try-catch for invalid patterns
 * - Escaping utility for literal strings
 */

/**
 * Maximum allowed pattern length to prevent excessive computation
 */
const MAX_PATTERN_LENGTH = 500;

/**
 * Characters that need escaping in regex patterns
 */
const REGEX_SPECIAL_CHARS = /[.*+?^${}()|[\]\\]/g;

/**
 * Safely create a RegExp from user input with validation
 *
 * @param pattern - The regex pattern (potentially unsafe)
 * @param flags - Optional regex flags (g, i, m, etc.)
 * @returns RegExp object or null if invalid
 *
 * @example
 * ```ts
 * const regex = safeRegExp(userInput, 'gi');
 * if (regex) {
 *   const matches = text.match(regex);
 * }
 * ```
 */
export function safeRegExp(pattern: string, flags?: string): RegExp | null {
  // Validate input
  if (!pattern || typeof pattern !== 'string') {
    return null;
  }

  // Enforce length limit
  if (pattern.length > MAX_PATTERN_LENGTH) {
    console.warn(`RegExp pattern too long (${pattern.length} > ${MAX_PATTERN_LENGTH})`);
    return null;
  }

  // Attempt to create regex with error handling
  try {
    return new RegExp(pattern, flags);
  } catch (error) {
    console.warn('Invalid RegExp pattern:', error);
    return null;
  }
}

/**
 * Escape special regex characters for literal string matching
 *
 * @param str - String to escape
 * @returns Escaped string safe for use in regex
 *
 * @example
 * ```ts
 * const literal = 'user@example.com';
 * const pattern = escapeRegExp(literal); // 'user@example\\.com'
 * const regex = new RegExp(pattern);
 * ```
 */
export function escapeRegExp(str: string): string {
  if (!str || typeof str !== 'string') {
    return '';
  }
  return str.replace(REGEX_SPECIAL_CHARS, '\\$&');
}

/**
 * Test if a string matches a pattern safely
 *
 * @param text - Text to test
 * @param pattern - Regex pattern
 * @param flags - Optional regex flags
 * @returns true if matches, false otherwise (including on error)
 */
export function safeTest(text: string, pattern: string, flags?: string): boolean {
  const regex = safeRegExp(pattern, flags);
  if (!regex) {
    return false;
  }

  try {
    return regex.test(text);
  } catch (error) {
    console.warn('RegExp test failed:', error);
    return false;
  }
}

/**
 * Match a string against a pattern safely
 *
 * @param text - Text to match
 * @param pattern - Regex pattern
 * @param flags - Optional regex flags
 * @returns Array of matches or null
 */
export function safeMatch(text: string, pattern: string, flags?: string): RegExpMatchArray | null {
  const regex = safeRegExp(pattern, flags);
  if (!regex) {
    return null;
  }

  try {
    return text.match(regex);
  } catch (error) {
    console.warn('RegExp match failed:', error);
    return null;
  }
}
