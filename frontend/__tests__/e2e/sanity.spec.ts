import { test, expect } from '@playwright/test';

test.describe('Sanity Tests', () => {
  test('should load the dashboard/landing page', async ({ page }) => {
    await page.goto('/');
    // Check for core brand presence
    await expect(page.locator('text=Smartslate')).toBeVisible();
  });

  test('should show correct sidebar headers in revamped sidebar', async ({ page }) => {
    await page.goto('/');
    // The sidebar labels were revamped to "Quick Access" and "Solara Suite"
    // They are now spans with !text-[10px] class
    const quickAccess = page.locator('span:has-text("Quick Access")');
    const solaraSuite = page.locator('span:has-text("Solara Suite")');
    
    await expect(quickAccess).toBeVisible();
    await expect(solaraSuite).toBeVisible();
  });
});
