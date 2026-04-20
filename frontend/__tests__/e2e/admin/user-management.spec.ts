/**
 * E2E Tests: Admin User Management
 *
 * Tests the complete user management workflow including:
 * - Viewing user list
 * - Filtering and searching users
 * - Creating new users
 * - Editing user details
 * - Viewing user activity and blueprints
 */

import { test, expect, Page } from '@playwright/test';
import { createTestUser, deleteTestUser, login } from '../fixtures/auth';
import type { TestUser } from '../fixtures/auth';

let adminUser: TestUser;
let testUser: TestUser;

test.describe('Admin User Management', () => {
  test.beforeAll(async () => {
    // Create admin user
    adminUser = await createTestUser('developer');

    // Create a test user to manage
    testUser = await createTestUser('explorer');
  });

  test.afterAll(async () => {
    // Cleanup
    await deleteTestUser(adminUser.id);
    await deleteTestUser(testUser.id);
  });

  test.describe('User List Page', () => {
    test.beforeEach(async ({ page }) => {
      await login(page, adminUser.email, adminUser.password);
      await page.goto('/admin/users');
      await page.waitForLoadState('networkidle');
    });

    test('should display user list with correct columns', async ({ page }) => {
      // Check page title
      await expect(page.locator('h1')).toContainText('User Management');

      // Check table headers
      await expect(page.locator('th').filter({ hasText: 'User' })).toBeVisible();
      await expect(page.locator('th').filter({ hasText: 'Email' })).toBeVisible();
      await expect(page.locator('th').filter({ hasText: 'Role' })).toBeVisible();
      await expect(page.locator('th').filter({ hasText: 'Tier' })).toBeVisible();
      await expect(page.locator('th').filter({ hasText: 'Status' })).toBeVisible();
      await expect(page.locator('th').filter({ hasText: 'Actions' })).toBeVisible();
    });

    test('should show user count and stats', async ({ page }) => {
      // Check stats cards are visible
      const statsCards = page.locator('[data-testid="stats-card"]');
      await expect(statsCards).toHaveCount(4);

      // Verify stat labels
      await expect(page.getByText('Total Users')).toBeVisible();
      await expect(page.getByText('Active Users')).toBeVisible();
      await expect(page.getByText('New This Month')).toBeVisible();
      await expect(page.getByText('Developers')).toBeVisible();
    });

    test('should filter users by role', async ({ page }) => {
      // Click role filter dropdown
      await page.click('[data-testid="role-filter"]');

      // Select 'explorer' role
      await page.click('[data-testid="role-option-explorer"]');

      // Wait for table to update
      await page.waitForTimeout(500);

      // Verify URL has filter parameter
      expect(page.url()).toContain('role=explorer');

      // Verify filtered results
      const roleBadges = page.locator('[data-testid="user-role-badge"]');
      const count = await roleBadges.count();

      for (let i = 0; i < count; i++) {
        await expect(roleBadges.nth(i)).toContainText('Explorer');
      }
    });

    test('should filter users by tier', async ({ page }) => {
      // Click tier filter dropdown
      await page.click('[data-testid="tier-filter"]');

      // Select 'explorer' tier
      await page.click('[data-testid="tier-option-explorer"]');

      // Wait for update
      await page.waitForTimeout(500);

      // Verify URL
      expect(page.url()).toContain('tier=explorer');
    });

    test('should search users by email', async ({ page }) => {
      // Type in search box
      await page.fill('[data-testid="search-input"]', testUser.email);

      // Wait for debounce
      await page.waitForTimeout(1000);

      // Verify URL has search parameter
      expect(page.url()).toContain(`search=${encodeURIComponent(testUser.email)}`);

      // Verify test user appears in results
      await expect(page.getByText(testUser.email)).toBeVisible();
    });

    test('should navigate through pages', async ({ page }) => {
      // Check if pagination exists (only if there are multiple pages)
      const pagination = page.locator('[data-testid="pagination"]');

      if (await pagination.isVisible()) {
        // Click next page
        await page.click('[data-testid="next-page"]');

        // Wait for update
        await page.waitForTimeout(500);

        // Verify page parameter in URL
        expect(page.url()).toContain('page=2');

        // Click previous page
        await page.click('[data-testid="prev-page"]');

        // Wait for update
        await page.waitForTimeout(500);

        // Should be back to page 1
        const url = page.url();
        expect(url.includes('page=1') || !url.includes('page=')).toBeTruthy();
      }
    });

    test('should open user actions menu', async ({ page }) => {
      // Find first user row
      const firstUserRow = page.locator('tbody tr').first();

      // Click actions button
      await firstUserRow.locator('[data-testid="user-actions"]').click();

      // Verify menu items
      await expect(page.getByText('View Details')).toBeVisible();
      await expect(page.getByText('Edit User')).toBeVisible();
      await expect(page.getByText('View Activity')).toBeVisible();
      await expect(page.getByText('View Blueprints')).toBeVisible();
      await expect(page.getByText('View Sessions')).toBeVisible();
    });

    test('should clear all filters', async ({ page }) => {
      // Apply multiple filters
      await page.click('[data-testid="role-filter"]');
      await page.click('[data-testid="role-option-explorer"]');
      await page.waitForTimeout(500);

      await page.fill('[data-testid="search-input"]', 'test');
      await page.waitForTimeout(1000);

      // Click clear filters button
      await page.click('[data-testid="clear-filters"]');

      // Wait for reset
      await page.waitForTimeout(500);

      // Verify URL has no filter parameters
      const url = page.url();
      expect(url).not.toContain('role=');
      expect(url).not.toContain('search=');
    });
  });

  test.describe('Add User Flow', () => {
    test.beforeEach(async ({ page }) => {
      await login(page, adminUser.email, adminUser.password);
      await page.goto('/admin/users');
      await page.waitForLoadState('networkidle');
    });

    test('should navigate to add user page', async ({ page }) => {
      // Click "Add User" button
      await page.click('[data-testid="add-user-button"]');

      // Verify navigation
      await page.waitForURL('/admin/users/new');

      // Verify page title
      await expect(page.locator('h1')).toContainText('Add New User');
    });

    test('should create a new user successfully', async ({ page }) => {
      const newUserEmail = `e2e-new-user-${Date.now()}@test.com`;

      await page.goto('/admin/users/new');
      await page.waitForLoadState('networkidle');

      // Fill in form
      await page.fill('[data-testid="email-input"]', newUserEmail);
      await page.fill('[data-testid="password-input"]', 'TestPassword123!');
      await page.fill('[data-testid="full-name-input"]', 'E2E Test User');

      // Select role
      await page.click('[data-testid="role-select"]');
      await page.click('[data-testid="role-option-explorer"]');

      // Select tier
      await page.click('[data-testid="tier-select"]');
      await page.click('[data-testid="tier-option-explorer"]');

      // Uncheck send email (for faster test)
      await page.uncheck('[data-testid="send-email-checkbox"]');

      // Submit form
      await page.click('[data-testid="create-user-button"]');

      // Wait for success toast
      await expect(page.getByText('User created successfully')).toBeVisible();

      // Verify redirect to user list
      await page.waitForURL('/admin/users');

      // Search for new user
      await page.fill('[data-testid="search-input"]', newUserEmail);
      await page.waitForTimeout(1000);

      // Verify user appears
      await expect(page.getByText(newUserEmail)).toBeVisible();

      // Cleanup: Delete the created user
      // Find and delete via Supabase admin client
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      const { data: users } = await supabase
        .from('user_profiles')
        .select('user_id')
        .eq('email', newUserEmail);

      if (users && users.length > 0) {
        await supabase.auth.admin.deleteUser(users[0].user_id);
      }
    });

    test('should show validation errors for invalid input', async ({ page }) => {
      await page.goto('/admin/users/new');
      await page.waitForLoadState('networkidle');

      // Try to submit empty form
      await page.click('[data-testid="create-user-button"]');

      // Verify validation errors
      await expect(page.getByText('Email is required')).toBeVisible();
      await expect(page.getByText('Password is required')).toBeVisible();
    });

    test('should validate email format', async ({ page }) => {
      await page.goto('/admin/users/new');
      await page.waitForLoadState('networkidle');

      // Enter invalid email
      await page.fill('[data-testid="email-input"]', 'invalid-email');
      await page.blur('[data-testid="email-input"]');

      // Verify error
      await expect(page.getByText('Invalid email format')).toBeVisible();
    });

    test('should validate password strength', async ({ page }) => {
      await page.goto('/admin/users/new');
      await page.waitForLoadState('networkidle');

      // Enter weak password
      await page.fill('[data-testid="password-input"]', 'weak');
      await page.blur('[data-testid="password-input"]');

      // Verify error
      await expect(page.getByText(/password must be at least/i)).toBeVisible();
    });

    test('should cancel user creation', async ({ page }) => {
      await page.goto('/admin/users/new');
      await page.waitForLoadState('networkidle');

      // Fill some data
      await page.fill('[data-testid="email-input"]', 'cancel-test@test.com');

      // Click cancel
      await page.click('[data-testid="cancel-button"]');

      // Verify redirect to user list
      await page.waitForURL('/admin/users');
    });
  });

  test.describe('Edit User Flow', () => {
    test.beforeEach(async ({ page }) => {
      await login(page, adminUser.email, adminUser.password);
      await page.goto('/admin/users');
      await page.waitForLoadState('networkidle');
    });

    test('should navigate to edit user page', async ({ page }) => {
      // Search for test user
      await page.fill('[data-testid="search-input"]', testUser.email);
      await page.waitForTimeout(1000);

      // Click actions menu
      const userRow = page.locator('tbody tr').first();
      await userRow.locator('[data-testid="user-actions"]').click();

      // Click edit
      await page.click('text=Edit User');

      // Verify navigation
      await page.waitForURL(new RegExp(`/admin/users/${testUser.id}/edit`));

      // Verify page title
      await expect(page.locator('h1')).toContainText('Edit User');
    });

    test('should update user full name', async ({ page }) => {
      await page.goto(`/admin/users/${testUser.id}/edit`);
      await page.waitForLoadState('networkidle');

      const newName = `Updated Name ${Date.now()}`;

      // Update full name
      await page.fill('[data-testid="full-name-input"]', newName);

      // Save changes
      await page.click('[data-testid="save-changes-button"]');

      // Wait for success toast
      await expect(page.getByText('User updated successfully')).toBeVisible();

      // Verify change persisted
      await page.reload();
      await page.waitForLoadState('networkidle');

      const nameInput = page.locator('[data-testid="full-name-input"]');
      await expect(nameInput).toHaveValue(newName);
    });

    test('should update user role', async ({ page }) => {
      await page.goto(`/admin/users/${testUser.id}/edit`);
      await page.waitForLoadState('networkidle');

      // Change role
      await page.click('[data-testid="role-select"]');
      await page.click('[data-testid="role-option-navigator"]');

      // Save changes
      await page.click('[data-testid="save-changes-button"]');

      // Wait for success
      await expect(page.getByText('User updated successfully')).toBeVisible();

      // Verify role badge updated
      await page.goto('/admin/users');
      await page.fill('[data-testid="search-input"]', testUser.email);
      await page.waitForTimeout(1000);

      await expect(page.locator('[data-testid="user-role-badge"]').first()).toContainText(
        'Navigator'
      );
    });

    test('should cancel edit without saving', async ({ page }) => {
      await page.goto(`/admin/users/${testUser.id}/edit`);
      await page.waitForLoadState('networkidle');

      const originalName = await page.locator('[data-testid="full-name-input"]').inputValue();

      // Make changes
      await page.fill('[data-testid="full-name-input"]', 'Should Not Save');

      // Click cancel
      await page.click('[data-testid="cancel-button"]');

      // Go back to edit
      await page.goto(`/admin/users/${testUser.id}/edit`);
      await page.waitForLoadState('networkidle');

      // Verify original value
      await expect(page.locator('[data-testid="full-name-input"]')).toHaveValue(originalName);
    });
  });

  test.describe('View User Details', () => {
    test.beforeEach(async ({ page }) => {
      await login(page, adminUser.email, adminUser.password);
      await page.goto('/admin/users');
      await page.waitForLoadState('networkidle');
    });

    test('should view user activity', async ({ page }) => {
      // Search for test user
      await page.fill('[data-testid="search-input"]', testUser.email);
      await page.waitForTimeout(1000);

      // Click actions menu
      const userRow = page.locator('tbody tr').first();
      await userRow.locator('[data-testid="user-actions"]').click();

      // Click view activity
      await page.click('text=View Activity');

      // Verify navigation
      await page.waitForURL(new RegExp(`/admin/users/${testUser.id}/activity`));

      // Verify page elements
      await expect(page.locator('h1')).toContainText('Activity Log');
      await expect(page.getByText(testUser.email)).toBeVisible();
    });

    test('should view user blueprints', async ({ page }) => {
      // Search for test user
      await page.fill('[data-testid="search-input"]', testUser.email);
      await page.waitForTimeout(1000);

      // Click actions menu
      const userRow = page.locator('tbody tr').first();
      await userRow.locator('[data-testid="user-actions"]').click();

      // Click view blueprints
      await page.click('text=View Blueprints');

      // Verify navigation
      await page.waitForURL(new RegExp(`/admin/users/${testUser.id}/blueprints`));

      // Verify page elements
      await expect(page.locator('h1')).toContainText('Blueprints');
      await expect(page.getByText(testUser.email)).toBeVisible();

      // Verify stats cards
      await expect(page.getByText('Total Blueprints')).toBeVisible();
      await expect(page.getByText('Completed')).toBeVisible();
      await expect(page.getByText('In Progress')).toBeVisible();
    });

    test('should view user sessions', async ({ page }) => {
      // Search for test user
      await page.fill('[data-testid="search-input"]', testUser.email);
      await page.waitForTimeout(1000);

      // Click actions menu
      const userRow = page.locator('tbody tr').first();
      await userRow.locator('[data-testid="user-actions"]').click();

      // Click view sessions
      await page.click('text=View Sessions');

      // Verify navigation
      await page.waitForURL(new RegExp(`/admin/users/${testUser.id}/sessions`));

      // Verify page elements
      await expect(page.locator('h1')).toContainText('Sessions');
      await expect(page.getByText(testUser.email)).toBeVisible();

      // Verify stats cards
      await expect(page.getByText('Total Sessions')).toBeVisible();
      await expect(page.getByText('Active Sessions')).toBeVisible();
    });
  });

  test.describe('Export Functionality', () => {
    test.beforeEach(async ({ page }) => {
      await login(page, adminUser.email, adminUser.password);
      await page.goto('/admin/users');
      await page.waitForLoadState('networkidle');
    });

    test('should open export dialog', async ({ page }) => {
      // Click export button
      await page.click('[data-testid="export-button"]');

      // Verify dialog opened
      await expect(page.getByText('Export Users')).toBeVisible();
      await expect(page.getByText('Select Format')).toBeVisible();
    });

    test('should export users as CSV', async ({ page }) => {
      // Click export button
      await page.click('[data-testid="export-button"]');

      // Select CSV format
      await page.click('[data-testid="format-csv"]');

      // Start download
      const downloadPromise = page.waitForEvent('download');
      await page.click('[data-testid="export-confirm-button"]');

      // Wait for download
      const download = await downloadPromise;

      // Verify filename
      expect(download.suggestedFilename()).toContain('.csv');
    });

    test('should export users as JSON', async ({ page }) => {
      // Click export button
      await page.click('[data-testid="export-button"]');

      // Select JSON format
      await page.click('[data-testid="format-json"]');

      // Start download
      const downloadPromise = page.waitForEvent('download');
      await page.click('[data-testid="export-confirm-button"]');

      // Wait for download
      const download = await downloadPromise;

      // Verify filename
      expect(download.suggestedFilename()).toContain('.json');
    });

    test('should export with current filters applied', async ({ page }) => {
      // Apply filter
      await page.click('[data-testid="role-filter"]');
      await page.click('[data-testid="role-option-explorer"]');
      await page.waitForTimeout(500);

      // Open export dialog
      await page.click('[data-testid="export-button"]');

      // Verify filter notice
      await expect(page.getByText(/current filters will be applied/i)).toBeVisible();

      // Select format
      await page.click('[data-testid="format-csv"]');

      // Export
      const downloadPromise = page.waitForEvent('download');
      await page.click('[data-testid="export-confirm-button"]');

      await downloadPromise;
    });

    test('should cancel export', async ({ page }) => {
      // Open export dialog
      await page.click('[data-testid="export-button"]');

      // Click cancel
      await page.click('[data-testid="export-cancel-button"]');

      // Verify dialog closed
      await expect(page.getByText('Export Users')).not.toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test.beforeEach(async ({ page }) => {
      await login(page, adminUser.email, adminUser.password);
    });

    test('should be keyboard navigable', async ({ page }) => {
      await page.goto('/admin/users');
      await page.waitForLoadState('networkidle');

      // Tab through interactive elements
      await page.keyboard.press('Tab'); // Search input
      await page.keyboard.press('Tab'); // Role filter
      await page.keyboard.press('Tab'); // Tier filter
      await page.keyboard.press('Tab'); // Add user button

      // Verify focus is visible
      const focusedElement = await page.locator(':focus');
      await expect(focusedElement).toBeVisible();
    });

    test('should have proper ARIA labels', async ({ page }) => {
      await page.goto('/admin/users');
      await page.waitForLoadState('networkidle');

      // Check for ARIA labels on interactive elements
      await expect(page.locator('[aria-label="Search users"]')).toBeVisible();
      await expect(page.locator('[aria-label="Filter by role"]')).toBeVisible();
      await expect(page.locator('[aria-label="Filter by tier"]')).toBeVisible();
    });

    test('should have proper heading hierarchy', async ({ page }) => {
      await page.goto('/admin/users');
      await page.waitForLoadState('networkidle');

      // Check h1 exists
      const h1 = page.locator('h1');
      await expect(h1).toHaveCount(1);
      await expect(h1).toContainText('User Management');

      // Check for proper heading structure
      const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
      expect(headings.length).toBeGreaterThan(0);
    });
  });
});
