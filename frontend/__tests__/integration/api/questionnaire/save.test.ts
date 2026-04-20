/**
 * API Integration Tests: POST /api/questionnaire/save
 *
 * Comprehensive test coverage for the questionnaire save endpoint:
 * - Authentication & authorization
 * - Request validation
 * - Blueprint creation (new questionnaires)
 * - Blueprint updates (existing questionnaires)
 * - Usage limit enforcement
 * - Fallback creation when blueprint not found
 * - Error handling
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST, GET } from '@/app/api/questionnaire/save/route';
import { NextRequest } from 'next/server';
import { mockEmailUser, createMockSession } from '@/__tests__/fixtures/auth';

// Mock all dependencies
vi.mock('@/lib/supabase/server');
vi.mock('@/lib/services/blueprintUsageService');
vi.mock('@/lib/logging', () => ({
  createServiceLogger: vi.fn(() => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  })),
}));

describe('GET /api/questionnaire/save - Health Check', () => {
  it('should return health check status', async () => {
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe('ok');
    expect(data.message).toBe('Questionnaire save API is running');
    expect(data.timestamp).toBeDefined();
  });
});

describe('POST /api/questionnaire/save', () => {
  const mockUserId = 'user-123';
  const mockUser = { ...mockEmailUser, id: mockUserId };
  const mockStaticAnswers = {
    organization: 'ACME Corp',
    role: 'Manager',
    experience: '5 years',
  };
  const validBlueprintId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

  function createMockRequest(body: any): NextRequest {
    return {
      json: async () => body,
    } as NextRequest;
  }

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================================================
  // AUTHENTICATION TESTS
  // ============================================================================

  describe('Authentication', () => {
    it('should return 401 when user is not authenticated', async () => {
      // Arrange
      const { getServerSession } = await import('@/lib/supabase/server');
      vi.mocked(getServerSession).mockResolvedValue({ session: null });

      const request = createMockRequest({
        staticAnswers: mockStaticAnswers,
      });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data).toEqual({ error: 'Unauthorized' });
    });
  });

  // ============================================================================
  // REQUEST VALIDATION TESTS
  // ============================================================================

  describe('Request Validation', () => {
    beforeEach(async () => {
      const { getServerSession } = await import('@/lib/supabase/server');
      vi.mocked(getServerSession).mockResolvedValue({
        session: createMockSession(mockUser),
      });
    });

    it('should return 400 when staticAnswers is missing', async () => {
      // Arrange
      const request = createMockRequest({});

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('staticAnswers is required');
    });

    it('should return 400 when request body is null', async () => {
      // Arrange
      const request = {
        json: async () => null,
      } as NextRequest;

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('staticAnswers is required');
    });
  });

  // ============================================================================
  // BLUEPRINT CREATION TESTS (No blueprintId provided)
  // ============================================================================

  describe('Blueprint Creation (New Questionnaire)', () => {
    beforeEach(async () => {
      const { getServerSession } = await import('@/lib/supabase/server');
      vi.mocked(getServerSession).mockResolvedValue({
        session: createMockSession(mockUser),
      });
    });

    it('should create new blueprint when no blueprintId provided', async () => {
      // Arrange
      const { getSupabaseServerClient } = await import('@/lib/supabase/server');
      const { BlueprintUsageService } = await import('@/lib/services/blueprintUsageService');

      const newBlueprintId = 'new-blueprint-id-123';

      const mockInsertQuery = {
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: newBlueprintId },
          error: null,
        }),
      };

      const mockSupabase = {
        from: vi.fn(() => ({
          insert: vi.fn(() => mockInsertQuery),
        })),
      };

      vi.mocked(getSupabaseServerClient).mockResolvedValue(mockSupabase as any);
      vi.mocked(BlueprintUsageService.canCreateBlueprint).mockResolvedValue({
        canCreate: true,
      });

      const request = createMockRequest({
        staticAnswers: mockStaticAnswers,
      });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.blueprintId).toBe(newBlueprintId);
      expect(data.message).toBe('Questionnaire saved');

      expect(BlueprintUsageService.canCreateBlueprint).toHaveBeenCalledWith(
        mockSupabase,
        mockUserId
      );
      expect(mockSupabase.from).toHaveBeenCalledWith('blueprint_generator');
    });

    it('should return 429 when blueprint creation limit exceeded', async () => {
      // Arrange
      const { getSupabaseServerClient } = await import('@/lib/supabase/server');
      const { BlueprintUsageService } = await import('@/lib/services/blueprintUsageService');

      const mockSupabase = {
        from: vi.fn(),
      };

      vi.mocked(getSupabaseServerClient).mockResolvedValue(mockSupabase as any);
      vi.mocked(BlueprintUsageService.canCreateBlueprint).mockResolvedValue({
        canCreate: false,
        reason: 'Blueprint creation limit exceeded',
      });

      const request = createMockRequest({
        staticAnswers: mockStaticAnswers,
      });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(429);
      expect(data.success).toBe(false);
      expect(data.limitExceeded).toBe(true);
      expect(data.error).toContain('Blueprint creation limit exceeded');
    });

    it('should continue creation if usage limit check fails', async () => {
      // Arrange
      const { getSupabaseServerClient } = await import('@/lib/supabase/server');
      const { BlueprintUsageService } = await import('@/lib/services/blueprintUsageService');

      const newBlueprintId = 'fallback-blueprint-id';

      const mockInsertQuery = {
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: newBlueprintId },
          error: null,
        }),
      };

      const mockSupabase = {
        from: vi.fn(() => ({
          insert: vi.fn(() => mockInsertQuery),
        })),
      };

      vi.mocked(getSupabaseServerClient).mockResolvedValue(mockSupabase as any);
      vi.mocked(BlueprintUsageService.canCreateBlueprint).mockRejectedValue(
        new Error('Limit check failed')
      );

      const request = createMockRequest({
        staticAnswers: mockStaticAnswers,
      });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.blueprintId).toBe(newBlueprintId);
    });

    it('should return 500 when database insert fails', async () => {
      // Arrange
      const { getSupabaseServerClient } = await import('@/lib/supabase/server');
      const { BlueprintUsageService } = await import('@/lib/services/blueprintUsageService');

      const mockInsertQuery = {
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database insert error' },
        }),
      };

      const mockSupabase = {
        from: vi.fn(() => ({
          insert: vi.fn(() => mockInsertQuery),
        })),
      };

      vi.mocked(getSupabaseServerClient).mockResolvedValue(mockSupabase as any);
      vi.mocked(BlueprintUsageService.canCreateBlueprint).mockResolvedValue({
        canCreate: true,
      });

      const request = createMockRequest({
        staticAnswers: mockStaticAnswers,
      });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Failed to create questionnaire record');
    });
  });

  // ============================================================================
  // BLUEPRINT UPDATE TESTS (blueprintId provided)
  // ============================================================================

  describe('Blueprint Update (Existing Questionnaire)', () => {
    beforeEach(async () => {
      const { getServerSession } = await import('@/lib/supabase/server');
      vi.mocked(getServerSession).mockResolvedValue({
        session: createMockSession(mockUser),
      });
    });

    it('should update existing blueprint when valid blueprintId provided', async () => {
      // Arrange
      const { getSupabaseServerClient } = await import('@/lib/supabase/server');

      const mockUpdateQuery = {
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockResolvedValue({
          data: null,
          error: null,
          count: 1,
        }),
      };

      const mockSupabase = {
        from: vi.fn(() => ({
          update: vi.fn(() => mockUpdateQuery),
        })),
      };

      vi.mocked(getSupabaseServerClient).mockResolvedValue(mockSupabase as any);

      const request = createMockRequest({
        staticAnswers: mockStaticAnswers,
        blueprintId: validBlueprintId,
      });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.blueprintId).toBe(validBlueprintId);
      expect(data.message).toBe('Questionnaire updated');

      expect(mockUpdateQuery.eq).toHaveBeenCalledWith('id', validBlueprintId);
      expect(mockUpdateQuery.eq).toHaveBeenCalledWith('user_id', mockUserId);
    });

    it('should return 500 when database update fails', async () => {
      // Arrange
      const { getSupabaseServerClient } = await import('@/lib/supabase/server');

      const mockUpdateQuery = {
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database update error' },
          count: null,
        }),
      };

      const mockSupabase = {
        from: vi.fn(() => ({
          update: vi.fn(() => mockUpdateQuery),
        })),
      };

      vi.mocked(getSupabaseServerClient).mockResolvedValue(mockSupabase as any);

      const request = createMockRequest({
        staticAnswers: mockStaticAnswers,
        blueprintId: validBlueprintId,
      });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Failed to update questionnaire record');
    });
  });

  // ============================================================================
  // FALLBACK CREATION TESTS (Blueprint not found)
  // ============================================================================

  describe('Fallback Creation (Blueprint Not Found)', () => {
    beforeEach(async () => {
      const { getServerSession } = await import('@/lib/supabase/server');
      vi.mocked(getServerSession).mockResolvedValue({
        session: createMockSession(mockUser),
      });
    });

    it('should create new blueprint when update finds no rows (blueprint not found)', async () => {
      // Arrange
      const { getSupabaseServerClient } = await import('@/lib/supabase/server');
      const { BlueprintUsageService } = await import('@/lib/services/blueprintUsageService');

      const newBlueprintId = 'new-fallback-id-456';

      const mockUpdateQuery = {
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockResolvedValue({
          data: null,
          error: null,
          count: 0, // No rows affected
        }),
      };

      const mockInsertQuery = {
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: newBlueprintId },
          error: null,
        }),
      };

      const mockSupabase = {
        from: vi.fn((table) => {
          if (table === 'blueprint_generator') {
            return {
              update: vi.fn(() => mockUpdateQuery),
              insert: vi.fn(() => mockInsertQuery),
            };
          }
        }),
      };

      vi.mocked(getSupabaseServerClient).mockResolvedValue(mockSupabase as any);
      vi.mocked(BlueprintUsageService.canCreateBlueprint).mockResolvedValue({
        canCreate: true,
      });

      const request = createMockRequest({
        staticAnswers: mockStaticAnswers,
        blueprintId: validBlueprintId,
      });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.blueprintId).toBe(newBlueprintId);
      expect(data.message).toBe('Questionnaire saved');
    });

    it('should return 429 when fallback creation hits limit', async () => {
      // Arrange
      const { getSupabaseServerClient } = await import('@/lib/supabase/server');
      const { BlueprintUsageService } = await import('@/lib/services/blueprintUsageService');

      const mockUpdateQuery = {
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockResolvedValue({
          data: null,
          error: null,
          count: 0,
        }),
      };

      const mockSupabase = {
        from: vi.fn(() => ({
          update: vi.fn(() => mockUpdateQuery),
        })),
      };

      vi.mocked(getSupabaseServerClient).mockResolvedValue(mockSupabase as any);
      vi.mocked(BlueprintUsageService.canCreateBlueprint).mockResolvedValue({
        canCreate: false,
        reason: 'Blueprint creation limit exceeded',
      });

      const request = createMockRequest({
        staticAnswers: mockStaticAnswers,
        blueprintId: validBlueprintId,
      });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(429);
      expect(data.success).toBe(false);
      expect(data.limitExceeded).toBe(true);
      expect(data.error).toContain('Blueprint creation limit exceeded');
    });

    it('should return 500 when fallback insert fails', async () => {
      // Arrange
      const { getSupabaseServerClient } = await import('@/lib/supabase/server');
      const { BlueprintUsageService } = await import('@/lib/services/blueprintUsageService');

      const mockUpdateQuery = {
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockResolvedValue({
          data: null,
          error: null,
          count: 0,
        }),
      };

      const mockInsertQuery = {
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Insert failed' },
        }),
      };

      const mockSupabase = {
        from: vi.fn(() => ({
          update: vi.fn(() => mockUpdateQuery),
          insert: vi.fn(() => mockInsertQuery),
        })),
      };

      vi.mocked(getSupabaseServerClient).mockResolvedValue(mockSupabase as any);
      vi.mocked(BlueprintUsageService.canCreateBlueprint).mockResolvedValue({
        canCreate: true,
      });

      const request = createMockRequest({
        staticAnswers: mockStaticAnswers,
        blueprintId: validBlueprintId,
      });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toContain(
        'Failed to create questionnaire record after blueprint not found'
      );
    });
  });

  // ============================================================================
  // ERROR HANDLING TESTS
  // ============================================================================

  describe('Error Handling', () => {
    beforeEach(async () => {
      const { getServerSession } = await import('@/lib/supabase/server');
      vi.mocked(getServerSession).mockResolvedValue({
        session: createMockSession(mockUser),
      });
    });

    it('should return 500 when unexpected error occurs', async () => {
      // Arrange
      const { getSupabaseServerClient } = await import('@/lib/supabase/server');
      vi.mocked(getSupabaseServerClient).mockRejectedValue(
        new Error('Unexpected database connection failure')
      );

      const request = createMockRequest({
        staticAnswers: mockStaticAnswers,
      });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('An unexpected error occurred');
    });

    it('should handle JSON parsing errors gracefully', async () => {
      // Arrange
      const request = {
        json: async () => {
          throw new Error('Invalid JSON');
        },
      } as NextRequest;

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('An unexpected error occurred');
    });
  });
});
