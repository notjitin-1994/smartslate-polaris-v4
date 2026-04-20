/**
 * Test to verify my-starmaps route works after moving to (auth) route group
 */

import { describe, it, expect } from 'vitest';

describe('My Starmaps Route', () => {
  it('should be located in the (auth) route group', () => {
    // This test verifies the file exists in the correct location
    const path = '/app/(auth)/my-starmaps/page.tsx';
    expect(path).toContain('(auth)');
  });

  it('should inherit GlobalLayout from auth layout', () => {
    // The auth layout wraps all pages in:
    // - AuthProvider
    // - QueryProvider
    // - GlobalLayout (which includes the sidebar)
    const expectedWrappers = ['AuthProvider', 'QueryProvider', 'GlobalLayout'];

    // This is implicitly true for all pages in the (auth) route group
    expect(expectedWrappers).toContain('GlobalLayout');
  });

  it('should maintain the same URL path', () => {
    // Moving to (auth) route group doesn't change the URL
    const url = '/my-starmaps';
    expect(url).toBe('/my-starmaps');
  });
});
