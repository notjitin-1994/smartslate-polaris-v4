/**
 * E2E Test Fixtures: Authentication Helpers
 */

import { Page, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export interface TestUser {
  id: string;
  email: string;
  password: string;
  role: 'developer' | 'explorer' | 'navigator' | 'voyager';
}

export interface AuthFixtures {
  adminUser: TestUser;
  regularUser: TestUser;
}

/**
 * Create a test user with specific role
 */
export async function createTestUser(role: TestUser['role'] = 'explorer'): Promise<TestUser> {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const email = `e2e-test-${role}-${Date.now()}@test.com`;
  const password = 'TestPassword123!';

  // Create user
  const { data: user, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error || !user.user) {
    throw new Error(`Failed to create test user: ${error?.message}`);
  }

  // Update role if not explorer (default)
  if (role !== 'explorer') {
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({ user_role: role })
      .eq('user_id', user.user.id);

    if (updateError) {
      throw new Error(`Failed to update user role: ${updateError.message}`);
    }
  }

  return {
    id: user.user.id,
    email,
    password,
    role,
  };
}

/**
 * Delete a test user
 */
export async function deleteTestUser(userId: string): Promise<void> {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const { error } = await supabase.auth.admin.deleteUser(userId);

  if (error) {
    console.error(`Failed to delete test user ${userId}:`, error);
  }
}

/**
 * Login to the application
 */
export async function login(page: Page, email: string, password: string): Promise<void> {
  await page.goto('/login');

  // Wait for page to load
  await page.waitForLoadState('networkidle');

  // Fill in credentials
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);

  // Click login button
  await page.click('button[type="submit"]');

  // Wait for navigation to complete
  await page.waitForURL(/\/(dashboard|admin)/);
}

/**
 * Logout from the application
 */
export async function logout(page: Page): Promise<void> {
  // Click user menu
  await page.click('[data-testid="user-menu"]');

  // Click logout
  await page.click('[data-testid="logout-button"]');

  // Wait for redirect to login
  await page.waitForURL('/login');
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  try {
    // Check for user menu presence
    const userMenu = await page.$('[data-testid="user-menu"]');
    return userMenu !== null;
  } catch {
    return false;
  }
}
