/**
 * API Integration Tests: /api/blueprints/[id]
 *
 * Core test coverage for blueprint management endpoint focusing on:
 * - DELETE: Soft delete blueprint
 * - POST: Restore soft-deleted blueprint
 * - Authentication & Authorization
 * - Ownership Verification (via RPC)
 * - Error Handling
 *
 * This endpoint uses PostgreSQL RPC functions for soft delete/restore operations
 * which handle ownership verification at the database level.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DELETE, POST } from '@/app/api/blueprints/[id]/route';
import { NextRequest } from 'next/server';
import { mockEmailUser, createMockSession } from '@/__tests__/fixtures/auth';

// Mock all dependencies
vi.mock('@/lib/supabase/server');
vi.mock('@/lib/logging', () => {
  const mockLogger = {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  };
  return {
    createServiceLogger: vi.fn(() => mockLogger),
  };
});

describe('DELETE /api/blueprints/[id] - Soft Delete Blueprint', () => {
  const mockBlueprintId = 'blueprint-123';
  const mockUserId = 'user-123';
  const mockUser = { ...mockEmailUser, id: mockUserId };

  async function createMockParams(id: string) {
    return Promise.resolve({ id });
  }

  function createMockRequest(): NextRequest {
    return {
      nextUrl: { searchParams: new URLSearchParams() },
    } as NextRequest;
  }

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Authentication', () => {
    it('should return 401 when user is not authenticated', async () => {
      // Arrange
      const { getServerSession } = await import('@/lib/supabase/server');
      vi.mocked(getServerSession).mockResolvedValue({ session: null });

      const request = createMockRequest();
      const params = createMockParams(mockBlueprintId);

      // Act
      const response = await DELETE(request, { params });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data).toEqual({ error: 'Unauthorized' });
    });

    it('should return 401 when session has no user', async () => {
      // Arrange
      const { getServerSession } = await import('@/lib/supabase/server');
      vi.mocked(getServerSession).mockResolvedValue({
        session: { user: null } as any,
      });

      const request = createMockRequest();
      const params = createMockParams(mockBlueprintId);

      // Act
      const response = await DELETE(request, { params });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data).toEqual({ error: 'Unauthorized' });
    });
  });

  describe('Successful Deletion', () => {
    beforeEach(async () => {
      const { getServerSession } = await import('@/lib/supabase/server');
      vi.mocked(getServerSession).mockResolvedValue({
        session: createMockSession(mockUser),
      });
    });

    it('should soft delete blueprint successfully', async () => {
      // Arrange
      const mockSupabase = {
        rpc: vi.fn().mockResolvedValue({
          data: true, // RPC returns true for successful deletion
          error: null,
        }),
      };

      const { getSupabaseServerClient } = await import('@/lib/supabase/server');
      vi.mocked(getSupabaseServerClient).mockResolvedValue(mockSupabase as any);

      const request = createMockRequest();
      const params = createMockParams(mockBlueprintId);

      // Act
      const response = await DELETE(request, { params });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data).toEqual({
        success: true,
        message: 'Blueprint deleted successfully',
      });
      expect(mockSupabase.rpc).toHaveBeenCalledWith('soft_delete_blueprint', {
        p_blueprint_id: mockBlueprintId,
        p_user_id: mockUserId,
      });
    });

    it('should call RPC function with correct parameters', async () => {
      // Arrange
      const mockSupabase = {
        rpc: vi.fn().mockResolvedValue({ data: true, error: null }),
      };

      const { getSupabaseServerClient } = await import('@/lib/supabase/server');
      vi.mocked(getSupabaseServerClient).mockResolvedValue(mockSupabase as any);

      const request = createMockRequest();
      const params = createMockParams(mockBlueprintId);

      // Act
      await DELETE(request, { params });

      // Assert
      expect(mockSupabase.rpc).toHaveBeenCalledWith('soft_delete_blueprint', {
        p_blueprint_id: mockBlueprintId,
        p_user_id: mockUserId,
      });
    });
  });

  describe('Blueprint Not Found', () => {
    beforeEach(async () => {
      const { getServerSession } = await import('@/lib/supabase/server');
      vi.mocked(getServerSession).mockResolvedValue({
        session: createMockSession(mockUser),
      });
    });

    it('should return 404 when blueprint not found', async () => {
      // Arrange
      const mockSupabase = {
        rpc: vi.fn().mockResolvedValue({
          data: false, // RPC returns false when blueprint not found
          error: null,
        }),
      };

      const { getSupabaseServerClient } = await import('@/lib/supabase/server');
      vi.mocked(getSupabaseServerClient).mockResolvedValue(mockSupabase as any);

      const request = createMockRequest();
      const params = createMockParams('nonexistent-blueprint');

      // Act
      const response = await DELETE(request, { params });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(404);
      expect(data).toEqual({
        success: false,
        error: 'Blueprint not found or already deleted',
      });
    });

    it('should return 404 when blueprint already deleted', async () => {
      // Arrange
      const mockSupabase = {
        rpc: vi.fn().mockResolvedValue({
          data: false, // RPC returns false when already deleted
          error: null,
        }),
      };

      const { getSupabaseServerClient } = await import('@/lib/supabase/server');
      vi.mocked(getSupabaseServerClient).mockResolvedValue(mockSupabase as any);

      const request = createMockRequest();
      const params = createMockParams(mockBlueprintId);

      // Act
      const response = await DELETE(request, { params });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Blueprint not found or already deleted');
    });
  });

  describe('Error Handling', () => {
    beforeEach(async () => {
      const { getServerSession } = await import('@/lib/supabase/server');
      vi.mocked(getServerSession).mockResolvedValue({
        session: createMockSession(mockUser),
      });
    });

    it('should return 500 when RPC call fails', async () => {
      // Arrange
      const mockSupabase = {
        rpc: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error', code: 'PGRST' },
        }),
      };

      const { getSupabaseServerClient } = await import('@/lib/supabase/server');
      vi.mocked(getSupabaseServerClient).mockResolvedValue(mockSupabase as any);

      const request = createMockRequest();
      const params = createMockParams(mockBlueprintId);

      // Act
      const response = await DELETE(request, { params });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Database error');
      expect(data.code).toBe('PGRST');
    });

    it('should return 500 when unexpected error occurs', async () => {
      // Arrange
      const { getSupabaseServerClient } = await import('@/lib/supabase/server');
      vi.mocked(getSupabaseServerClient).mockRejectedValue(new Error('Unexpected error'));

      const request = createMockRequest();
      const params = createMockParams(mockBlueprintId);

      // Act
      const response = await DELETE(request, { params });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('An unexpected error occurred while deleting the blueprint');
    });
  });
});

describe('POST /api/blueprints/[id]?action=restore - Restore Blueprint', () => {
  const mockBlueprintId = 'blueprint-123';
  const mockUserId = 'user-123';
  const mockUser = { ...mockEmailUser, id: mockUserId };

  async function createMockParams(id: string) {
    return Promise.resolve({ id });
  }

  function createMockRequest(action?: string): NextRequest {
    const searchParams = new URLSearchParams();
    if (action) {
      searchParams.set('action', action);
    }
    return {
      nextUrl: { searchParams },
    } as NextRequest;
  }

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Action Validation', () => {
    beforeEach(async () => {
      const { getServerSession } = await import('@/lib/supabase/server');
      vi.mocked(getServerSession).mockResolvedValue({
        session: createMockSession(mockUser),
      });
    });

    it('should return 400 when action parameter is missing', async () => {
      // Arrange
      const request = createMockRequest(); // No action parameter
      const params = createMockParams(mockBlueprintId);

      // Act
      const response = await POST(request, { params });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid action');
    });

    it('should return 400 when action parameter is invalid', async () => {
      // Arrange
      const request = createMockRequest('invalid-action');
      const params = createMockParams(mockBlueprintId);

      // Act
      const response = await POST(request, { params });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid action');
    });
  });

  describe('Authentication', () => {
    it('should return 401 when user is not authenticated', async () => {
      // Arrange
      const { getServerSession } = await import('@/lib/supabase/server');
      vi.mocked(getServerSession).mockResolvedValue({ session: null });

      const request = createMockRequest('restore');
      const params = createMockParams(mockBlueprintId);

      // Act
      const response = await POST(request, { params });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data).toEqual({ error: 'Unauthorized' });
    });

    it('should return 401 when session has no user', async () => {
      // Arrange
      const { getServerSession } = await import('@/lib/supabase/server');
      vi.mocked(getServerSession).mockResolvedValue({
        session: { user: null } as any,
      });

      const request = createMockRequest('restore');
      const params = createMockParams(mockBlueprintId);

      // Act
      const response = await POST(request, { params });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data).toEqual({ error: 'Unauthorized' });
    });
  });

  describe('Successful Restoration', () => {
    beforeEach(async () => {
      const { getServerSession } = await import('@/lib/supabase/server');
      vi.mocked(getServerSession).mockResolvedValue({
        session: createMockSession(mockUser),
      });
    });

    it('should restore blueprint successfully', async () => {
      // Arrange
      const mockSupabase = {
        rpc: vi.fn().mockResolvedValue({
          data: true, // RPC returns true for successful restoration
          error: null,
        }),
      };

      const { getSupabaseServerClient } = await import('@/lib/supabase/server');
      vi.mocked(getSupabaseServerClient).mockResolvedValue(mockSupabase as any);

      const request = createMockRequest('restore');
      const params = createMockParams(mockBlueprintId);

      // Act
      const response = await POST(request, { params });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data).toEqual({
        success: true,
        message: 'Blueprint restored successfully',
      });
      expect(mockSupabase.rpc).toHaveBeenCalledWith('restore_blueprint', {
        p_blueprint_id: mockBlueprintId,
        p_user_id: mockUserId,
      });
    });

    it('should call RPC function with correct parameters', async () => {
      // Arrange
      const mockSupabase = {
        rpc: vi.fn().mockResolvedValue({ data: true, error: null }),
      };

      const { getSupabaseServerClient } = await import('@/lib/supabase/server');
      vi.mocked(getSupabaseServerClient).mockResolvedValue(mockSupabase as any);

      const request = createMockRequest('restore');
      const params = createMockParams(mockBlueprintId);

      // Act
      await POST(request, { params });

      // Assert
      expect(mockSupabase.rpc).toHaveBeenCalledWith('restore_blueprint', {
        p_blueprint_id: mockBlueprintId,
        p_user_id: mockUserId,
      });
    });
  });

  describe('Blueprint Not Found or Not Deleted', () => {
    beforeEach(async () => {
      const { getServerSession } = await import('@/lib/supabase/server');
      vi.mocked(getServerSession).mockResolvedValue({
        session: createMockSession(mockUser),
      });
    });

    it('should return 404 when blueprint not found', async () => {
      // Arrange
      const mockSupabase = {
        rpc: vi.fn().mockResolvedValue({
          data: false, // RPC returns false when blueprint not found
          error: null,
        }),
      };

      const { getSupabaseServerClient } = await import('@/lib/supabase/server');
      vi.mocked(getSupabaseServerClient).mockResolvedValue(mockSupabase as any);

      const request = createMockRequest('restore');
      const params = createMockParams('nonexistent-blueprint');

      // Act
      const response = await POST(request, { params });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(404);
      expect(data).toEqual({
        success: false,
        error: 'Blueprint not found or not deleted',
      });
    });

    it('should return 404 when blueprint is not deleted (active)', async () => {
      // Arrange
      const mockSupabase = {
        rpc: vi.fn().mockResolvedValue({
          data: false, // RPC returns false when blueprint is active (not deleted)
          error: null,
        }),
      };

      const { getSupabaseServerClient } = await import('@/lib/supabase/server');
      vi.mocked(getSupabaseServerClient).mockResolvedValue(mockSupabase as any);

      const request = createMockRequest('restore');
      const params = createMockParams(mockBlueprintId);

      // Act
      const response = await POST(request, { params });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Blueprint not found or not deleted');
    });
  });

  describe('Error Handling', () => {
    beforeEach(async () => {
      const { getServerSession } = await import('@/lib/supabase/server');
      vi.mocked(getServerSession).mockResolvedValue({
        session: createMockSession(mockUser),
      });
    });

    it('should return 500 when RPC call fails', async () => {
      // Arrange
      const mockSupabase = {
        rpc: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error', code: 'PGRST' },
        }),
      };

      const { getSupabaseServerClient } = await import('@/lib/supabase/server');
      vi.mocked(getSupabaseServerClient).mockResolvedValue(mockSupabase as any);

      const request = createMockRequest('restore');
      const params = createMockParams(mockBlueprintId);

      // Act
      const response = await POST(request, { params });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('An unexpected error occurred while restoring the blueprint');
    });

    it('should return 500 when unexpected error occurs', async () => {
      // Arrange
      const { getSupabaseServerClient } = await import('@/lib/supabase/server');
      vi.mocked(getSupabaseServerClient).mockRejectedValue(new Error('Unexpected error'));

      const request = createMockRequest('restore');
      const params = createMockParams(mockBlueprintId);

      // Act
      const response = await POST(request, { params });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('An unexpected error occurred while restoring the blueprint');
    });
  });
});
