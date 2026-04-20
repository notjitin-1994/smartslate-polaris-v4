/**
 * Integration Tests: Analytics API
 *
 * Tests for:
 * - GET /api/analytics/user/[userId]
 * - GET /api/analytics/platform
 * - GET /api/analytics/engagement
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

describe.skipIf(!isRealCredentials)('Analytics API', () => {
  let supabase: ReturnType<typeof createClient>;
  let adminUserId: string;
  let adminAccessToken: string;
  let testUserId: string;
  let testAccessToken: string;

  beforeAll(async () => {
    supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Create admin user
    const { data: adminUser } = await supabase.auth.admin.createUser({
      email: `admin-analytics-${Date.now()}@test.com`,
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
      email: `test-analytics-${Date.now()}@test.com`,
      password: 'TestPassword123!',
      email_confirm: true,
    });

    testUserId = testUser.user!.id;

    const { data: testSession } = await supabase.auth.signInWithPassword({
      email: testUser.user!.email!,
      password: 'TestPassword123!',
    });

    testAccessToken = testSession!.session!.access_token;

    // Create some test data (session)
    await supabase.from('user_sessions').insert({
      user_id: testUserId,
      device_type: 'desktop',
      browser: 'Chrome',
      os: 'Windows',
      is_active: true,
      page_views: 10,
      actions_count: 5,
    });

    // Create test activity
    await supabase.from('activity_logs').insert({
      user_id: testUserId,
      action_type: 'blueprint_created',
      details: { test: true },
    });

    // Create test blueprint
    await supabase.from('blueprint_generator').insert({
      user_id: testUserId,
      status: 'completed',
      static_answers: {},
    });
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

  describe('GET /api/analytics/user/[userId]', () => {
    it('should return user analytics for own user', async () => {
      const response = await fetch(`${BASE_URL}/api/analytics/user/${testUserId}`, {
        headers: {
          Authorization: `Bearer ${testAccessToken}`,
        },
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('user_id');
      expect(data).toHaveProperty('date_range');
      expect(data).toHaveProperty('blueprints');
      expect(data).toHaveProperty('activities');
      expect(data).toHaveProperty('sessions');
      expect(data.user_id).toBe(testUserId);
    });

    it('should allow admin to view any user analytics', async () => {
      const response = await fetch(`${BASE_URL}/api/analytics/user/${testUserId}`, {
        headers: {
          Authorization: `Bearer ${adminAccessToken}`,
        },
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.user_id).toBe(testUserId);
    });

    it('should reject viewing other users analytics', async () => {
      const response = await fetch(`${BASE_URL}/api/analytics/user/${adminUserId}`, {
        headers: {
          Authorization: `Bearer ${testAccessToken}`,
        },
      });

      expect(response.status).toBe(403);
    });

    it('should accept custom date range', async () => {
      const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const endDate = new Date().toISOString();

      const response = await fetch(
        `${BASE_URL}/api/analytics/user/${testUserId}?start_date=${startDate}&end_date=${endDate}`,
        {
          headers: {
            Authorization: `Bearer ${testAccessToken}`,
          },
        }
      );

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.date_range.start).toBe(startDate);
      expect(data.date_range.end).toBe(endDate);
    });

    it('should return correct blueprint counts', async () => {
      const response = await fetch(`${BASE_URL}/api/analytics/user/${testUserId}`, {
        headers: {
          Authorization: `Bearer ${testAccessToken}`,
        },
      });

      const data = await response.json();
      expect(data.blueprints).toHaveProperty('total');
      expect(data.blueprints).toHaveProperty('completed');
      expect(data.blueprints).toHaveProperty('draft');
      expect(data.blueprints.total).toBeGreaterThanOrEqual(1);
    });

    it('should return session statistics', async () => {
      const response = await fetch(`${BASE_URL}/api/analytics/user/${testUserId}`, {
        headers: {
          Authorization: `Bearer ${testAccessToken}`,
        },
      });

      const data = await response.json();
      expect(data.sessions).toHaveProperty('total');
      expect(data.sessions).toHaveProperty('total_duration');
      expect(data.sessions).toHaveProperty('avg_duration');
      expect(data.sessions).toHaveProperty('total_page_views');
    });
  });

  describe('GET /api/analytics/platform', () => {
    it('should return platform analytics for admin', async () => {
      const response = await fetch(`${BASE_URL}/api/analytics/platform`, {
        headers: {
          Authorization: `Bearer ${adminAccessToken}`,
        },
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('date_range');
      expect(data).toHaveProperty('users');
      expect(data).toHaveProperty('blueprints');
      expect(data).toHaveProperty('sessions');
      expect(data).toHaveProperty('activities');
    });

    it('should reject non-admin requests', async () => {
      const response = await fetch(`${BASE_URL}/api/analytics/platform`, {
        headers: {
          Authorization: `Bearer ${testAccessToken}`,
        },
      });

      expect(response.status).toBe(403);
    });

    it('should include user count by tier', async () => {
      const response = await fetch(`${BASE_URL}/api/analytics/platform`, {
        headers: {
          Authorization: `Bearer ${adminAccessToken}`,
        },
      });

      const data = await response.json();
      expect(data.users).toHaveProperty('total');
      expect(data.users).toHaveProperty('active');
      expect(data.users).toHaveProperty('by_tier');
      expect(typeof data.users.by_tier).toBe('object');
    });

    it('should include blueprint statistics', async () => {
      const response = await fetch(`${BASE_URL}/api/analytics/platform`, {
        headers: {
          Authorization: `Bearer ${adminAccessToken}`,
        },
      });

      const data = await response.json();
      expect(data.blueprints).toHaveProperty('total');
      expect(data.blueprints).toHaveProperty('completed');
      expect(data.blueprints).toHaveProperty('completion_rate');
    });

    it('should include top activities', async () => {
      const response = await fetch(`${BASE_URL}/api/analytics/platform`, {
        headers: {
          Authorization: `Bearer ${adminAccessToken}`,
        },
      });

      const data = await response.json();
      expect(data.activities).toHaveProperty('total');
      expect(data.activities).toHaveProperty('top_actions');
      expect(Array.isArray(data.activities.top_actions)).toBe(true);
    });

    it('should accept custom date range', async () => {
      const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const endDate = new Date().toISOString();

      const response = await fetch(
        `${BASE_URL}/api/analytics/platform?start_date=${startDate}&end_date=${endDate}`,
        {
          headers: {
            Authorization: `Bearer ${adminAccessToken}`,
          },
        }
      );

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.date_range.start).toBe(startDate);
      expect(data.date_range.end).toBe(endDate);
    });
  });

  describe('GET /api/analytics/engagement', () => {
    it('should return engagement metrics for admin', async () => {
      const response = await fetch(`${BASE_URL}/api/analytics/engagement`, {
        headers: {
          Authorization: `Bearer ${adminAccessToken}`,
        },
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('metrics');
      expect(data).toHaveProperty('aggregates');
      expect(data).toHaveProperty('pagination');
      expect(Array.isArray(data.metrics)).toBe(true);
    });

    it('should reject non-admin requests', async () => {
      const response = await fetch(`${BASE_URL}/api/analytics/engagement`, {
        headers: {
          Authorization: `Bearer ${testAccessToken}`,
        },
      });

      expect(response.status).toBe(403);
    });

    it('should support pagination', async () => {
      const response = await fetch(`${BASE_URL}/api/analytics/engagement?page=1&limit=10`, {
        headers: {
          Authorization: `Bearer ${adminAccessToken}`,
        },
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.pagination.page).toBe(1);
      expect(data.pagination.limit).toBe(10);
    });

    it('should filter by tier', async () => {
      const response = await fetch(`${BASE_URL}/api/analytics/engagement?tier=explorer`, {
        headers: {
          Authorization: `Bearer ${adminAccessToken}`,
        },
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.metrics.every((m: any) => m.subscription_tier === 'explorer')).toBe(true);
    });

    it('should filter by minimum engagement score', async () => {
      const response = await fetch(`${BASE_URL}/api/analytics/engagement?min_score=10`, {
        headers: {
          Authorization: `Bearer ${adminAccessToken}`,
        },
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.metrics.every((m: any) => m.engagement_score >= 10)).toBe(true);
    });

    it('should support sorting', async () => {
      const response = await fetch(
        `${BASE_URL}/api/analytics/engagement?sort_by=engagement_score&sort_order=desc`,
        {
          headers: {
            Authorization: `Bearer ${adminAccessToken}`,
          },
        }
      );

      expect(response.status).toBe(200);

      const data = await response.json();
      // Verify descending order
      for (let i = 1; i < data.metrics.length; i++) {
        expect(data.metrics[i - 1].engagement_score).toBeGreaterThanOrEqual(
          data.metrics[i].engagement_score
        );
      }
    });

    it('should include aggregate statistics', async () => {
      const response = await fetch(`${BASE_URL}/api/analytics/engagement`, {
        headers: {
          Authorization: `Bearer ${adminAccessToken}`,
        },
      });

      const data = await response.json();
      expect(data.aggregates).toHaveProperty('avg_engagement_score');
      expect(data.aggregates).toHaveProperty('total_blueprints');
      expect(data.aggregates).toHaveProperty('total_completed');
      expect(data.aggregates).toHaveProperty('total_sessions');
    });
  });
});
