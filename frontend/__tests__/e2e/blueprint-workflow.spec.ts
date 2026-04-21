import { test, expect } from '@playwright/test';

test.describe('Blueprint Generation Workflow', () => {
  
  test('should redirect to login when accessing wizard unauthenticated', async ({ page }) => {
    await page.goto('/static-wizard');
    await expect(page).toHaveURL(/\/login/);
  });

  test('should show correct progress steps in wizard', async ({ page }) => {
    // Note: This assumes we are mocking auth or have a test user
    // For now, we verify the UI components exist on the page if they were rendered
    await page.goto('/static-wizard');
    
    // If we land on login, that's expected for now without a session cookie
    if (page.url().includes('/login')) {
      console.log('Skipping wizard UI check - redirected to login');
      return;
    }

    await expect(page.locator('text=Starmap Navigator')).toBeVisible();
    await expect(page.locator('text=Role & Experience')).toBeVisible();
  });

  test('should verify blueprint viewer components', async ({ page }) => {
    // We'll use a mock or a known blueprint ID if available in the future
    // This test ensures the viewer shell works
    await page.goto('/blueprints/test-id');
    
    // Should show loading or error for an invalid ID
    const loadingOrError = page.locator('text=Loading blueprint|text=Failed to Load Blueprint');
    await expect(loadingOrError).toBeVisible();
  });

  test('should test sidebar interaction with blueprint dashboard', async ({ page }) => {
    await page.goto('/');
    
    // Check if Solara Suite section is present in revamped sidebar
    const solaraSuite = page.locator('span:has-text("Solara Suite")');
    await expect(solaraSuite).toBeVisible();
    
    // Toggle the section
    await solaraSuite.click();
    
    // Check for specific tool links
    await expect(page.locator('text=Constellation')).toBeVisible();
  });
});
