/**
 * Integration Tests for Sessions API
 * Tests /api/account/sessions route
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, DELETE } from '@/app/api/account/sessions/route';
import { NextRequest } from 'next/server';
import { mockUser, mockSession, createMockSupabaseClient } from '@/__tests__/mocks/supabase';
import { createMockSessions } from '@/__tests__/fixtures/settings';

// Create mock function in hoisted scope
const { mockGetSupabaseServerClient } = vi.hoisted(() => ({
  mockGetSupabaseServerClient: vi.fn(),
}));

// Mock Supabase
vi.mock('@/lib/supabase/server', () => ({
  getSupabaseServerClient: mockGetSupabaseServerClient,
}));

describe('/api/account/sessions', () => {
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase = createMockSupabaseClient();
    mockGetSupabaseServerClient.mockResolvedValue(mockSupabase);
  });

  describe('GET /api/account/sessions', () => {
    it('should return active sessions for authenticated user', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession, user: mockUser },
        error: null,
      });

      const mockSessions = createMockSessions(3);

      mockSupabase.rpc.mockResolvedValue({
        data: mockSessions,
        error: null,
      });

      const request = new NextRequest('http://localhost:3000/api/account/sessions');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.sessions).toHaveLength(3);
      expect(mockSupabase.rpc).toHaveBeenCalledWith('get_active_sessions', {
        p_user_id: mockUser.id,
      });
    });

    it('should mark current session in results', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession, user: mockUser },
        error: null,
      });

      const mockSessions = createMockSessions(3);
      mockSessions[0].session_token = mockSession.access_token;

      mockSupabase.rpc.mockResolvedValue({
        data: mockSessions,
        error: null,
      });

      const request = new NextRequest('http://localhost:3000/api/account/sessions');
      const response = await GET(request);
      const data = await response.json();

      expect(data.sessions[0].isCurrent).toBe(true);
      expect(data.sessions[1].isCurrent).toBe(false);
    });

    it('should handle empty sessions list', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession, user: mockUser },
        error: null,
      });

      mockSupabase.rpc.mockResolvedValue({
        data: [],
        error: null,
      });

      const request = new NextRequest('http://localhost:3000/api/account/sessions');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.sessions).toHaveLength(0);
    });

    it('should return 401 if not authenticated', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null, user: null },
        error: new Error('Not authenticated'),
      });

      const request = new NextRequest('http://localhost:3000/api/account/sessions');
      const response = await GET(request);

      expect(response.status).toBe(401);
    });

    it('should fall back to current session only if RPC fails', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession, user: mockUser },
        error: null,
      });

      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: new Error('Function not found'),
      });

      const request = new NextRequest('http://localhost:3000/api/account/sessions');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.sessions).toHaveLength(1);
      expect(data.sessions[0].isCurrent).toBe(true);
    });
  });

  describe('DELETE /api/account/sessions', () => {
    it('should revoke all other sessions', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession, user: mockUser },
        error: null,
      });

      // Mock finding current session
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: 'current-session-id' },
                  error: null,
                }),
              }),
            }),
          }),
        }),
      } as any);

      // Mock RPC call
      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: null,
      });

      // Mock auth.admin.signOut
      mockSupabase.auth.admin = {
        signOut: vi.fn().mockResolvedValue({
          error: null,
        }),
      } as any;

      const request = new NextRequest('http://localhost:3000/api/account/sessions', {
        method: 'DELETE',
        body: JSON.stringify({ revokeAll: true }),
      });

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockSupabase.rpc).toHaveBeenCalledWith('revoke_all_other_sessions', {
        p_user_id: mockUser.id,
        p_current_session_id: 'current-session-id',
      });
    });

    it('should revoke specific session', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession, user: mockUser },
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          }),
        }),
      } as any);

      const request = new NextRequest('http://localhost:3000/api/account/sessions', {
        method: 'DELETE',
        body: JSON.stringify({ sessionId: 'session-to-revoke' }),
      });

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should return 400 if neither sessionId nor revokeAll provided', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession, user: mockUser },
        error: null,
      });

      const request = new NextRequest('http://localhost:3000/api/account/sessions', {
        method: 'DELETE',
        body: JSON.stringify({}),
      });

      const response = await DELETE(request);

      expect(response.status).toBe(400);
    });
  });
});
