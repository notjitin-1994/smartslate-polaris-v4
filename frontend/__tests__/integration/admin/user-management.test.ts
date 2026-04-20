/**
 * Integration Tests: Admin User Management API
 *
 * Tests for:
 * - GET /api/admin/users
 * - POST /api/admin/users
 * - PATCH /api/admin/users/[userId]
 * - DELETE /api/admin/users/[userId]
 * - POST /api/admin/users/export
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

// Test configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// Skip integration tests if running with test credentials
const isRealCredentials =
  SUPABASE_URL &&
  SUPABASE_SERVICE_ROLE_KEY &&
  !SUPABASE_URL.includes('localhost') &&
  SUPABASE_SERVICE_ROLE_KEY !== 'test-service-role-key';

describe.skipIf(!isRealCredentials)('Admin User Management API', () => {
  let supabase: ReturnType<typeof createClient>;
  let adminUserId: string;
  let adminAccessToken: string;
  let testUserId: string;

  beforeAll(async () => {
    // Initialize Supabase admin client
    supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Create admin user for testing
    const { data: adminUser, error: adminError } = await supabase.auth.admin.createUser({
      email: `admin-test-${Date.now()}@test.com`,
      password: 'TestPassword123!',
      email_confirm: true,
    });

    if (adminError || !adminUser.user) {
      throw new Error('Failed to create admin user for testing');
    }

    adminUserId = adminUser.user.id;

    // Set user as developer (admin role)
    await supabase
      .from('user_profiles')
      .update({ user_role: 'developer' })
      .eq('user_id', adminUserId);

    // Sign in to get access token
    const { data: session, error: sessionError } = await supabase.auth.signInWithPassword({
      email: adminUser.user.email!,
      password: 'TestPassword123!',
    });

    if (sessionError || !session.session) {
      throw new Error('Failed to sign in admin user');
    }

    adminAccessToken = session.session.access_token;
  });

  afterAll(async () => {
    // Cleanup: Delete test users
    if (testUserId) {
      await supabase.auth.admin.deleteUser(testUserId);
    }
    if (adminUserId) {
      await supabase.auth.admin.deleteUser(adminUserId);
    }
  });

  describe('GET /api/admin/users', () => {
    it('should return list of users for admin', async () => {
      const response = await fetch(`${BASE_URL}/api/admin/users?page=1&limit=10`, {
        headers: {
          Authorization: `Bearer ${adminAccessToken}`,
        },
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('users');
      expect(data).toHaveProperty('pagination');
      expect(Array.isArray(data.users)).toBe(true);
      expect(data.pagination).toHaveProperty('total');
    });

    it('should filter users by role', async () => {
      const response = await fetch(`${BASE_URL}/api/admin/users?role=developer`, {
        headers: {
          Authorization: `Bearer ${adminAccessToken}`,
        },
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.users.every((u: any) => u.user_role === 'developer')).toBe(true);
    });

    it('should filter users by tier', async () => {
      const response = await fetch(`${BASE_URL}/api/admin/users?tier=explorer`, {
        headers: {
          Authorization: `Bearer ${adminAccessToken}`,
        },
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.users.every((u: any) => u.subscription_tier === 'explorer')).toBe(true);
    });

    it('should search users by email or name', async () => {
      const response = await fetch(`${BASE_URL}/api/admin/users?search=test`, {
        headers: {
          Authorization: `Bearer ${adminAccessToken}`,
        },
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('users');
    });

    it('should reject unauthorized requests', async () => {
      const response = await fetch(`${BASE_URL}/api/admin/users`);

      expect(response.status).toBe(401);
    });

    it('should reject non-admin requests', async () => {
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

      const response = await fetch(`${BASE_URL}/api/admin/users`, {
        headers: {
          Authorization: `Bearer ${regularSession!.session!.access_token}`,
        },
      });

      expect(response.status).toBe(403);

      // Cleanup
      await supabase.auth.admin.deleteUser(regularUser.user!.id);
    });
  });

  describe('POST /api/admin/users', () => {
    it('should create a new user', async () => {
      const response = await fetch(`${BASE_URL}/api/admin/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminAccessToken}`,
        },
        body: JSON.stringify({
          email: `newuser-${Date.now()}@test.com`,
          password: 'TestPassword123!',
          full_name: 'Test User',
          user_role: 'explorer',
          subscription_tier: 'explorer',
          send_email: false,
        }),
      });

      expect(response.status).toBe(201);

      const data = await response.json();
      expect(data).toHaveProperty('user');
      expect(data.user).toHaveProperty('id');
      expect(data.user.email).toContain('newuser-');

      testUserId = data.user.id;
    });

    it('should validate required fields', async () => {
      const response = await fetch(`${BASE_URL}/api/admin/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminAccessToken}`,
        },
        body: JSON.stringify({
          // Missing email and password
          full_name: 'Test User',
        }),
      });

      expect(response.status).toBe(400);
    });

    it('should reject duplicate emails', async () => {
      const email = `duplicate-${Date.now()}@test.com`;

      // Create first user
      const response1 = await fetch(`${BASE_URL}/api/admin/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminAccessToken}`,
        },
        body: JSON.stringify({
          email,
          password: 'TestPassword123!',
          full_name: 'First User',
          user_role: 'explorer',
          subscription_tier: 'explorer',
          send_email: false,
        }),
      });

      expect(response1.status).toBe(201);
      const data1 = await response1.json();

      // Try to create duplicate
      const response2 = await fetch(`${BASE_URL}/api/admin/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminAccessToken}`,
        },
        body: JSON.stringify({
          email,
          password: 'TestPassword123!',
          full_name: 'Duplicate User',
          user_role: 'explorer',
          subscription_tier: 'explorer',
          send_email: false,
        }),
      });

      expect(response2.status).toBe(400);

      // Cleanup
      await supabase.auth.admin.deleteUser(data1.user.id);
    });
  });

  describe('PATCH /api/admin/users/[userId]', () => {
    it('should update user role', async () => {
      if (!testUserId) {
        // Create test user if not exists
        const createResponse = await fetch(`${BASE_URL}/api/admin/users`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${adminAccessToken}`,
          },
          body: JSON.stringify({
            email: `updatetest-${Date.now()}@test.com`,
            password: 'TestPassword123!',
            full_name: 'Update Test',
            user_role: 'explorer',
            subscription_tier: 'explorer',
            send_email: false,
          }),
        });
        const createData = await createResponse.json();
        testUserId = createData.user.id;
      }

      const response = await fetch(`${BASE_URL}/api/admin/users/${testUserId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminAccessToken}`,
        },
        body: JSON.stringify({
          user_role: 'navigator',
        }),
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.user.user_role).toBe('navigator');
    });

    it('should update subscription tier', async () => {
      const response = await fetch(`${BASE_URL}/api/admin/users/${testUserId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminAccessToken}`,
        },
        body: JSON.stringify({
          subscription_tier: 'voyager',
        }),
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.user.subscription_tier).toBe('voyager');
    });

    it('should return 404 for non-existent user', async () => {
      const response = await fetch(
        `${BASE_URL}/api/admin/users/00000000-0000-0000-0000-000000000000`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${adminAccessToken}`,
          },
          body: JSON.stringify({
            user_role: 'navigator',
          }),
        }
      );

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/admin/users/export', () => {
    it('should export users as CSV', async () => {
      const response = await fetch(`${BASE_URL}/api/admin/users/export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminAccessToken}`,
        },
        body: JSON.stringify({
          format: 'csv',
          filters: {},
          sortBy: 'created_at',
          sortOrder: 'desc',
        }),
      });

      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toContain('text/csv');
    });

    it('should export users as JSON', async () => {
      const response = await fetch(`${BASE_URL}/api/admin/users/export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminAccessToken}`,
        },
        body: JSON.stringify({
          format: 'json',
          filters: {},
          sortBy: 'created_at',
          sortOrder: 'desc',
        }),
      });

      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toContain('application/json');
    });

    it('should apply filters to export', async () => {
      const response = await fetch(`${BASE_URL}/api/admin/users/export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminAccessToken}`,
        },
        body: JSON.stringify({
          format: 'json',
          filters: {
            role: 'developer',
          },
          sortBy: 'created_at',
          sortOrder: 'desc',
        }),
      });

      expect(response.status).toBe(200);
    });
  });
});
