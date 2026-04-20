/**
 * Integration Tests: Session Tracking API
 *
 * Tests for:
 * - GET /api/sessions
 * - POST /api/sessions
 * - DELETE /api/sessions
 * - PATCH /api/sessions/[sessionId]
 * - DELETE /api/sessions/[sessionId]
 * - GET /api/admin/users/[userId]/sessions
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

describe.skipIf(!isRealCredentials)('Session Tracking API', () => {
  let supabase: ReturnType<typeof createClient>;
  let testUserId: string;
  let testAccessToken: string;
  let sessionId: string;

  beforeAll(async () => {
    supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Create test user
    const { data: user, error } = await supabase.auth.admin.createUser({
      email: `session-test-${Date.now()}@test.com`,
      password: 'TestPassword123!',
      email_confirm: true,
    });

    if (error || !user.user) {
      throw new Error('Failed to create test user');
    }

    testUserId = user.user.id;

    // Sign in to get access token
    const { data: session, error: sessionError } = await supabase.auth.signInWithPassword({
      email: user.user.email!,
      password: 'TestPassword123!',
    });

    if (sessionError || !session.session) {
      throw new Error('Failed to sign in test user');
    }

    testAccessToken = session.session.access_token;
  });

  afterAll(async () => {
    // Cleanup
    if (testUserId) {
      await supabase.auth.admin.deleteUser(testUserId);
    }
  });

  describe('POST /api/sessions', () => {
    it('should create a new session', async () => {
      const response = await fetch(`${BASE_URL}/api/sessions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${testAccessToken}`,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
        },
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('session');
      expect(data.session).toHaveProperty('id');
      expect(data.session.user_id).toBe(testUserId);
      expect(data.session.is_active).toBe(true);

      sessionId = data.session.id;
    });

    it('should return existing active session if one exists', async () => {
      const response = await fetch(`${BASE_URL}/api/sessions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${testAccessToken}`,
        },
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.session.id).toBe(sessionId);
      expect(data.message).toContain('Active session already exists');
    });

    it('should parse user agent correctly', async () => {
      const response = await fetch(`${BASE_URL}/api/sessions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${testAccessToken}`,
          'User-Agent':
            'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15',
        },
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.session.device_type).toBe('mobile');
    });

    it('should require authentication', async () => {
      const response = await fetch(`${BASE_URL}/api/sessions`, {
        method: 'POST',
      });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/sessions', () => {
    it('should return user sessions', async () => {
      const response = await fetch(`${BASE_URL}/api/sessions`, {
        headers: {
          Authorization: `Bearer ${testAccessToken}`,
        },
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('sessions');
      expect(Array.isArray(data.sessions)).toBe(true);
      expect(data.sessions.length).toBeGreaterThan(0);
    });

    it('should filter by active status', async () => {
      const response = await fetch(`${BASE_URL}/api/sessions?is_active=true`, {
        headers: {
          Authorization: `Bearer ${testAccessToken}`,
        },
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.sessions.every((s: any) => s.is_active === true)).toBe(true);
    });
  });

  describe('PATCH /api/sessions/[sessionId]', () => {
    it('should update session activity', async () => {
      const response = await fetch(`${BASE_URL}/api/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${testAccessToken}`,
        },
        body: JSON.stringify({
          page_view: true,
          action: true,
        }),
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.message).toContain('updated successfully');
    });

    it('should track blueprint creation', async () => {
      const response = await fetch(`${BASE_URL}/api/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${testAccessToken}`,
        },
        body: JSON.stringify({
          blueprint_created: true,
        }),
      });

      expect(response.status).toBe(200);
    });

    it('should prevent updating other users sessions', async () => {
      // Create another user
      const { data: otherUser } = await supabase.auth.admin.createUser({
        email: `other-${Date.now()}@test.com`,
        password: 'TestPassword123!',
        email_confirm: true,
      });

      const { data: otherSession } = await supabase.auth.signInWithPassword({
        email: otherUser.user!.email!,
        password: 'TestPassword123!',
      });

      // Try to update first user's session with second user's token
      const response = await fetch(`${BASE_URL}/api/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${otherSession!.session!.access_token}`,
        },
        body: JSON.stringify({
          page_view: true,
        }),
      });

      expect(response.status).toBe(403);

      // Cleanup
      await supabase.auth.admin.deleteUser(otherUser.user!.id);
    });

    it('should return 404 for non-existent session', async () => {
      const response = await fetch(
        `${BASE_URL}/api/sessions/00000000-0000-0000-0000-000000000000`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${testAccessToken}`,
          },
          body: JSON.stringify({
            page_view: true,
          }),
        }
      );

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/sessions/[sessionId]', () => {
    it('should end a specific session', async () => {
      const response = await fetch(`${BASE_URL}/api/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${testAccessToken}`,
        },
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.message).toContain('ended successfully');

      // Verify session is no longer active
      const { data: session } = await supabase
        .from('user_sessions')
        .select('is_active')
        .eq('id', sessionId)
        .single();

      expect(session?.is_active).toBe(false);
    });
  });

  describe('DELETE /api/sessions', () => {
    it('should end all user sessions', async () => {
      // Create a new session first
      await fetch(`${BASE_URL}/api/sessions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${testAccessToken}`,
        },
      });

      const response = await fetch(`${BASE_URL}/api/sessions`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${testAccessToken}`,
        },
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.message).toContain('All sessions ended');

      // Verify no active sessions
      const { data: sessions } = await supabase
        .from('user_sessions')
        .select('is_active')
        .eq('user_id', testUserId)
        .eq('is_active', true);

      expect(sessions?.length).toBe(0);
    });
  });

  describe('GET /api/admin/users/[userId]/sessions', () => {
    let adminToken: string;

    beforeAll(async () => {
      // Create admin user
      const { data: admin } = await supabase.auth.admin.createUser({
        email: `admin-sessions-${Date.now()}@test.com`,
        password: 'TestPassword123!',
        email_confirm: true,
      });

      await supabase
        .from('user_profiles')
        .update({ user_role: 'developer' })
        .eq('user_id', admin.user!.id);

      const { data: adminSession } = await supabase.auth.signInWithPassword({
        email: admin.user!.email!,
        password: 'TestPassword123!',
      });

      adminToken = adminSession!.session!.access_token;
    });

    it('should return user sessions for admin', async () => {
      const response = await fetch(`${BASE_URL}/api/admin/users/${testUserId}/sessions`, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('user');
      expect(data).toHaveProperty('sessions');
      expect(data).toHaveProperty('stats');
      expect(data).toHaveProperty('pagination');
    });

    it('should filter by device type', async () => {
      const response = await fetch(
        `${BASE_URL}/api/admin/users/${testUserId}/sessions?device_type=desktop`,
        {
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        }
      );

      expect(response.status).toBe(200);
    });

    it('should reject non-admin requests', async () => {
      const response = await fetch(`${BASE_URL}/api/admin/users/${testUserId}/sessions`, {
        headers: {
          Authorization: `Bearer ${testAccessToken}`,
        },
      });

      expect(response.status).toBe(403);
    });
  });
});
