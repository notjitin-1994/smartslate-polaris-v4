/**
 * Integration tests for Account API routes
 * Tests: /api/account/* routes
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DELETE as avatarDELETE } from '@/app/api/account/avatar/route';
import { POST as deletePOST, DELETE as deleteCancel } from '@/app/api/account/delete/route';
import { GET as exportGET } from '@/app/api/account/export/route';
import { POST as changePasswordPOST } from '@/app/api/account/password/change/route';
import { GET as sessionsGET } from '@/app/api/account/sessions/route';

// Mock Supabase
const mockGetUser = vi.fn();
const mockGetSession = vi.fn();
const mockUpdateUser = vi.fn();
const mockFromTable = vi.fn();
const mockStorage = {
  from: vi.fn(() => ({
    remove: vi.fn().mockResolvedValue({ error: null }),
  })),
};

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: mockGetUser,
      getSession: mockGetSession,
      updateUser: mockUpdateUser,
    },
    from: mockFromTable,
    storage: mockStorage,
  })),
  getSupabaseServerClient: vi.fn(() => ({
    auth: {
      getUser: mockGetUser,
      getSession: mockGetSession,
      updateUser: mockUpdateUser,
    },
    from: mockFromTable,
    storage: mockStorage,
  })),
}));

// Mock email service
vi.mock('@/lib/email/logger', () => ({
  sendAndLogEmail: vi.fn().mockResolvedValue({ success: true }),
}));

// Mock React Email
vi.mock('@react-email/render', () => ({
  render: vi.fn(() => '<html></html>'),
}));

// Helper functions
function createMockRequest(options: {
  method: string;
  body?: any;
  headers?: Record<string, string>;
}): Request {
  return new Request('http://localhost:3000/api/test', {
    method: options.method,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
}

describe('Account API Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('DELETE /api/account/avatar', () => {
    it('should delete avatar successfully', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123', email: 'test@example.com' } },
        error: null,
      });

      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { avatar_url: null },
            error: null,
          }),
        }),
      });

      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          error: null,
        }),
      });

      mockFromTable.mockImplementation((table: string) => {
        if (table === 'user_profiles') {
          return {
            select: mockSelect,
            update: mockUpdate,
          };
        }
      });

      const request = createMockRequest({ method: 'DELETE' });
      const response = await avatarDELETE(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should reject unauthenticated requests', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' },
      });

      const request = createMockRequest({ method: 'DELETE' });
      const response = await avatarDELETE(request);

      expect(response.status).toBe(401);
    });
  });

  // TODO: Complex mocking needed for email service and database transactions
  describe.skip('POST /api/account/delete', () => {
    it('should schedule account deletion', async () => {
      mockGetSession.mockResolvedValue({
        data: {
          session: { user: { id: 'user-123', email: 'test@example.com' } },
          user: { id: 'user-123', email: 'test@example.com' },
        },
        error: null,
      });

      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Not found' },
            }),
          }),
        }),
      });

      const mockInsert = vi.fn().mockResolvedValue({
        error: null,
      });

      mockFromTable.mockImplementation((table: string) => {
        if (table === 'account_deletion_requests') {
          return {
            select: mockSelect,
            insert: mockInsert,
          };
        }
        if (table === 'user_profiles') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { full_name: 'Test User' },
                  error: null,
                }),
              }),
            }),
          };
        }
      });

      const request = createMockRequest({
        method: 'POST',
        body: { confirmationText: 'DELETE' },
      });

      const response = await deletePOST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should reject invalid confirmation text', async () => {
      mockGetSession.mockResolvedValue({
        data: {
          session: { user: { id: 'user-123' } },
          user: { id: 'user-123' },
        },
        error: null,
      });

      const request = createMockRequest({
        method: 'POST',
        body: { confirmationText: 'WRONG' },
      });

      const response = await deletePOST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('confirmation text');
    });

    it('should reject unauthenticated requests', async () => {
      mockGetSession.mockResolvedValue({
        data: { session: null, user: null },
        error: { message: 'Not authenticated' },
      });

      const request = createMockRequest({
        method: 'POST',
        body: { confirmationText: 'DELETE' },
      });

      const response = await deletePOST(request);

      expect(response.status).toBe(401);
    });
  });

  // TODO: Route needs complex data aggregation mocking
  describe.skip('GET /api/account/export', () => {
    it('should export account data', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123', email: 'test@example.com' } },
        error: null,
      });

      mockFromTable.mockImplementation((table: string) => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                full_name: 'Test User',
                created_at: new Date().toISOString(),
              },
              error: null,
            }),
          }),
        }),
      }));

      const request = createMockRequest({ method: 'GET' });
      const response = await exportGET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.profile).toBeDefined();
    });

    it('should reject unauthenticated requests', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' },
      });

      const request = createMockRequest({ method: 'GET' });
      const response = await exportGET(request);

      expect(response.status).toBe(401);
    });
  });

  // TODO: Route validation and auth flow needs proper mocking
  describe.skip('POST /api/account/password/change', () => {
    it('should change password successfully', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123', email: 'test@example.com' } },
        error: null,
      });

      mockUpdateUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });

      const request = createMockRequest({
        method: 'POST',
        body: {
          newPassword: 'newpassword123',
        },
      });

      const response = await changePasswordPOST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should validate password requirements', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-123', email: 'test@example.com' } },
        error: null,
      });

      const request = createMockRequest({
        method: 'POST',
        body: {
          newPassword: 'short',
        },
      });

      const response = await changePasswordPOST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
    });

    it('should reject unauthenticated requests', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' },
      });

      const request = createMockRequest({
        method: 'POST',
        body: {
          newPassword: 'newpassword123',
        },
      });

      const response = await changePasswordPOST(request);

      expect(response.status).toBe(401);
    });
  });

  // TODO: Session management route needs complex mocking
  describe.skip('GET /api/account/sessions', () => {
    it('should return active sessions', async () => {
      mockGetSession.mockResolvedValue({
        data: {
          session: {
            user: { id: 'user-123', email: 'test@example.com' },
            access_token: 'token',
          },
          user: { id: 'user-123', email: 'test@example.com' },
        },
        error: null,
      });

      const request = createMockRequest({ method: 'GET' });
      const response = await sessionsGET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.sessions).toBeDefined();
    });

    it('should reject unauthenticated requests', async () => {
      mockGetSession.mockResolvedValue({
        data: { session: null, user: null },
        error: { message: 'Not authenticated' },
      });

      const request = createMockRequest({ method: 'GET' });
      const response = await sessionsGET(request);

      expect(response.status).toBe(401);
    });
  });
});
