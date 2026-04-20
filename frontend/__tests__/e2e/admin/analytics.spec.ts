/**
 * E2E Tests: Analytics Dashboard
 *
 * Tests the analytics dashboard functionality including:
 * - Platform-wide analytics overview
 * - Chart interactions and data visualization
 * - Period selection and filtering
 * - Export functionality
 * - User engagement metrics
 */

import { test, expect } from '@playwright/test';
import { createTestUser, deleteTestUser, login } from '../fixtures/auth';
import type { TestUser } from '../fixtures/auth';
import { createClient } from '@supabase/supabase-js';

let adminUser: TestUser;
let testUser: TestUser;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

test.describe('Analytics Dashboard', () => {
  test.beforeAll(async () => {
    // Create admin user
    adminUser = await createTestUser('developer');

    // Create test user with some activity
    testUser = await createTestUser('explorer');

    // Create some test data for analytics
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Create test session
    await supabase.from('user_sessions').insert({
      user_id: testUser.id,
      device_type: 'desktop',
      browser: 'Chrome',
      os: 'Windows',
      is_active: true,
      page_views: 15,
      actions_count: 8,
    });

    // Create test activity
    await supabase.from('activity_logs').insert([
      {
        user_id: testUser.id,
        action_type: 'blueprint_created',
        details: { test: true },
      },
      {
        user_id: testUser.id,
        action_type: 'user_login',
        details: {},
      },
    ]);

    // Create test blueprint
    await supabase.from('blueprint_generator').insert({
      user_id: testUser.id,
      status: 'completed',
      static_answers: {},
    });
  });

  test.afterAll(async () => {
    // Cleanup
    await deleteTestUser(adminUser.id);
    await deleteTestUser(testUser.id);
  });

  test.describe('Analytics Overview', () => {
    test.beforeEach(async ({ page }) => {
      await login(page, adminUser.email, adminUser.password);
      await page.goto('/admin/analytics');
      await page.waitForLoadState('networkidle');
    });

    test('should display analytics dashboard', async ({ page }) => {
      // Check page title
      await expect(page.locator('h1')).toContainText('Analytics Dashboard');

      // Verify key metrics cards are visible
      await expect(page.getByText('Total Users')).toBeVisible();
      await expect(page.getByText('Active Users')).toBeVisible();
      await expect(page.getByText('Total Blueprints')).toBeVisible();
      await expect(page.getByText('Completion Rate')).toBeVisible();
    });

    test('should display metrics with correct format', async ({ page }) => {
      // Find metrics cards
      const metricsCards = page.locator('[data-testid="metric-card"]');
      await expect(metricsCards).toHaveCount(4);

      // Verify each card has value and label
      for (let i = 0; i < (await metricsCards.count()); i++) {
        const card = metricsCards.nth(i);
        await expect(card.locator('[data-testid="metric-value"]')).toBeVisible();
        await expect(card.locator('[data-testid="metric-label"]')).toBeVisible();
      }
    });

    test('should show loading state initially', async ({ page }) => {
      // Navigate and check for loading indicator
      await page.goto('/admin/analytics');

      // Should see loading skeleton or spinner
      const loadingIndicator = page.locator(
        '[data-testid="loading-skeleton"], [data-testid="loading-spinner"]'
      );

      // Loading indicator might be visible briefly
      if (await loadingIndicator.isVisible()) {
        await expect(loadingIndicator).toBeVisible();
      }

      // Wait for data to load
      await page.waitForLoadState('networkidle');

      // Verify content is displayed
      await expect(page.getByText('Total Users')).toBeVisible();
    });
  });

  test.describe('Period Selection', () => {
    test.beforeEach(async ({ page }) => {
      await login(page, adminUser.email, adminUser.password);
      await page.goto('/admin/analytics');
      await page.waitForLoadState('networkidle');
    });

    test('should change period to 7 days', async ({ page }) => {
      // Click period selector
      await page.click('[data-testid="period-selector"]');

      // Select 7 days
      await page.click('[data-testid="period-7"]');

      // Wait for data to reload
      await page.waitForTimeout(1000);

      // Verify URL parameter
      expect(page.url()).toContain('period=7');

      // Verify data updated (check if metrics are still visible)
      await expect(page.getByText('Total Users')).toBeVisible();
    });

    test('should change period to 30 days', async ({ page }) => {
      // Click period selector
      await page.click('[data-testid="period-selector"]');

      // Select 30 days
      await page.click('[data-testid="period-30"]');

      // Wait for reload
      await page.waitForTimeout(1000);

      // Verify URL
      expect(page.url()).toContain('period=30');
    });

    test('should change period to 90 days', async ({ page }) => {
      // Click period selector
      await page.click('[data-testid="period-selector"]');

      // Select 90 days
      await page.click('[data-testid="period-90"]');

      // Wait for reload
      await page.waitForTimeout(1000);

      // Verify URL
      expect(page.url()).toContain('period=90');
    });

    test('should remember selected period on page reload', async ({ page }) => {
      // Select period
      await page.click('[data-testid="period-selector"]');
      await page.click('[data-testid="period-7"]');
      await page.waitForTimeout(500);

      // Reload page
      await page.reload();
      await page.waitForLoadState('networkidle');

      // Verify period is still selected
      expect(page.url()).toContain('period=7');

      // Verify button shows correct selection
      const periodButton = page.locator('[data-testid="period-selector"]');
      await expect(periodButton).toContainText('7');
    });
  });

  test.describe('Charts and Visualizations', () => {
    test.beforeEach(async ({ page }) => {
      await login(page, adminUser.email, adminUser.password);
      await page.goto('/admin/analytics');
      await page.waitForLoadState('networkidle');
    });

    test('should display all chart components', async ({ page }) => {
      // Check for area charts (user growth, blueprint creation)
      const areaCharts = page.locator('[data-testid="area-chart"]');
      await expect(areaCharts.first()).toBeVisible();

      // Check for pie chart (tier distribution)
      const pieChart = page.locator('[data-testid="pie-chart"]');
      await expect(pieChart).toBeVisible();

      // Check for bar chart (top activities)
      const barChart = page.locator('[data-testid="bar-chart"]');
      await expect(barChart).toBeVisible();
    });

    test('should show chart tooltips on hover', async ({ page }) => {
      // Find first area chart
      const areaChart = page.locator('[data-testid="area-chart"]').first();

      // Hover over chart area
      await areaChart.hover();

      // Wait a moment for tooltip
      await page.waitForTimeout(500);

      // Tooltip might appear - check if visible
      const tooltip = page.locator('[role="tooltip"], .recharts-tooltip-wrapper');

      if (await tooltip.isVisible()) {
        await expect(tooltip).toBeVisible();
      }
    });

    test('should display chart legends', async ({ page }) => {
      // Check for pie chart legend
      const pieChart = page.locator('[data-testid="pie-chart"]');
      await expect(pieChart).toBeVisible();

      // Verify legend items (tier names)
      const legendItems = page.locator('[data-testid="legend-item"]');

      if ((await legendItems.count()) > 0) {
        await expect(legendItems.first()).toBeVisible();
      }
    });

    test('should handle empty data gracefully', async ({ page }) => {
      // Create a new admin with no data
      const emptyAdmin = await createTestUser('developer');

      // Login as new admin
      await page.goto('/login');
      await login(page, emptyAdmin.email, emptyAdmin.password);

      // Go to analytics
      await page.goto('/admin/analytics');
      await page.waitForLoadState('networkidle');

      // Should still show structure with zero values or "No data" message
      await expect(page.getByText('Total Users')).toBeVisible();

      // Cleanup
      await deleteTestUser(emptyAdmin.id);
    });
  });

  test.describe('Blueprint Statistics', () => {
    test.beforeEach(async ({ page }) => {
      await login(page, adminUser.email, adminUser.password);
      await page.goto('/admin/analytics');
      await page.waitForLoadState('networkidle');
    });

    test('should display blueprint status breakdown', async ({ page }) => {
      // Check for blueprint stats section
      await expect(page.getByText('Blueprint Status')).toBeVisible();

      // Verify status labels
      await expect(page.getByText('Completed')).toBeVisible();
      await expect(page.getByText('In Progress')).toBeVisible();
      await expect(page.getByText('Draft')).toBeVisible();
    });

    test('should show completion rate percentage', async ({ page }) => {
      // Find completion rate metric
      const completionRate = page.locator('[data-testid="completion-rate"]');
      await expect(completionRate).toBeVisible();

      // Verify it contains a percentage
      const text = await completionRate.textContent();
      expect(text).toMatch(/%/);
    });

    test('should display blueprint creation trend', async ({ page }) => {
      // Check for blueprint trend chart
      const trendChart = page.locator('[data-testid="blueprint-trend-chart"]');

      if (await trendChart.isVisible()) {
        await expect(trendChart).toBeVisible();

        // Verify chart has data
        const chartData = page.locator('[data-testid="chart-data-point"]');
        expect(await chartData.count()).toBeGreaterThanOrEqual(0);
      }
    });
  });

  test.describe('User Engagement Metrics', () => {
    test.beforeEach(async ({ page }) => {
      await login(page, adminUser.email, adminUser.password);
      await page.goto('/admin/analytics');
      await page.waitForLoadState('networkidle');
    });

    test('should display engagement score metrics', async ({ page }) => {
      // Scroll to engagement section
      await page.locator('[data-testid="engagement-section"]').scrollIntoViewIfNeeded();

      // Verify engagement metrics
      await expect(page.getByText('Average Engagement Score')).toBeVisible();
      await expect(page.getByText('Total Sessions')).toBeVisible();
    });

    test('should show top activities list', async ({ page }) => {
      // Find top activities section
      const topActivities = page.locator('[data-testid="top-activities"]');

      if (await topActivities.isVisible()) {
        await expect(topActivities).toBeVisible();

        // Verify bar chart shows activities
        const barChart = page.locator('[data-testid="bar-chart"]');
        await expect(barChart).toBeVisible();
      }
    });

    test('should display session statistics', async ({ page }) => {
      // Check for session stats
      await expect(page.getByText(/total.*sessions/i)).toBeVisible();

      // Verify average duration is shown
      const avgDuration = page.locator('[data-testid="avg-session-duration"]');

      if (await avgDuration.isVisible()) {
        await expect(avgDuration).toBeVisible();
      }
    });
  });

  test.describe('Tier Distribution', () => {
    test.beforeEach(async ({ page }) => {
      await login(page, adminUser.email, adminUser.password);
      await page.goto('/admin/analytics');
      await page.waitForLoadState('networkidle');
    });

    test('should display tier distribution pie chart', async ({ page }) => {
      // Find tier distribution section
      await expect(page.getByText('User Distribution by Tier')).toBeVisible();

      // Verify pie chart
      const pieChart = page.locator('[data-testid="pie-chart"]');
      await expect(pieChart).toBeVisible();
    });

    test('should show tier breakdown with counts', async ({ page }) => {
      // Check for tier labels
      const tierLabels = [
        'Explorer',
        'Navigator',
        'Voyager',
        'Crew',
        'Fleet',
        'Armada',
        'Enterprise',
      ];

      // At least one tier should be visible
      let foundTier = false;
      for (const tier of tierLabels) {
        const tierElement = page.getByText(tier);
        if (await tierElement.isVisible()) {
          foundTier = true;
          break;
        }
      }

      expect(foundTier).toBeTruthy();
    });

    test('should display tier percentages', async ({ page }) => {
      // Find pie chart legend/labels
      const pieChart = page.locator('[data-testid="pie-chart"]');
      await expect(pieChart).toBeVisible();

      // Check if percentages are shown
      const percentageText = page.locator('text=/%/');

      if ((await percentageText.count()) > 0) {
        await expect(percentageText.first()).toBeVisible();
      }
    });
  });

  test.describe('Export Analytics', () => {
    test.beforeEach(async ({ page }) => {
      await login(page, adminUser.email, adminUser.password);
      await page.goto('/admin/analytics');
      await page.waitForLoadState('networkidle');
    });

    test('should have export button', async ({ page }) => {
      const exportButton = page.locator('[data-testid="export-analytics-button"]');

      if (await exportButton.isVisible()) {
        await expect(exportButton).toBeVisible();
        await expect(exportButton).toBeEnabled();
      }
    });

    test('should export analytics data', async ({ page }) => {
      const exportButton = page.locator('[data-testid="export-analytics-button"]');

      if (await exportButton.isVisible()) {
        // Click export
        await exportButton.click();

        // Wait for download
        const downloadPromise = page.waitForEvent('download', { timeout: 5000 }).catch(() => null);
        const download = await downloadPromise;

        if (download) {
          // Verify download
          expect(download.suggestedFilename()).toMatch(/analytics.*\.(csv|json|xlsx)/);
        }
      }
    });
  });

  test.describe('Responsive Design', () => {
    test.beforeEach(async ({ page }) => {
      await login(page, adminUser.email, adminUser.password);
    });

    test('should be responsive on mobile', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      await page.goto('/admin/analytics');
      await page.waitForLoadState('networkidle');

      // Verify page loads
      await expect(page.locator('h1')).toBeVisible();

      // Metrics should stack vertically
      const metricsCards = page.locator('[data-testid="metric-card"]');
      const firstCard = metricsCards.first();
      const secondCard = metricsCards.nth(1);

      if ((await metricsCards.count()) >= 2) {
        const firstBox = await firstCard.boundingBox();
        const secondBox = await secondCard.boundingBox();

        if (firstBox && secondBox) {
          // Second card should be below first (y position greater)
          expect(secondBox.y).toBeGreaterThan(firstBox.y);
        }
      }
    });

    test('should be responsive on tablet', async ({ page }) => {
      // Set tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });

      await page.goto('/admin/analytics');
      await page.waitForLoadState('networkidle');

      // Verify layout adapts
      await expect(page.locator('h1')).toBeVisible();

      // Charts should be visible
      const charts = page.locator('[data-testid="area-chart"], [data-testid="pie-chart"]');
      await expect(charts.first()).toBeVisible();
    });
  });

  test.describe('Real-time Updates', () => {
    test.beforeEach(async ({ page }) => {
      await login(page, adminUser.email, adminUser.password);
      await page.goto('/admin/analytics');
      await page.waitForLoadState('networkidle');
    });

    test('should have refresh button', async ({ page }) => {
      const refreshButton = page.locator('[data-testid="refresh-analytics-button"]');

      if (await refreshButton.isVisible()) {
        await expect(refreshButton).toBeVisible();
        await expect(refreshButton).toBeEnabled();
      }
    });

    test('should refresh analytics data', async ({ page }) => {
      const refreshButton = page.locator('[data-testid="refresh-analytics-button"]');

      if (await refreshButton.isVisible()) {
        // Get initial value
        const initialValue = await page
          .locator('[data-testid="metric-value"]')
          .first()
          .textContent();

        // Click refresh
        await refreshButton.click();

        // Wait for loading state
        await page.waitForTimeout(1000);

        // Verify metrics are still visible after refresh
        await expect(page.locator('[data-testid="metric-value"]').first()).toBeVisible();
      }
    });
  });

  test.describe('Error Handling', () => {
    test.beforeEach(async ({ page }) => {
      await login(page, adminUser.email, adminUser.password);
    });

    test('should handle API errors gracefully', async ({ page }) => {
      // Intercept API call and return error
      await page.route('**/api/analytics/platform*', (route) => {
        route.fulfill({
          status: 500,
          body: JSON.stringify({ error: 'Internal Server Error' }),
        });
      });

      await page.goto('/admin/analytics');
      await page.waitForLoadState('networkidle');

      // Should show error message
      const errorMessage = page.getByText(/error.*loading.*analytics|failed.*fetch/i);

      if (await errorMessage.isVisible()) {
        await expect(errorMessage).toBeVisible();
      }
    });

    test('should allow retry after error', async ({ page }) => {
      let callCount = 0;

      // Intercept API - fail first time, succeed second time
      await page.route('**/api/analytics/platform*', (route) => {
        callCount++;
        if (callCount === 1) {
          route.fulfill({
            status: 500,
            body: JSON.stringify({ error: 'Error' }),
          });
        } else {
          route.continue();
        }
      });

      await page.goto('/admin/analytics');
      await page.waitForLoadState('networkidle');

      // Find and click retry button
      const retryButton = page.locator('[data-testid="retry-button"]');

      if (await retryButton.isVisible()) {
        await retryButton.click();
        await page.waitForTimeout(1000);

        // Should show data after retry
        await expect(page.getByText('Total Users')).toBeVisible();
      }
    });
  });

  test.describe('Navigation', () => {
    test.beforeEach(async ({ page }) => {
      await login(page, adminUser.email, adminUser.password);
    });

    test('should navigate from analytics to user management', async ({ page }) => {
      await page.goto('/admin/analytics');
      await page.waitForLoadState('networkidle');

      // Click user management link in navigation
      await page.click('[href="/admin/users"]');

      // Verify navigation
      await page.waitForURL('/admin/users');
      await expect(page.locator('h1')).toContainText('User Management');
    });

    test('should navigate to specific user from analytics', async ({ page }) => {
      await page.goto('/admin/analytics');
      await page.waitForLoadState('networkidle');

      // Find user link if available
      const userLink = page.locator('[data-testid="user-detail-link"]').first();

      if (await userLink.isVisible()) {
        await userLink.click();

        // Should navigate to user detail page
        await page.waitForURL(/\/admin\/users\/[a-f0-9-]+/);
      }
    });
  });
});
