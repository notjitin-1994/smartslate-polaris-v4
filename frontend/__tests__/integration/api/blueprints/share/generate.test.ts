/**
 * API Integration Tests: POST /api/blueprints/share/generate
 *
 * Core test coverage for blueprint share link generation endpoint focusing on:
 * - Authentication & Authorization
 * - Request Validation
 * - Blueprint Ownership Verification
 * - Admin Access Handling
 * - Share Token Generation (RPC)
 * - Existing Token Retrieval
 * - Error Handling
 *
 * This endpoint uses PostgreSQL RPC function for secure token generation
 * and supports both regular users and administrators.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/blueprints/share/generate/route';
import { NextRequest } from 'next/server';
import { mockEmailUser } from '@/__tests__/fixtures/auth';

// Mock dependencies
vi.mock('@/lib/supabase/server', () => ({
  getSupabaseServerClient: vi.fn(),
}));

vi.mock('@/lib/auth/adminUtils', () => ({
  getClientForUser: vi.fn(),
}));

describe('POST /api/blueprints/share/generate - Generate Share Link', () => {
  const mockBlueprintId = 'blueprint-123';
  const mockUserId = 'user-123';
  const mockUser = { ...mockEmailUser, id: mockUserId };
  const mockShareToken = 'share-token-abc123';
  const mockOrigin = 'https://example.com';

  function createMockRequest(body: any): NextRequest {
    return {
      json: async () => body,
      nextUrl: { origin: mockOrigin },
    } as NextRequest;
  }

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Authentication', () => {
    it('should return 401 when user is not authenticated', async () => {
      // Arrange
      const mockAuthenticatedClient = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: null },
            error: null,
          }),
        },
      };

      const { getSupabaseServerClient } = await import('@/lib/supabase/server');
      vi.mocked(getSupabaseServerClient).mockResolvedValue(mockAuthenticatedClient as any);

      const request = createMockRequest({ blueprintId: mockBlueprintId });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data).toEqual({ error: 'Unauthorized' });
    });

    it('should return 401 when authentication fails', async () => {
      // Arrange
      const mockAuthenticatedClient = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: null },
            error: { message: 'Auth error' },
          }),
        },
      };

      const { getSupabaseServerClient } = await import('@/lib/supabase/server');
      vi.mocked(getSupabaseServerClient).mockResolvedValue(mockAuthenticatedClient as any);

      const request = createMockRequest({ blueprintId: mockBlueprintId });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data).toEqual({ error: 'Unauthorized' });
    });
  });

  describe('Request Validation', () => {
    beforeEach(async () => {
      const mockAuthenticatedClient = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null,
          }),
        },
      };

      const { getSupabaseServerClient } = await import('@/lib/supabase/server');
      vi.mocked(getSupabaseServerClient).mockResolvedValue(mockAuthenticatedClient as any);
    });

    it('should return 400 when blueprintId is missing', async () => {
      // Arrange
      const request = createMockRequest({});

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data).toEqual({ error: 'Blueprint ID is required' });
    });

    it('should return 400 when blueprintId is null', async () => {
      // Arrange
      const request = createMockRequest({ blueprintId: null });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data).toEqual({ error: 'Blueprint ID is required' });
    });
  });

  describe('Blueprint Ownership - Regular User', () => {
    it('should return 404 when blueprint not found', async () => {
      // Arrange
      const mockAuthenticatedClient = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null,
          }),
        },
      };

      // Mock SELECT query chain
      const mockSelectBuilder = {
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Not found' },
        }),
      };

      const mockSelect = vi.fn(() => mockSelectBuilder);

      const mockSupabase = {
        from: vi.fn(() => ({
          select: mockSelect,
        })),
      };

      const { getSupabaseServerClient } = await import('@/lib/supabase/server');
      vi.mocked(getSupabaseServerClient).mockResolvedValue(mockAuthenticatedClient as any);

      const { getClientForUser } = await import('@/lib/auth/adminUtils');
      vi.mocked(getClientForUser).mockResolvedValue({
        client: mockSupabase,
        isAdmin: false,
      } as any);

      const request = createMockRequest({ blueprintId: mockBlueprintId });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(404);
      expect(data).toEqual({ error: 'Blueprint not found or access denied' });
    });

    it('should verify ownership with user_id check for regular users', async () => {
      // Arrange
      const mockAuthenticatedClient = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null,
          }),
        },
      };

      // Mock SELECT query chain
      const mockSelectBuilder = {
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: mockBlueprintId,
            share_token: mockShareToken,
            user_id: mockUserId,
          },
          error: null,
        }),
      };

      const mockSelect = vi.fn(() => mockSelectBuilder);

      const mockSupabase = {
        from: vi.fn(() => ({
          select: mockSelect,
        })),
      };

      const { getSupabaseServerClient } = await import('@/lib/supabase/server');
      vi.mocked(getSupabaseServerClient).mockResolvedValue(mockAuthenticatedClient as any);

      const { getClientForUser } = await import('@/lib/auth/adminUtils');
      vi.mocked(getClientForUser).mockResolvedValue({
        client: mockSupabase,
        isAdmin: false,
      } as any);

      const request = createMockRequest({ blueprintId: mockBlueprintId });

      // Act
      await POST(request);

      // Assert - Verify user_id check was added
      expect(mockSelectBuilder.eq).toHaveBeenCalledWith('user_id', mockUserId);
    });
  });

  describe('Admin Access', () => {
    it('should allow admin to access any blueprint without user_id check', async () => {
      // Arrange
      const mockAuthenticatedClient = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null,
          }),
        },
      };

      // Mock SELECT query chain
      const mockSelectBuilder = {
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: mockBlueprintId,
            share_token: mockShareToken,
            user_id: 'different-user-id',
          },
          error: null,
        }),
      };

      const mockSelect = vi.fn(() => mockSelectBuilder);

      const mockSupabase = {
        from: vi.fn(() => ({
          select: mockSelect,
        })),
      };

      const { getSupabaseServerClient } = await import('@/lib/supabase/server');
      vi.mocked(getSupabaseServerClient).mockResolvedValue(mockAuthenticatedClient as any);

      const { getClientForUser } = await import('@/lib/auth/adminUtils');
      vi.mocked(getClientForUser).mockResolvedValue({
        client: mockSupabase,
        isAdmin: true,
      } as any);

      const request = createMockRequest({ blueprintId: mockBlueprintId });

      // Act
      await POST(request);

      // Assert - Verify user_id check was NOT added (admin can access any)
      const eqCalls = mockSelectBuilder.eq.mock.calls;
      expect(eqCalls).toHaveLength(1); // Only .eq('id', blueprintId)
      expect(eqCalls[0]).toEqual(['id', mockBlueprintId]);
    });
  });

  describe('Existing Share Token', () => {
    it('should return existing share token if already generated', async () => {
      // Arrange
      const mockAuthenticatedClient = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null,
          }),
        },
      };

      // Mock SELECT query chain
      const mockSelectBuilder = {
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: mockBlueprintId,
            share_token: mockShareToken,
            user_id: mockUserId,
          },
          error: null,
        }),
      };

      const mockSelect = vi.fn(() => mockSelectBuilder);

      const mockSupabase = {
        from: vi.fn(() => ({
          select: mockSelect,
        })),
      };

      const { getSupabaseServerClient } = await import('@/lib/supabase/server');
      vi.mocked(getSupabaseServerClient).mockResolvedValue(mockAuthenticatedClient as any);

      const { getClientForUser } = await import('@/lib/auth/adminUtils');
      vi.mocked(getClientForUser).mockResolvedValue({
        client: mockSupabase,
        isAdmin: false,
      } as any);

      const request = createMockRequest({ blueprintId: mockBlueprintId });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data).toEqual({
        success: true,
        shareToken: mockShareToken,
        shareUrl: `${mockOrigin}/share/${mockShareToken}`,
      });
    });
  });

  describe('New Share Token Generation', () => {
    it('should generate new token using RPC function when no token exists', async () => {
      // Arrange
      const mockAuthenticatedClient = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null,
          }),
        },
      };

      // Mock SELECT query chain - no existing token
      const mockSelectBuilder = {
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: mockBlueprintId,
            share_token: null,
            user_id: mockUserId,
          },
          error: null,
        }),
      };

      const mockSelect = vi.fn(() => mockSelectBuilder);

      // Mock UPDATE query chain
      const mockUpdateBuilder = {
        eq: vi.fn().mockReturnThis(),
      };
      mockUpdateBuilder.eq.mockReturnValueOnce(mockUpdateBuilder);
      mockUpdateBuilder.eq.mockResolvedValueOnce({ data: null, error: null });

      const mockUpdate = vi.fn(() => mockUpdateBuilder);

      // Mock RPC function
      const mockRpc = vi.fn().mockResolvedValue({
        data: mockShareToken,
        error: null,
      });

      const mockSupabase = {
        from: vi.fn(() => ({
          select: mockSelect,
          update: mockUpdate,
        })),
        rpc: mockRpc,
      };

      const { getSupabaseServerClient } = await import('@/lib/supabase/server');
      vi.mocked(getSupabaseServerClient).mockResolvedValue(mockAuthenticatedClient as any);

      const { getClientForUser } = await import('@/lib/auth/adminUtils');
      vi.mocked(getClientForUser).mockResolvedValue({
        client: mockSupabase,
        isAdmin: false,
      } as any);

      const request = createMockRequest({ blueprintId: mockBlueprintId });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data).toEqual({
        success: true,
        shareToken: mockShareToken,
        shareUrl: `${mockOrigin}/share/${mockShareToken}`,
      });
      expect(mockRpc).toHaveBeenCalledWith('generate_share_token');
    });

    it('should update blueprint with new share token', async () => {
      // Arrange
      const mockAuthenticatedClient = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null,
          }),
        },
      };

      // Mock SELECT query chain - no existing token
      const mockSelectBuilder = {
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: mockBlueprintId,
            share_token: null,
            user_id: mockUserId,
          },
          error: null,
        }),
      };

      const mockSelect = vi.fn(() => mockSelectBuilder);

      // Mock UPDATE query chain
      const mockUpdateBuilder = {
        eq: vi.fn().mockReturnThis(),
      };
      mockUpdateBuilder.eq.mockReturnValueOnce(mockUpdateBuilder);
      mockUpdateBuilder.eq.mockResolvedValueOnce({ data: null, error: null });

      const mockUpdate = vi.fn(() => mockUpdateBuilder);

      // Mock RPC function
      const mockRpc = vi.fn().mockResolvedValue({
        data: mockShareToken,
        error: null,
      });

      const mockSupabase = {
        from: vi.fn(() => ({
          select: mockSelect,
          update: mockUpdate,
        })),
        rpc: mockRpc,
      };

      const { getSupabaseServerClient } = await import('@/lib/supabase/server');
      vi.mocked(getSupabaseServerClient).mockResolvedValue(mockAuthenticatedClient as any);

      const { getClientForUser } = await import('@/lib/auth/adminUtils');
      vi.mocked(getClientForUser).mockResolvedValue({
        client: mockSupabase,
        isAdmin: false,
      } as any);

      const request = createMockRequest({ blueprintId: mockBlueprintId });

      // Act
      await POST(request);

      // Assert - Verify update was called with correct parameters
      expect(mockUpdate).toHaveBeenCalledWith({ share_token: mockShareToken });
      expect(mockUpdateBuilder.eq).toHaveBeenCalledWith('id', mockBlueprintId);
      expect(mockUpdateBuilder.eq).toHaveBeenCalledWith('user_id', mockUserId);
    });
  });

  describe('Error Handling', () => {
    it('should return 500 when RPC function fails', async () => {
      // Arrange
      const mockAuthenticatedClient = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null,
          }),
        },
      };

      // Mock SELECT query chain - no existing token
      const mockSelectBuilder = {
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: mockBlueprintId,
            share_token: null,
            user_id: mockUserId,
          },
          error: null,
        }),
      };

      const mockSelect = vi.fn(() => mockSelectBuilder);

      // Mock RPC function failure
      const mockRpc = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'RPC error' },
      });

      const mockSupabase = {
        from: vi.fn(() => ({
          select: mockSelect,
        })),
        rpc: mockRpc,
      };

      const { getSupabaseServerClient } = await import('@/lib/supabase/server');
      vi.mocked(getSupabaseServerClient).mockResolvedValue(mockAuthenticatedClient as any);

      const { getClientForUser } = await import('@/lib/auth/adminUtils');
      vi.mocked(getClientForUser).mockResolvedValue({
        client: mockSupabase,
        isAdmin: false,
      } as any);

      const request = createMockRequest({ blueprintId: mockBlueprintId });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data).toEqual({ error: 'Failed to generate share token' });
    });

    it('should return 500 when update fails', async () => {
      // Arrange
      const mockAuthenticatedClient = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null,
          }),
        },
      };

      // Mock SELECT query chain - no existing token
      const mockSelectBuilder = {
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: mockBlueprintId,
            share_token: null,
            user_id: mockUserId,
          },
          error: null,
        }),
      };

      const mockSelect = vi.fn(() => mockSelectBuilder);

      // Mock UPDATE query chain - with error
      // The updateQuery is awaited directly, so it needs to be thenable
      const mockUpdateBuilder = {
        eq: vi.fn(function (this: any) {
          return this;
        }),
        then: vi.fn((resolve) => {
          resolve({ data: null, error: { message: 'Update error' } });
          return Promise.resolve({ data: null, error: { message: 'Update error' } });
        }),
      };

      const mockUpdate = vi.fn(() => mockUpdateBuilder);

      // Mock RPC function success
      const mockRpc = vi.fn().mockResolvedValue({
        data: mockShareToken,
        error: null,
      });

      const mockSupabase = {
        from: vi.fn(() => ({
          select: mockSelect,
          update: mockUpdate,
        })),
        rpc: mockRpc,
      };

      const { getSupabaseServerClient } = await import('@/lib/supabase/server');
      vi.mocked(getSupabaseServerClient).mockResolvedValue(mockAuthenticatedClient as any);

      const { getClientForUser } = await import('@/lib/auth/adminUtils');
      vi.mocked(getClientForUser).mockResolvedValue({
        client: mockSupabase,
        isAdmin: false,
      } as any);

      const request = createMockRequest({ blueprintId: mockBlueprintId });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data).toEqual({ error: 'Failed to save share token' });
    });

    it('should return 500 when unexpected error occurs', async () => {
      // Arrange
      const { getSupabaseServerClient } = await import('@/lib/supabase/server');
      vi.mocked(getSupabaseServerClient).mockRejectedValue(new Error('Unexpected error'));

      const request = createMockRequest({ blueprintId: mockBlueprintId });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data).toEqual({ error: 'Internal server error' });
    });
  });
});
