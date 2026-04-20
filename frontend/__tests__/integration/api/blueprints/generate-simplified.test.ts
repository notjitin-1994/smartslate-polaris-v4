/**
 * API Integration Tests: POST /api/blueprints/generate (Simplified)
 *
 * Core test coverage for the blueprint generation endpoint focusing on:
 * - Authentication
 * - Request Validation
 * - Blueprint Ownership
 * - Questionnaire Validation
 * - Status Management
 * - Error Handling
 *
 * Note: Full comprehensive suite with 62 tests exists in generate.test.ts
 * This simplified version focuses on the critical happy path and key edge cases.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/blueprints/generate/route';
import { NextRequest } from 'next/server';
import { mockEmailUser, createMockSession } from '@/__tests__/fixtures/auth';

// Mock all dependencies
vi.mock('@/lib/supabase/server');
vi.mock('@/lib/services/blueprintGenerationService');
vi.mock('@/lib/claude/prompts');
vi.mock('@/lib/services/blueprintMarkdownConverter');
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
vi.mock('@/lib/services/blueprintUsageService');
vi.mock('@/lib/auth/adminUtils');

describe('POST /api/blueprints/generate - Core Scenarios', () => {
  const validBlueprintId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
  const mockUserId = 'user-123';
  const mockUser = { ...mockEmailUser, id: mockUserId };

  function createMockRequest(body: any): NextRequest {
    return {
      json: async () => body,
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

      const request = createMockRequest({ blueprintId: validBlueprintId });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data).toEqual({ success: false, error: 'Unauthorized' });
    });
  });

  describe('Request Validation', () => {
    beforeEach(async () => {
      const { getServerSession } = await import('@/lib/supabase/server');
      vi.mocked(getServerSession).mockResolvedValue({
        session: createMockSession(mockUser),
      });
    });

    it('should return 400 when blueprintId is missing', async () => {
      // Arrange
      const request = createMockRequest({});

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('blueprintId is required');
    });

    it('should return 400 when blueprintId is not a valid UUID', async () => {
      // Arrange
      const request = createMockRequest({ blueprintId: 'invalid-uuid' });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('valid UUID');
    });
  });

  describe('Blueprint Retrieval', () => {
    beforeEach(async () => {
      const { getServerSession } = await import('@/lib/supabase/server');
      vi.mocked(getServerSession).mockResolvedValue({
        session: createMockSession(mockUser),
      });
    });

    it('should return 404 when blueprint is not found', async () => {
      // Arrange
      const { getSupabaseServerClientWithLogging } = await import('@/lib/supabase/server');
      const { getClientForUser } = await import('@/lib/auth/adminUtils');

      const mockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Not found' },
        }),
      };

      const mockSupabase = {
        auth: { getUser: vi.fn() },
        from: vi.fn(() => mockQueryBuilder),
      };

      vi.mocked(getSupabaseServerClientWithLogging).mockResolvedValue(mockSupabase as any);
      vi.mocked(getClientForUser).mockResolvedValue({
        client: mockSupabase as any,
        isAdmin: false,
      });

      const request = createMockRequest({ blueprintId: validBlueprintId });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Blueprint not found');
    });
  });

  describe('Questionnaire Validation', () => {
    beforeEach(async () => {
      const { getServerSession } = await import('@/lib/supabase/server');
      vi.mocked(getServerSession).mockResolvedValue({
        session: createMockSession(mockUser),
      });
    });

    it('should return 400 when static_answers is empty', async () => {
      // Arrange
      const { getSupabaseServerClientWithLogging } = await import('@/lib/supabase/server');
      const { getClientForUser } = await import('@/lib/auth/adminUtils');

      const mockBlueprint = {
        id: validBlueprintId,
        user_id: mockUserId,
        status: 'draft',
        static_answers: {}, // Empty
        dynamic_answers: { answer: 'value' },
      };

      const mockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockBlueprint,
          error: null,
        }),
      };

      const mockSupabase = {
        auth: { getUser: vi.fn() },
        from: vi.fn(() => mockQueryBuilder),
      };

      vi.mocked(getSupabaseServerClientWithLogging).mockResolvedValue(mockSupabase as any);
      vi.mocked(getClientForUser).mockResolvedValue({
        client: mockSupabase as any,
        isAdmin: false,
      });

      const request = createMockRequest({ blueprintId: validBlueprintId });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error).toContain('Static questionnaire incomplete');
    });

    it('should return 400 when dynamic_answers is empty', async () => {
      // Arrange
      const { getSupabaseServerClientWithLogging } = await import('@/lib/supabase/server');
      const { getClientForUser } = await import('@/lib/auth/adminUtils');

      const mockBlueprint = {
        id: validBlueprintId,
        user_id: mockUserId,
        status: 'draft',
        static_answers: { answer: 'value' },
        dynamic_answers: {}, // Empty
      };

      const mockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockBlueprint,
          error: null,
        }),
      };

      const mockSupabase = {
        auth: { getUser: vi.fn() },
        from: vi.fn(() => mockQueryBuilder),
      };

      vi.mocked(getSupabaseServerClientWithLogging).mockResolvedValue(mockSupabase as any);
      vi.mocked(getClientForUser).mockResolvedValue({
        client: mockSupabase as any,
        isAdmin: false,
      });

      const request = createMockRequest({ blueprintId: validBlueprintId });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error).toContain('Dynamic questionnaire incomplete');
    });
  });

  describe('Status Management', () => {
    beforeEach(async () => {
      const { getServerSession } = await import('@/lib/supabase/server');
      vi.mocked(getServerSession).mockResolvedValue({
        session: createMockSession(mockUser),
      });
    });

    it('should return cached result when blueprint status is "completed"', async () => {
      // Arrange
      const { getSupabaseServerClientWithLogging } = await import('@/lib/supabase/server');
      const { getClientForUser } = await import('@/lib/auth/adminUtils');

      const mockBlueprint = {
        id: validBlueprintId,
        user_id: mockUserId,
        status: 'completed',
        static_answers: { answer: 'value' },
        dynamic_answers: { answer: 'value' },
      };

      const mockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockBlueprint,
          error: null,
        }),
      };

      const mockSupabase = {
        auth: { getUser: vi.fn() },
        from: vi.fn(() => mockQueryBuilder),
      };

      vi.mocked(getSupabaseServerClientWithLogging).mockResolvedValue(mockSupabase as any);
      vi.mocked(getClientForUser).mockResolvedValue({
        client: mockSupabase as any,
        isAdmin: false,
      });

      const request = createMockRequest({ blueprintId: validBlueprintId });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.blueprintId).toBe(validBlueprintId);
      expect(data.metadata.model).toBe('cached');
      expect(data.metadata.duration).toBe(0);
    });
  });

  describe('Error Handling', () => {
    beforeEach(async () => {
      const { getServerSession } = await import('@/lib/supabase/server');
      vi.mocked(getServerSession).mockResolvedValue({
        session: createMockSession(mockUser),
      });
    });

    it('should return 500 when unexpected error occurs', async () => {
      // Arrange
      const { getSupabaseServerClientWithLogging } = await import('@/lib/supabase/server');
      vi.mocked(getSupabaseServerClientWithLogging).mockRejectedValue(
        new Error('Database connection failed')
      );

      const request = createMockRequest({ blueprintId: validBlueprintId });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('An unexpected error occurred');
    });
  });

  describe('API Contract', () => {
    it('should set content-type header to application/json', async () => {
      // Arrange
      const { getServerSession } = await import('@/lib/supabase/server');
      vi.mocked(getServerSession).mockResolvedValue({ session: null });

      const request = createMockRequest({ blueprintId: validBlueprintId });

      // Act
      const response = await POST(request);

      // Assert
      expect(response.headers.get('content-type')).toContain('application/json');
    });
  });
});
