/**
 * HTML Sanitization Utility
 * Prevents XSS attacks by sanitizing user-generated HTML content
 */

import DOMPurify from 'isomorphic-dompurify';

/**
 * Configuration for different sanitization levels
 */
const SANITIZE_CONFIGS = {
  // Strict: Remove all HTML tags, keep only text content
  strict: {
    ALLOWED_TAGS: [],
    KEEP_CONTENT: true,
  },

  // Standard: Allow safe formatting tags only
  standard: {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'u', 'br', 'p', 'span'],
    ALLOWED_ATTR: ['style'],
    ALLOWED_STYLES: {
      '*': {
        color: [/^#[0-9a-fA-F]{3,6}$/],
        'font-weight': [/^\d+$/],
        'font-size': [/^\d+(px|em|rem|%)$/],
      },
    },
  },

  // Rich: Allow more formatting including lists and headings
  rich: {
    ALLOWED_TAGS: [
      'b',
      'i',
      'em',
      'strong',
      'u',
      'br',
      'p',
      'span',
      'div',
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'ul',
      'ol',
      'li',
    ],
    ALLOWED_ATTR: ['style', 'class'],
    ALLOWED_STYLES: {
      '*': {
        color: [/^#[0-9a-fA-F]{3,6}$/],
        'background-color': [/^#[0-9a-fA-F]{3,6}$/],
        'font-weight': [/^\d+$/],
        'font-size': [/^\d+(px|em|rem|%)$/],
        margin: [/^\d+(px|em|rem|%)(\s+\d+(px|em|rem|%))*$/],
        padding: [/^\d+(px|em|rem|%)(\s+\d+(px|em|rem|%))*$/],
        'text-align': [/^(left|right|center|justify)$/],
        'line-height': [/^\d+(\.\d+)?$/],
      },
    },
  },

  // PDF: Allow all safe tags for PDF generation
  pdf: {
    ALLOWED_TAGS: [
      'b',
      'i',
      'em',
      'strong',
      'u',
      'br',
      'p',
      'span',
      'div',
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'ul',
      'ol',
      'li',
      'table',
      'thead',
      'tbody',
      'tr',
      'th',
      'td',
    ],
    ALLOWED_ATTR: ['style', 'class'],
    ALLOWED_STYLES: {
      '*': {
        // Allow all safe CSS properties for PDF styling
        color: [/.*/],
        'background-color': [/.*/],
        background: [/.*/],
        'font-weight': [/.*/],
        'font-size': [/.*/],
        'font-family': [/.*/],
        margin: [/.*/],
        'margin-top': [/.*/],
        'margin-bottom': [/.*/],
        'margin-left': [/.*/],
        'margin-right': [/.*/],
        padding: [/.*/],
        'padding-top': [/.*/],
        'padding-bottom': [/.*/],
        'padding-left': [/.*/],
        'padding-right': [/.*/],
        'text-align': [/.*/],
        'line-height': [/.*/],
        border: [/.*/],
        'border-top': [/.*/],
        'border-bottom': [/.*/],
        'border-left': [/.*/],
        'border-right': [/.*/],
        'border-radius': [/.*/],
        width: [/.*/],
        height: [/.*/],
        'min-width': [/.*/],
        'min-height': [/.*/],
        'max-width': [/.*/],
        'max-height': [/.*/],
        display: [/.*/],
        flex: [/.*/],
        'flex-direction': [/.*/],
        'justify-content': [/.*/],
        'align-items': [/.*/],
        gap: [/.*/],
        'grid-template-columns': [/.*/],
        'box-shadow': [/.*/],
        opacity: [/.*/],
        position: [/.*/],
        top: [/.*/],
        left: [/.*/],
        right: [/.*/],
        bottom: [/.*/],
        'z-index': [/.*/],
        overflow: [/.*/],
        'page-break-after': [/.*/],
        'page-break-before': [/.*/],
        'page-break-inside': [/.*/],
        'letter-spacing': [/.*/],
        'white-space': [/.*/],
        'list-style-position': [/.*/],
      },
    },
  },
};

export type SanitizeLevel = 'strict' | 'standard' | 'rich' | 'pdf';

/**
 * Sanitize HTML content to prevent XSS attacks
 * @param html - HTML string to sanitize
 * @param level - Sanitization level (default: 'standard')
 * @returns Sanitized HTML string safe for rendering
 */
export function sanitizeHtml(html: string, level: SanitizeLevel = 'standard'): string {
  if (!html || typeof html !== 'string') {
    return '';
  }

  try {
    const config = SANITIZE_CONFIGS[level];
    return DOMPurify.sanitize(html, config);
  } catch (error) {
    console.error('HTML sanitization failed:', error);
    // Return empty string on error to be safe
    return '';
  }
}

/**
 * Escape HTML special characters to prevent XSS
 * Use this for plain text that will be inserted into HTML
 * @param text - Plain text to escape
 * @returns HTML-safe text
 */
export function escapeHtml(text: string): string {
  if (!text || typeof text !== 'string') {
    return '';
  }

  const htmlEscapes: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '/': '&#x2F;',
  };

  return text.replace(/[&<>"'/]/g, (char) => htmlEscapes[char] || char);
}

/**
 * Sanitize an array of HTML strings
 * @param items - Array of HTML strings
 * @param level - Sanitization level
 * @returns Array of sanitized HTML strings
 */
export function sanitizeHtmlArray(items: string[], level: SanitizeLevel = 'standard'): string[] {
  return items.map((item) => sanitizeHtml(item, level));
}

/**
 * Check if a string contains potentially dangerous HTML
 * @param html - HTML string to check
 * @returns true if potentially dangerous content detected
 */
export function containsDangerousHtml(html: string): boolean {
  if (!html || typeof html !== 'string') {
    return false;
  }

  // Check for common XSS patterns
  const dangerousPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi, // Event handlers like onclick=
    /<iframe\b/gi,
    /<object\b/gi,
    /<embed\b/gi,
    /<link\b/gi,
    /<meta\b/gi,
  ];

  return dangerousPatterns.some((pattern) => pattern.test(html));
}
