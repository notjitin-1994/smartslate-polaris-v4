/**
 * Unit Tests: sanitizeHtml utilities
 *
 * Comprehensive test coverage for HTML sanitization and XSS prevention utilities.
 * Tests all 5 exported functions with focus on:
 * - XSS attack prevention
 * - Multiple sanitization levels (strict, standard, rich, pdf)
 * - HTML escaping for plain text
 * - Batch sanitization
 * - Dangerous content detection
 * - Edge cases and error handling
 *
 * These utilities are CRITICAL for security - recent XSS fixes make this testing essential.
 */

import { describe, it, expect, vi } from 'vitest';
import {
  sanitizeHtml,
  escapeHtml,
  sanitizeHtmlArray,
  containsDangerousHtml,
  type SanitizeLevel,
} from '@/lib/utils/sanitizeHtml';

describe('sanitizeHtml utilities', () => {
  describe('sanitizeHtml', () => {
    describe('XSS Attack Prevention', () => {
      it('should remove script tags', () => {
        const malicious = '<script>alert("XSS")</script><p>Safe content</p>';
        const result = sanitizeHtml(malicious);
        expect(result).not.toContain('<script>');
        expect(result).not.toContain('alert');
        expect(result).toContain('Safe content');
      });

      it('should remove event handlers', () => {
        const malicious = '<div onclick="alert(\'XSS\')">Click me</div>';
        const result = sanitizeHtml(malicious);
        expect(result).not.toContain('onclick');
        expect(result).not.toContain('alert');
      });

      it('should remove javascript: protocol', () => {
        const malicious = '<a href="javascript:alert(\'XSS\')">Click</a>';
        const result = sanitizeHtml(malicious);
        expect(result).not.toContain('javascript:');
        expect(result).not.toContain('alert');
      });

      it('should remove iframe tags', () => {
        const malicious = '<iframe src="http://evil.com"></iframe><p>Content</p>';
        const result = sanitizeHtml(malicious);
        expect(result).not.toContain('<iframe');
        expect(result).toContain('Content');
      });

      it('should remove object tags', () => {
        const malicious = '<object data="evil.swf"></object>';
        const result = sanitizeHtml(malicious);
        expect(result).not.toContain('<object');
      });

      it('should remove embed tags', () => {
        const malicious = '<embed src="evil.swf"></embed>';
        const result = sanitizeHtml(malicious);
        expect(result).not.toContain('<embed');
      });

      it('should remove link tags', () => {
        const malicious = '<link rel="stylesheet" href="evil.css">';
        const result = sanitizeHtml(malicious);
        expect(result).not.toContain('<link');
      });

      it('should handle multiple XSS vectors in one string', () => {
        const malicious =
          '<script>alert(1)</script><img src=x onerror=alert(2)><iframe src="evil"></iframe>';
        const result = sanitizeHtml(malicious);
        expect(result).not.toContain('<script>');
        expect(result).not.toContain('onerror');
        expect(result).not.toContain('<iframe');
        expect(result).not.toContain('alert');
      });
    });

    describe('Sanitization Level: strict', () => {
      it('should remove all HTML tags and keep only text', () => {
        const html = '<p>Hello <strong>world</strong></p>';
        const result = sanitizeHtml(html, 'strict');
        expect(result).not.toContain('<p>');
        expect(result).not.toContain('<strong>');
        expect(result).toContain('Hello');
        expect(result).toContain('world');
      });

      it('should strip formatting but preserve content', () => {
        const html = '<b>Bold</b> <i>Italic</i> <u>Underline</u>';
        const result = sanitizeHtml(html, 'strict');
        expect(result).toContain('Bold');
        expect(result).toContain('Italic');
        expect(result).toContain('Underline');
        expect(result).not.toContain('<b>');
        expect(result).not.toContain('<i>');
        expect(result).not.toContain('<u>');
      });
    });

    describe('Sanitization Level: standard', () => {
      it('should allow safe formatting tags', () => {
        const html = '<p><strong>Bold</strong> <em>Italic</em></p>';
        const result = sanitizeHtml(html, 'standard');
        expect(result).toContain('<strong>');
        expect(result).toContain('<em>');
        expect(result).toContain('Bold');
        expect(result).toContain('Italic');
      });

      it('should allow basic tags (b, i, u, br, span)', () => {
        const html = '<b>Bold</b> <i>Italic</i> <u>Underline</u> <br> <span>Span</span>';
        const result = sanitizeHtml(html, 'standard');
        expect(result).toContain('<b>');
        expect(result).toContain('<i>');
        expect(result).toContain('<u>');
        expect(result).toContain('<br>');
        expect(result).toContain('<span>');
      });

      it('should allow safe style attributes', () => {
        const html = '<span style="color: #ff0000; font-size: 14px;">Red text</span>';
        const result = sanitizeHtml(html, 'standard');
        expect(result).toContain('style');
        expect(result).toContain('color');
        expect(result).toContain('font-size');
      });

      it('should not allow structural tags like div or headings', () => {
        const html = '<div><h1>Title</h1></div>';
        const result = sanitizeHtml(html, 'standard');
        expect(result).not.toContain('<div>');
        expect(result).not.toContain('<h1>');
      });
    });

    describe('Sanitization Level: rich', () => {
      it('should allow structural tags (div, headings, lists)', () => {
        const html = '<div><h1>Title</h1><ul><li>Item</li></ul></div>';
        const result = sanitizeHtml(html, 'rich');
        expect(result).toContain('<div>');
        expect(result).toContain('<h1>');
        expect(result).toContain('<ul>');
        expect(result).toContain('<li>');
      });

      it('should allow all heading levels (h1-h6)', () => {
        const html = '<h1>H1</h1><h2>H2</h2><h3>H3</h3><h4>H4</h4><h5>H5</h5><h6>H6</h6>';
        const result = sanitizeHtml(html, 'rich');
        expect(result).toContain('<h1>');
        expect(result).toContain('<h2>');
        expect(result).toContain('<h3>');
        expect(result).toContain('<h4>');
        expect(result).toContain('<h5>');
        expect(result).toContain('<h6>');
      });

      it('should allow lists (ul, ol, li)', () => {
        const html = '<ul><li>Item 1</li></ul><ol><li>Item 2</li></ol>';
        const result = sanitizeHtml(html, 'rich');
        expect(result).toContain('<ul>');
        expect(result).toContain('<ol>');
        expect(result).toContain('<li>');
      });

      it('should allow class attribute', () => {
        const html = '<div class="container">Content</div>';
        const result = sanitizeHtml(html, 'rich');
        expect(result).toContain('class');
        expect(result).toContain('container');
      });

      it('should allow more CSS properties than standard', () => {
        const html = '<div style="margin: 10px; padding: 5px; text-align: center;">Content</div>';
        const result = sanitizeHtml(html, 'rich');
        expect(result).toContain('margin');
        expect(result).toContain('padding');
        expect(result).toContain('text-align');
      });

      it('should not allow table tags (reserved for pdf level)', () => {
        const html = '<table><tr><td>Cell</td></tr></table>';
        const result = sanitizeHtml(html, 'rich');
        expect(result).not.toContain('<table>');
        expect(result).not.toContain('<tr>');
        expect(result).not.toContain('<td>');
      });
    });

    describe('Sanitization Level: pdf', () => {
      it('should allow table tags for PDF generation', () => {
        const html =
          '<table><thead><tr><th>Header</th></tr></thead><tbody><tr><td>Cell</td></tr></tbody></table>';
        const result = sanitizeHtml(html, 'pdf');
        expect(result).toContain('<table>');
        expect(result).toContain('<thead>');
        expect(result).toContain('<tbody>');
        expect(result).toContain('<tr>');
        expect(result).toContain('<th>');
        expect(result).toContain('<td>');
      });

      it('should allow all safe tags from rich level plus tables', () => {
        const html = '<div><h1>Title</h1><table><tr><td>Data</td></tr></table></div>';
        const result = sanitizeHtml(html, 'pdf');
        expect(result).toContain('<div>');
        expect(result).toContain('<h1>');
        expect(result).toContain('<table>');
      });

      it('should allow extensive CSS properties for PDF styling', () => {
        const html = `<div style="
          font-family: Arial;
          page-break-after: always;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          display: flex;
          justify-content: center;
        ">PDF Content</div>`;
        const result = sanitizeHtml(html, 'pdf');
        expect(result).toContain('font-family');
        expect(result).toContain('page-break-after');
        expect(result).toContain('box-shadow');
        expect(result).toContain('display');
        expect(result).toContain('justify-content');
      });
    });

    describe('Edge Cases and Error Handling', () => {
      it('should return empty string for null input', () => {
        const result = sanitizeHtml(null as any);
        expect(result).toBe('');
      });

      it('should return empty string for undefined input', () => {
        const result = sanitizeHtml(undefined as any);
        expect(result).toBe('');
      });

      it('should return empty string for non-string input', () => {
        expect(sanitizeHtml(123 as any)).toBe('');
        expect(sanitizeHtml({} as any)).toBe('');
        expect(sanitizeHtml([] as any)).toBe('');
      });

      it('should handle empty string', () => {
        const result = sanitizeHtml('');
        expect(result).toBe('');
      });

      it('should handle plain text without HTML', () => {
        const text = 'Just plain text';
        const result = sanitizeHtml(text);
        expect(result).toBe(text);
      });

      it('should handle malformed HTML gracefully', () => {
        const malformed = '<p>Unclosed paragraph<div>Mixed</p></div>';
        const result = sanitizeHtml(malformed);
        // Should not throw, returns sanitized version
        expect(result).toBeTruthy();
      });

      it('should default to standard level when level not specified', () => {
        const html = '<p><strong>Text</strong></p>';
        const result = sanitizeHtml(html);
        expect(result).toContain('<p>');
        expect(result).toContain('<strong>');
      });

      it('should handle very long HTML strings', () => {
        const longHtml = '<p>' + 'a'.repeat(10000) + '</p>';
        const result = sanitizeHtml(longHtml);
        expect(result).toContain('<p>');
        expect(result.length).toBeGreaterThan(1000);
      });
    });
  });

  describe('escapeHtml', () => {
    it('should escape ampersand', () => {
      expect(escapeHtml('Tom & Jerry')).toBe('Tom &amp; Jerry');
    });

    it('should escape less than', () => {
      expect(escapeHtml('5 < 10')).toBe('5 &lt; 10');
    });

    it('should escape greater than', () => {
      expect(escapeHtml('10 > 5')).toBe('10 &gt; 5');
    });

    it('should escape double quotes', () => {
      expect(escapeHtml('Say "hello"')).toBe('Say &quot;hello&quot;');
    });

    it('should escape single quotes', () => {
      expect(escapeHtml("It's mine")).toBe('It&#39;s mine');
    });

    it('should escape forward slash', () => {
      expect(escapeHtml('path/to/file')).toBe('path&#x2F;to&#x2F;file');
    });

    it('should escape multiple special characters', () => {
      const input = '<script>alert("XSS")</script>';
      const expected = '&lt;script&gt;alert(&quot;XSS&quot;)&lt;&#x2F;script&gt;';
      expect(escapeHtml(input)).toBe(expected);
    });

    it('should escape all HTML entities in complex string', () => {
      const input = `<div class="test" onclick='alert("&")'></div>`;
      const result = escapeHtml(input);
      expect(result).not.toContain('<');
      expect(result).not.toContain('>');
      expect(result).toContain('&lt;');
      expect(result).toContain('&gt;');
      expect(result).toContain('&quot;');
      expect(result).toContain('&#39;');
    });

    it('should return empty string for null', () => {
      expect(escapeHtml(null as any)).toBe('');
    });

    it('should return empty string for undefined', () => {
      expect(escapeHtml(undefined as any)).toBe('');
    });

    it('should return empty string for non-string input', () => {
      expect(escapeHtml(123 as any)).toBe('');
      expect(escapeHtml({} as any)).toBe('');
    });

    it('should handle empty string', () => {
      expect(escapeHtml('')).toBe('');
    });

    it('should not modify plain text without special characters', () => {
      const text = 'Hello World 123';
      expect(escapeHtml(text)).toBe(text);
    });
  });

  describe('sanitizeHtmlArray', () => {
    it('should sanitize all items in array', () => {
      const items = [
        '<script>alert(1)</script><p>Text 1</p>',
        '<p><strong>Text 2</strong></p>',
        '<div onclick="alert(3)">Text 3</div>',
      ];
      const results = sanitizeHtmlArray(items);

      expect(results).toHaveLength(3);
      expect(results[0]).not.toContain('<script>');
      expect(results[0]).toContain('Text 1');
      expect(results[1]).toContain('<strong>');
      expect(results[2]).not.toContain('onclick');
    });

    it('should apply specified sanitization level to all items', () => {
      const items = ['<div>Item 1</div>', '<div>Item 2</div>'];
      const resultsRich = sanitizeHtmlArray(items, 'rich');
      const resultsStandard = sanitizeHtmlArray(items, 'standard');

      // Rich level allows div
      expect(resultsRich[0]).toContain('<div>');
      expect(resultsRich[1]).toContain('<div>');

      // Standard level removes div
      expect(resultsStandard[0]).not.toContain('<div>');
      expect(resultsStandard[1]).not.toContain('<div>');
    });

    it('should handle empty array', () => {
      const result = sanitizeHtmlArray([]);
      expect(result).toEqual([]);
    });

    it('should handle array with empty strings', () => {
      const items = ['', '', ''];
      const results = sanitizeHtmlArray(items);
      expect(results).toEqual(['', '', '']);
    });

    it('should handle mixed content array', () => {
      const items = ['<p>Safe</p>', '<script>alert(1)</script>', 'Plain text', ''];
      const results = sanitizeHtmlArray(items);

      expect(results).toHaveLength(4);
      expect(results[0]).toContain('<p>');
      expect(results[1]).not.toContain('<script>');
      expect(results[2]).toBe('Plain text');
      expect(results[3]).toBe('');
    });

    it('should default to standard level', () => {
      const items = ['<div><p>Text</p></div>'];
      const results = sanitizeHtmlArray(items);

      expect(results[0]).toContain('<p>');
      expect(results[0]).not.toContain('<div>');
    });
  });

  describe('containsDangerousHtml', () => {
    it('should detect script tags', () => {
      expect(containsDangerousHtml('<script>alert("XSS")</script>')).toBe(true);
      expect(containsDangerousHtml('<SCRIPT>alert("XSS")</SCRIPT>')).toBe(true);
    });

    it('should detect javascript: protocol', () => {
      expect(containsDangerousHtml('<a href="javascript:alert(1)">Click</a>')).toBe(true);
      expect(containsDangerousHtml('<a href="JAVASCRIPT:alert(1)">Click</a>')).toBe(true);
    });

    it('should detect event handlers', () => {
      expect(containsDangerousHtml('<div onclick="alert(1)">Click</div>')).toBe(true);
      expect(containsDangerousHtml('<img onerror="alert(1)" src="x">')).toBe(true);
      expect(containsDangerousHtml('<body onload="alert(1)">')).toBe(true);
    });

    it('should detect iframe tags', () => {
      expect(containsDangerousHtml('<iframe src="evil.com"></iframe>')).toBe(true);
      expect(containsDangerousHtml('<IFRAME src="evil.com"></IFRAME>')).toBe(true);
    });

    it('should detect object tags', () => {
      expect(containsDangerousHtml('<object data="evil.swf"></object>')).toBe(true);
    });

    it('should detect embed tags', () => {
      expect(containsDangerousHtml('<embed src="evil.swf"></embed>')).toBe(true);
    });

    it('should detect link tags', () => {
      expect(containsDangerousHtml('<link rel="stylesheet" href="evil.css">')).toBe(true);
    });

    it('should detect meta tags', () => {
      expect(containsDangerousHtml('<meta http-equiv="refresh" content="0;url=evil.com">')).toBe(
        true
      );
    });

    it('should return false for safe HTML', () => {
      expect(containsDangerousHtml('<p>Safe paragraph</p>')).toBe(false);
      expect(containsDangerousHtml('<strong>Bold text</strong>')).toBe(false);
      expect(containsDangerousHtml('<div><h1>Title</h1></div>')).toBe(false);
    });

    it('should return false for plain text', () => {
      expect(containsDangerousHtml('Just plain text')).toBe(false);
      expect(containsDangerousHtml('Text with <brackets> but no tags')).toBe(false);
    });

    it('should return false for null/undefined', () => {
      expect(containsDangerousHtml(null as any)).toBe(false);
      expect(containsDangerousHtml(undefined as any)).toBe(false);
    });

    it('should return false for non-string input', () => {
      expect(containsDangerousHtml(123 as any)).toBe(false);
      expect(containsDangerousHtml({} as any)).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(containsDangerousHtml('')).toBe(false);
    });

    it('should detect multiple dangerous patterns', () => {
      const dangerous = `
        <script>alert(1)</script>
        <iframe src="evil"></iframe>
        <div onclick="alert(2)">Click</div>
      `;
      expect(containsDangerousHtml(dangerous)).toBe(true);
    });
  });

  describe('Integration and Real-World Scenarios', () => {
    it('should sanitize user profile bio (standard level)', () => {
      const userBio = `
        <p>Hello! I'm a developer.</p>
        <strong>Skills:</strong> <em>JavaScript, TypeScript</em>
        <script>steal_cookies()</script>
      `;
      const result = sanitizeHtml(userBio, 'standard');

      expect(result).toContain('Hello');
      expect(result).toContain('<strong>');
      expect(result).toContain('<em>');
      expect(result).not.toContain('<script>');
      expect(result).not.toContain('steal_cookies');
    });

    it('should sanitize markdown-converted HTML (rich level)', () => {
      const markdown = `
        <h1>Article Title</h1>
        <p>Introduction paragraph</p>
        <ul>
          <li>Point 1</li>
          <li>Point 2</li>
        </ul>
        <div onclick="evil()">Malicious div</div>
      `;
      const result = sanitizeHtml(markdown, 'rich');

      expect(result).toContain('<h1>');
      expect(result).toContain('<ul>');
      expect(result).toContain('<li>');
      expect(result).not.toContain('onclick');
      expect(result).not.toContain('evil()');
    });

    it('should prepare content for PDF export (pdf level)', () => {
      const content = `
        <div style="page-break-after: always;">
          <h1>Chapter 1</h1>
          <table>
            <tr><td>Data</td></tr>
          </table>
          <script>alert("xss")</script>
        </div>
      `;
      const result = sanitizeHtml(content, 'pdf');

      expect(result).toContain('<table>');
      expect(result).toContain('page-break-after');
      expect(result).not.toContain('<script>');
    });

    it('should handle comment text before saving to database', () => {
      const comment = `
        Great article! <a href="javascript:steal()">Click here</a>
        <img src=x onerror="alert(1)">
      `;
      const result = sanitizeHtml(comment, 'standard');

      expect(result).not.toContain('javascript:');
      expect(result).not.toContain('onerror');
      expect(result).toContain('Great article');
    });

    it('should detect and prevent before sanitizing if needed', () => {
      const userInput = '<script>alert("XSS")</script><p>Content</p>';

      // First check for danger
      const isDangerous = containsDangerousHtml(userInput);
      expect(isDangerous).toBe(true);

      // Then sanitize
      const sanitized = sanitizeHtml(userInput);
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).toContain('Content');
    });

    it('should batch sanitize array of user comments', () => {
      const comments = [
        '<p>Nice post!</p>',
        '<script>alert(1)</script>',
        '<p><strong>Great work</strong></p>',
      ];

      const sanitized = sanitizeHtmlArray(comments, 'standard');

      expect(sanitized[0]).toContain('<p>');
      expect(sanitized[1]).not.toContain('<script>');
      expect(sanitized[2]).toContain('<strong>');
    });

    it('should escape user input for displaying in HTML attribute', () => {
      const userTitle = 'My "Special" <Project> & More';
      const escaped = escapeHtml(userTitle);

      expect(escaped).toContain('&quot;');
      expect(escaped).toContain('&lt;');
      expect(escaped).toContain('&gt;');
      expect(escaped).toContain('&amp;');

      // Safe to use in: <div title="${escaped}">
    });
  });
});
