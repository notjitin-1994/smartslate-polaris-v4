/**
 * Integration Tests: User Details API
 *
 * Tests for:
 * - GET /api/admin/users/[userId]/activity
 * - GET /api/admin/users/[userId]/blueprints
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// Skip integration tests if running with test credentials
const isRealCredentials =
  SUPABASE_URL &&
  SUPABASE_SERVICE_ROLE_KEY &&
  !SUPABASE_URL.includes('localhost') &&
  SUPABASE_SERVICE_ROLE_KEY !== 'test-service-role-key';

describe.skipIf(!isRealCredentials)('User Details API', () => {
  let supabase: ReturnType<typeof createClient>;
  let adminUserId: string;
  let adminAccessToken: string;
  let testUserId: string;

  beforeAll(async () => {
    supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Create admin user
    const { data: adminUser } = await supabase.auth.admin.createUser({
      email: `admin-details-${Date.now()}@test.com`,
      password: 'TestPassword123!',
      email_confirm: true,
    });

    adminUserId = adminUser.user!.id;

    await supabase
      .from('user_profiles')
      .update({ user_role: 'developer' })
      .eq('user_id', adminUserId);

    const { data: adminSession } = await supabase.auth.signInWithPassword({
      email: adminUser.user!.email!,
      password: 'TestPassword123!',
    });

    adminAccessToken = adminSession!.session!.access_token;

    // Create test user
    const { data: testUser } = await supabase.auth.admin.createUser({
      email: `test-details-${Date.now()}@test.com`,
      password: 'TestPassword123!',
      email_confirm: true,
    });

    testUserId = testUser.user!.id;

    // Create test activities
    await supabase.from('activity_logs').insert([
      {
        user_id: testUserId,
        action_type: 'blueprint_created',
        details: { blueprint_id: 'test-1' },
      },
      {
        user_id: testUserId,
        action_type: 'user_login',
        details: {},
      },
      {
        user_id: testUserId,
        action_type: 'data_export',
        details: { format: 'csv' },
      },
    ]);

    // Create test blueprints
    await supabase.from('blueprint_generator').insert([
      {
        user_id: testUserId,
        status: 'completed',
        static_answers: { learningGoal: 'Test Goal 1' },
      },
      {
        user_id: testUserId,
        status: 'draft',
        static_answers: { learningGoal: 'Test Goal 2' },
      },
      {
        user_id: testUserId,
        status: 'generating',
        static_answers: { learningGoal: 'Test Goal 3' },
      },
    ]);
  });

  afterAll(async () => {
    // Cleanup
    if (testUserId) {
      await supabase.auth.admin.deleteUser(testUserId);
    }
    if (adminUserId) {
      await supabase.auth.admin.deleteUser(adminUserId);
    }
  });

  describe('GET /api/admin/users/[userId]/activity', () => {
    it('should return user activities', async () => {
      const response = await fetch(`${BASE_URL}/api/admin/users/${testUserId}/activity`, {
        headers: {
          Authorization: `Bearer ${adminAccessToken}`,
        },
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('user');
      expect(data).toHaveProperty('activities');
      expect(data).toHaveProperty('pagination');
      expect(Array.isArray(data.activities)).toBe(true);
      expect(data.activities.length).toBeGreaterThanOrEqual(3);
    });

    it('should include user information', async () => {
      const response = await fetch(`${BASE_URL}/api/admin/users/${testUserId}/activity`, {
        headers: {
          Authorization: `Bearer ${adminAccessToken}`,
        },
      });

      const data = await response.json();
      expect(data.user).toHaveProperty('user_id');
      expect(data.user).toHaveProperty('email');
      expect(data.user).toHaveProperty('full_name');
      expect(data.user.user_id).toBe(testUserId);
    });

    it('should support pagination', async () => {
      const response = await fetch(
        `${BASE_URL}/api/admin/users/${testUserId}/activity?page=1&limit=2`,
        {
          headers: {
            Authorization: `Bearer ${adminAccessToken}`,
          },
        }
      );

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.pagination.page).toBe(1);
      expect(data.pagination.limit).toBe(2);
      expect(data.activities.length).toBeLessThanOrEqual(2);
    });

    it('should filter by action types', async () => {
      const response = await fetch(
        `${BASE_URL}/api/admin/users/${testUserId}/activity?actionTypes=blueprint_created,user_login`,
        {
          headers: {
            Authorization: `Bearer ${adminAccessToken}`,
          },
        }
      );

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(
        data.activities.every(
          (a: any) => a.action_type === 'blueprint_created' || a.action_type === 'user_login'
        )
      ).toBe(true);
    });

    it('should return 404 for non-existent user', async () => {
      const response = await fetch(
        `${BASE_URL}/api/admin/users/00000000-0000-0000-0000-000000000000/activity`,
        {
          headers: {
            Authorization: `Bearer ${adminAccessToken}`,
          },
        }
      );

      expect(response.status).toBe(404);
    });

    it('should require admin access', async () => {
      // Create regular user
      const { data: regularUser } = await supabase.auth.admin.createUser({
        email: `regular-${Date.now()}@test.com`,
        password: 'TestPassword123!',
        email_confirm: true,
      });

      const { data: regularSession } = await supabase.auth.signInWithPassword({
        email: regularUser.user!.email!,
        password: 'TestPassword123!',
      });

      const response = await fetch(`${BASE_URL}/api/admin/users/${testUserId}/activity`, {
        headers: {
          Authorization: `Bearer ${regularSession!.session!.access_token}`,
        },
      });

      expect(response.status).toBe(403);

      // Cleanup
      await supabase.auth.admin.deleteUser(regularUser.user!.id);
    });
  });

  describe('GET /api/admin/users/[userId]/blueprints', () => {
    it('should return user blueprints', async () => {
      const response = await fetch(`${BASE_URL}/api/admin/users/${testUserId}/blueprints`, {
        headers: {
          Authorization: `Bearer ${adminAccessToken}`,
        },
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('user');
      expect(data).toHaveProperty('blueprints');
      expect(data).toHaveProperty('stats');
      expect(data).toHaveProperty('pagination');
      expect(Array.isArray(data.blueprints)).toBe(true);
      expect(data.blueprints.length).toBeGreaterThanOrEqual(3);
    });

    it('should include blueprint statistics', async () => {
      const response = await fetch(`${BASE_URL}/api/admin/users/${testUserId}/blueprints`, {
        headers: {
          Authorization: `Bearer ${adminAccessToken}`,
        },
      });

      const data = await response.json();
      expect(data.stats).toHaveProperty('draft');
      expect(data.stats).toHaveProperty('generating');
      expect(data.stats).toHaveProperty('completed');
      expect(data.stats).toHaveProperty('error');
      expect(data.stats.completed).toBeGreaterThanOrEqual(1);
      expect(data.stats.draft).toBeGreaterThanOrEqual(1);
    });

    it('should support pagination', async () => {
      const response = await fetch(
        `${BASE_URL}/api/admin/users/${testUserId}/blueprints?page=1&limit=2`,
        {
          headers: {
            Authorization: `Bearer ${adminAccessToken}`,
          },
        }
      );

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.pagination.page).toBe(1);
      expect(data.pagination.limit).toBe(2);
      expect(data.blueprints.length).toBeLessThanOrEqual(2);
    });

    it('should filter by status', async () => {
      const response = await fetch(
        `${BASE_URL}/api/admin/users/${testUserId}/blueprints?status=completed`,
        {
          headers: {
            Authorization: `Bearer ${adminAccessToken}`,
          },
        }
      );

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.blueprints.every((b: any) => b.status === 'completed')).toBe(true);
    });

    it('should order by most recent first', async () => {
      const response = await fetch(`${BASE_URL}/api/admin/users/${testUserId}/blueprints`, {
        headers: {
          Authorization: `Bearer ${adminAccessToken}`,
        },
      });

      const data = await response.json();
      // Verify descending order by created_at
      for (let i = 1; i < data.blueprints.length; i++) {
        const prev = new Date(data.blueprints[i - 1].created_at);
        const curr = new Date(data.blueprints[i].created_at);
        expect(prev.getTime()).toBeGreaterThanOrEqual(curr.getTime());
      }
    });

    it('should return 404 for non-existent user', async () => {
      const response = await fetch(
        `${BASE_URL}/api/admin/users/00000000-0000-0000-0000-000000000000/blueprints`,
        {
          headers: {
            Authorization: `Bearer ${adminAccessToken}`,
          },
        }
      );

      expect(response.status).toBe(404);
    });

    it('should require admin access', async () => {
      const { data: regularUser } = await supabase.auth.admin.createUser({
        email: `regular-${Date.now()}@test.com`,
        password: 'TestPassword123!',
        email_confirm: true,
      });

      const { data: regularSession } = await supabase.auth.signInWithPassword({
        email: regularUser.user!.email!,
        password: 'TestPassword123!',
      });

      const response = await fetch(`${BASE_URL}/api/admin/users/${testUserId}/blueprints`, {
        headers: {
          Authorization: `Bearer ${regularSession!.session!.access_token}`,
        },
      });

      expect(response.status).toBe(403);

      await supabase.auth.admin.deleteUser(regularUser.user!.id);
    });
  });
});
