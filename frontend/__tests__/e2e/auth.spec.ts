import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should show validation errors for empty login form', async ({ page }) => {
    await page.goto('/login');
    
    // Attempt to submit without filling fields
    await page.click('button[type="submit"]');
    
    // Check for error message (from detect function in AuthInput)
    await expect(page.locator('text=Please enter a valid email address')).toBeVisible();
  });

  test('should show validation errors for invalid email', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('#email-input', 'invalid-email');
    await page.click('button[type="submit"]');
    
    await expect(page.locator('text=Please enter a valid email address')).toBeVisible();
  });

  test('should navigate to signup page from login', async ({ page }) => {
    await page.goto('/login');
    await page.click('text=Create free account');
    await expect(page).toHaveURL(/\/signup/);
    await expect(page.locator('h1')).toContainText('Create Your Account');
  });

  test('should show validation errors for empty signup form', async ({ page }) => {
    await page.goto('/signup');
    await page.click('button[type="submit"]');
    
    await expect(page.locator('text=Please enter a valid email address')).toBeVisible();
  });

  test('should show password mismatch error on signup', async ({ page }) => {
    await page.goto('/signup');
    
    await page.fill('#firstName', 'Test');
    await page.fill('#lastName', 'User');
    await page.fill('#email-input', 'test@example.com');
    await page.fill('input[name="new-password"]', 'Password123!');
    await page.fill('input[name="confirm-password"]', 'Different123!');
    
    await page.click('button[type="submit"]');
    
    await expect(page.locator('text=Passwords do not match')).toBeVisible();
  });
});
