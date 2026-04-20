/**
 * API Integration Tests: POST /api/generate-dynamic-questions
 *
 * Comprehensive test coverage for dynamic question generation endpoint including:
 * - Authentication & Authorization
 * - Request Validation
 * - Blueprint Retrieval & Ownership
 * - Static Answers Validation (V2.0 format)
 * - Status Management (caching, already generating)
 * - Retry Limit Management
 * - Generation Process & Database Persistence
 * - Usage Limits & Rollback
 * - Error Handling
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/generate-dynamic-questions/route';
import { NextRequest } from 'next/server';
import { mockEmailUser, createMockSession } from '@/__tests__/fixtures/auth';

// Mock dependencies
vi.mock('@/lib/supabase/server');
vi.mock('@/src/lib/services/dynamicQuestionGenerationV2');
vi.mock('@/lib/auth/adminUtils');
vi.mock('@/lib/services/blueprintUsageService');

describe('POST /api/generate-dynamic-questions', () => {
  const validBlueprintId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
  const mockUserId = 'user-123';
  const mockUser = { ...mockEmailUser, id: mockUserId };

  const mockStaticAnswersV20 = {
    section_1_role_experience: {
      current_role: 'Manager',
      years_experience: '5-10',
      team_size: '10-20',
    },
    section_2_organization: {
      organization_name: 'ACME Corp',
      industry_sector: 'Technology',
      organization_size: '500-1000',
    },
    section_3_learning_gap: {
      gap_description: 'Need to improve team leadership skills',
      current_challenges: 'Managing remote teams',
    },
  };

  const mockDynamicQuestions = [
    {
      title: 'Leadership Fundamentals',
      questions: [
        {
          id: 'q1',
          text: 'What is your leadership style?',
          type: 'multiple_choice',
          options: ['Directive', 'Participative', 'Delegative'],
        },
        {
          id: 'q2',
          text: 'How do you handle conflict?',
          type: 'text',
        },
      ],
    },
    {
      title: 'Team Management',
      questions: [
        {
          id: 'q3',
          text: 'How often do you conduct 1-on-1s?',
          type: 'single_select',
          options: ['Weekly', 'Biweekly', 'Monthly'],
        },
      ],
    },
  ];

  function createMockRequest(body: any): NextRequest {
    return {
      json: async () => body,
    } as NextRequest;
  }

  function createMockQueryBuilder(blueprintData?: any, updateError?: any) {
    return {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: blueprintData || null,
        error: blueprintData ? null : { message: 'Not found' },
      }),
      update: vi.fn().mockReturnThis(),
    };
  }

  beforeEach(() => {
    vi.clearAllMocks();

    // Clear console mocks
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
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
      expect(data).toEqual({ error: 'Unauthorized' });
    });

    it('should return 401 when session has no user ID', async () => {
      // Arrange
      const { getServerSession } = await import('@/lib/supabase/server');
      vi.mocked(getServerSession).mockResolvedValue({
        session: { user: { id: null } } as any,
      });

      const request = createMockRequest({ blueprintId: validBlueprintId });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data).toEqual({ error: 'Unauthorized' });
    });

    it('should proceed when user is authenticated', async () => {
      // Arrange
      const { getServerSession, getSupabaseServerClientWithLogging } = await import(
        '@/lib/supabase/server'
      );
      const { getClientForUser } = await import('@/lib/auth/adminUtils');

      vi.mocked(getServerSession).mockResolvedValue({
        session: createMockSession(mockUser),
      });

      const mockQueryBuilder = createMockQueryBuilder();
      const mockSupabase = {
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

      // Assert
      expect(response.status).not.toBe(401);
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
      expect(data.error).toBe('Invalid request data');
    });

    it('should return 400 when blueprintId is not a valid UUID', async () => {
      // Arrange
      const request = createMockRequest({ blueprintId: 'invalid-uuid' });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid request data');
    });

    it('should accept valid UUID format', async () => {
      // Arrange
      const { getSupabaseServerClientWithLogging } = await import('@/lib/supabase/server');
      const { getClientForUser } = await import('@/lib/auth/adminUtils');

      const mockQueryBuilder = createMockQueryBuilder();
      const mockSupabase = {
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

      // Assert
      expect(response.status).not.toBe(400);
    });
  });

  describe('Blueprint Retrieval & Ownership', () => {
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

      const mockQueryBuilder = createMockQueryBuilder(null);
      const mockSupabase = {
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
      expect(data.error).toBe('Blueprint not found');
    });

    it('should allow admin to access any blueprint', async () => {
      // Arrange
      const { getServerSession, getSupabaseServerClientWithLogging } = await import(
        '@/lib/supabase/server'
      );
      const { getClientForUser } = await import('@/lib/auth/adminUtils');

      vi.mocked(getServerSession).mockResolvedValue({
        session: createMockSession(mockUser),
      });

      const otherUserBlueprint = {
        id: validBlueprintId,
        user_id: 'other-user-456',
        static_answers: mockStaticAnswersV20,
        status: 'draft',
        dynamic_questions: mockDynamicQuestions,
      };

      const mockQueryBuilder = createMockQueryBuilder(otherUserBlueprint);
      const mockSupabase = {
        from: vi.fn(() => mockQueryBuilder),
      };

      vi.mocked(getSupabaseServerClientWithLogging).mockResolvedValue(mockSupabase as any);
      vi.mocked(getClientForUser).mockResolvedValue({
        client: mockSupabase as any,
        isAdmin: true,
      });

      const request = createMockRequest({ blueprintId: validBlueprintId });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toContain('already exist');
    });
  });

  describe('Static Answers Validation', () => {
    beforeEach(async () => {
      const { getServerSession } = await import('@/lib/supabase/server');
      vi.mocked(getServerSession).mockResolvedValue({
        session: createMockSession(mockUser),
      });
    });

    it('should return 400 when static_answers is null', async () => {
      // Arrange
      const { getSupabaseServerClientWithLogging } = await import('@/lib/supabase/server');
      const { getClientForUser } = await import('@/lib/auth/adminUtils');

      const blueprint = {
        id: validBlueprintId,
        user_id: mockUserId,
        static_answers: null,
        status: 'draft',
      };

      const mockQueryBuilder = createMockQueryBuilder(blueprint);
      const mockSupabase = {
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
      expect(data.error).toContain('No static answers found');
    });

    it('should return 400 when static_answers is empty object', async () => {
      // Arrange
      const { getSupabaseServerClientWithLogging } = await import('@/lib/supabase/server');
      const { getClientForUser } = await import('@/lib/auth/adminUtils');

      const blueprint = {
        id: validBlueprintId,
        user_id: mockUserId,
        static_answers: {},
        status: 'draft',
      };

      const mockQueryBuilder = createMockQueryBuilder(blueprint);
      const mockSupabase = {
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
      expect(data.error).toContain('Static answers are empty');
    });

    it('should return 400 when static_answers is not V2.0 format (missing sections)', async () => {
      // Arrange
      const { getSupabaseServerClientWithLogging } = await import('@/lib/supabase/server');
      const { getClientForUser } = await import('@/lib/auth/adminUtils');

      const blueprint = {
        id: validBlueprintId,
        user_id: mockUserId,
        static_answers: {
          // Legacy format
          organization: 'ACME Corp',
          role: 'Manager',
          industry: 'Tech',
        },
        status: 'draft',
      };

      const mockQueryBuilder = createMockQueryBuilder(blueprint);
      const mockSupabase = {
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
      expect(data.error).toContain('Invalid static answers format');
      expect(data.details).toContain('3-section structure');
    });

    it('should accept valid V2.0 format', async () => {
      // Arrange
      const { getSupabaseServerClientWithLogging } = await import('@/lib/supabase/server');
      const { getClientForUser } = await import('@/lib/auth/adminUtils');
      const { generateDynamicQuestionsV2 } = await import(
        '@/src/lib/services/dynamicQuestionGenerationV2'
      );
      const { BlueprintUsageService } = await import('@/lib/services/blueprintUsageService');

      const blueprint = {
        id: validBlueprintId,
        user_id: mockUserId,
        static_answers: mockStaticAnswersV20,
        status: 'draft',
        dynamic_questions: null,
      };

      const mockQueryBuilder = createMockQueryBuilder(blueprint);
      const mockSupabase = {
        from: vi.fn(() => mockQueryBuilder),
      };

      vi.mocked(getSupabaseServerClientWithLogging).mockResolvedValue(mockSupabase as any);
      vi.mocked(getClientForUser).mockResolvedValue({
        client: mockSupabase as any,
        isAdmin: false,
      });

      vi.mocked(generateDynamicQuestionsV2).mockResolvedValue({
        sections: mockDynamicQuestions,
        metadata: { model: 'claude-sonnet-4-5' },
      } as any);

      vi.mocked(BlueprintUsageService.canCreateBlueprint).mockResolvedValue({
        canCreate: true,
      });

      const request = createMockRequest({ blueprintId: validBlueprintId });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });

  describe('Status Management', () => {
    beforeEach(async () => {
      const { getServerSession } = await import('@/lib/supabase/server');
      vi.mocked(getServerSession).mockResolvedValue({
        session: createMockSession(mockUser),
      });
    });

    it('should return success when status is "generating"', async () => {
      // Arrange
      const { getSupabaseServerClientWithLogging } = await import('@/lib/supabase/server');
      const { getClientForUser } = await import('@/lib/auth/adminUtils');

      const blueprint = {
        id: validBlueprintId,
        user_id: mockUserId,
        static_answers: mockStaticAnswersV20,
        status: 'generating',
      };

      const mockQueryBuilder = createMockQueryBuilder(blueprint);
      const mockSupabase = {
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
      expect(data.message).toBe('Already generating');
    });

    it('should return cached questions when dynamic_questions already exist', async () => {
      // Arrange
      const { getSupabaseServerClientWithLogging } = await import('@/lib/supabase/server');
      const { getClientForUser } = await import('@/lib/auth/adminUtils');

      const blueprint = {
        id: validBlueprintId,
        user_id: mockUserId,
        static_answers: mockStaticAnswersV20,
        status: 'draft',
        dynamic_questions: mockDynamicQuestions,
      };

      const mockQueryBuilder = createMockQueryBuilder(blueprint);
      const mockSupabase = {
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
      expect(data.message).toContain('already exist');
      expect(data.dynamicQuestions).toEqual(mockDynamicQuestions);
    });
  });

  describe('Retry Limit Management', () => {
    beforeEach(async () => {
      const { getServerSession } = await import('@/lib/supabase/server');
      vi.mocked(getServerSession).mockResolvedValue({
        session: createMockSession(mockUser),
      });
    });

    it('should return 429 when max retry attempts (3) reached', async () => {
      // Arrange
      const { getSupabaseServerClientWithLogging } = await import('@/lib/supabase/server');
      const { getClientForUser } = await import('@/lib/auth/adminUtils');

      const blueprint = {
        id: validBlueprintId,
        user_id: mockUserId,
        static_answers: mockStaticAnswersV20,
        status: 'draft',
        dynamic_questions: null,
        dynamic_questions_metadata: {
          retryAttempt: 3, // Max reached
        },
      };

      const mockQueryBuilder = createMockQueryBuilder(blueprint);
      const mockSupabase = {
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
      expect(response.status).toBe(429);
      expect(data.error).toContain('Maximum retry attempts');
      expect(data.canRetry).toBe(false);
    });

    it('should allow retry when under max attempts', async () => {
      // Arrange
      const { getSupabaseServerClientWithLogging } = await import('@/lib/supabase/server');
      const { getClientForUser } = await import('@/lib/auth/adminUtils');
      const { generateDynamicQuestionsV2 } = await import(
        '@/src/lib/services/dynamicQuestionGenerationV2'
      );
      const { BlueprintUsageService } = await import('@/lib/services/blueprintUsageService');

      const blueprint = {
        id: validBlueprintId,
        user_id: mockUserId,
        static_answers: mockStaticAnswersV20,
        status: 'draft',
        dynamic_questions: null,
        dynamic_questions_metadata: {
          retryAttempt: 1, // Under max
        },
      };

      const mockQueryBuilder = createMockQueryBuilder(blueprint);
      const mockSupabase = {
        from: vi.fn(() => mockQueryBuilder),
      };

      vi.mocked(getSupabaseServerClientWithLogging).mockResolvedValue(mockSupabase as any);
      vi.mocked(getClientForUser).mockResolvedValue({
        client: mockSupabase as any,
        isAdmin: false,
      });

      vi.mocked(generateDynamicQuestionsV2).mockResolvedValue({
        sections: mockDynamicQuestions,
        metadata: {},
      } as any);

      vi.mocked(BlueprintUsageService.canCreateBlueprint).mockResolvedValue({
        canCreate: true,
      });

      const request = createMockRequest({ blueprintId: validBlueprintId });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });

  describe('Generation Process & Database Persistence', () => {
    beforeEach(async () => {
      const { getServerSession } = await import('@/lib/supabase/server');
      vi.mocked(getServerSession).mockResolvedValue({
        session: createMockSession(mockUser),
      });
    });

    it('should generate and save dynamic questions successfully', async () => {
      // Arrange
      const { getSupabaseServerClientWithLogging } = await import('@/lib/supabase/server');
      const { getClientForUser } = await import('@/lib/auth/adminUtils');
      const { generateDynamicQuestionsV2 } = await import(
        '@/src/lib/services/dynamicQuestionGenerationV2'
      );
      const { BlueprintUsageService } = await import('@/lib/services/blueprintUsageService');

      const blueprint = {
        id: validBlueprintId,
        user_id: mockUserId,
        static_answers: mockStaticAnswersV20,
        status: 'draft',
        dynamic_questions: null,
      };

      const mockQueryBuilder = createMockQueryBuilder(blueprint);
      const mockSupabase = {
        from: vi.fn(() => mockQueryBuilder),
      };

      vi.mocked(getSupabaseServerClientWithLogging).mockResolvedValue(mockSupabase as any);
      vi.mocked(getClientForUser).mockResolvedValue({
        client: mockSupabase as any,
        isAdmin: false,
      });

      vi.mocked(generateDynamicQuestionsV2).mockResolvedValue({
        sections: mockDynamicQuestions,
        metadata: { model: 'claude-sonnet-4-5', duration: 3000 },
      } as any);

      vi.mocked(BlueprintUsageService.canCreateBlueprint).mockResolvedValue({
        canCreate: true,
      });

      const request = createMockRequest({ blueprintId: validBlueprintId });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.dynamicQuestions).toEqual(mockDynamicQuestions);
      expect(data.message).toContain('successfully');
      expect(data.metadata.preservedOriginal).toBe(true);
    });

    it('should preserve exact AI-generated structure without transformation', async () => {
      // Arrange
      const { getSupabaseServerClientWithLogging } = await import('@/lib/supabase/server');
      const { getClientForUser } = await import('@/lib/auth/adminUtils');
      const { generateDynamicQuestionsV2 } = await import(
        '@/src/lib/services/dynamicQuestionGenerationV2'
      );
      const { BlueprintUsageService } = await import('@/lib/services/blueprintUsageService');

      const blueprint = {
        id: validBlueprintId,
        user_id: mockUserId,
        static_answers: mockStaticAnswersV20,
        status: 'draft',
      };

      const mockQueryBuilder = createMockQueryBuilder(blueprint);
      const mockSupabase = {
        from: vi.fn(() => mockQueryBuilder),
      };

      vi.mocked(getSupabaseServerClientWithLogging).mockResolvedValue(mockSupabase as any);
      vi.mocked(getClientForUser).mockResolvedValue({
        client: mockSupabase as any,
        isAdmin: false,
      });

      const aiGeneratedStructure = [
        {
          customField: 'preserved',
          questions: [{ customQuestionField: 'also preserved' }],
        },
      ];

      vi.mocked(generateDynamicQuestionsV2).mockResolvedValue({
        sections: aiGeneratedStructure,
        metadata: {},
      } as any);

      vi.mocked(BlueprintUsageService.canCreateBlueprint).mockResolvedValue({
        canCreate: true,
      });

      const request = createMockRequest({ blueprintId: validBlueprintId });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(data.dynamicQuestions).toEqual(aiGeneratedStructure);
      expect(data.metadata.preservedOriginal).toBe(true);
    });

    it('should reset retry counter to 0 on successful generation', async () => {
      // Arrange
      const { getSupabaseServerClientWithLogging } = await import('@/lib/supabase/server');
      const { getClientForUser } = await import('@/lib/auth/adminUtils');
      const { generateDynamicQuestionsV2 } = await import(
        '@/src/lib/services/dynamicQuestionGenerationV2'
      );
      const { BlueprintUsageService } = await import('@/lib/services/blueprintUsageService');

      const blueprint = {
        id: validBlueprintId,
        user_id: mockUserId,
        static_answers: mockStaticAnswersV20,
        status: 'draft',
        dynamic_questions_metadata: {
          retryAttempt: 2, // Had previous failures
        },
      };

      const mockUpdateQuery = {
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: blueprint, error: null }),
      };

      const mockQueryBuilder = {
        ...createMockQueryBuilder(blueprint),
        update: vi.fn().mockReturnValue(mockUpdateQuery),
      };

      const mockSupabase = {
        from: vi.fn(() => mockQueryBuilder),
      };

      vi.mocked(getSupabaseServerClientWithLogging).mockResolvedValue(mockSupabase as any);
      vi.mocked(getClientForUser).mockResolvedValue({
        client: mockSupabase as any,
        isAdmin: false,
      });

      vi.mocked(generateDynamicQuestionsV2).mockResolvedValue({
        sections: mockDynamicQuestions,
        metadata: {},
      } as any);

      vi.mocked(BlueprintUsageService.canCreateBlueprint).mockResolvedValue({
        canCreate: true,
      });

      const request = createMockRequest({ blueprintId: validBlueprintId });

      // Act
      await POST(request);

      // Assert
      expect(mockQueryBuilder.update).toHaveBeenCalledWith(
        expect.objectContaining({
          dynamic_questions_metadata: expect.objectContaining({
            retryAttempt: 0, // Should be reset
          }),
        })
      );
    });
  });

  describe('Usage Limits & Rollback', () => {
    beforeEach(async () => {
      const { getServerSession } = await import('@/lib/supabase/server');
      vi.mocked(getServerSession).mockResolvedValue({
        session: createMockSession(mockUser),
      });
    });

    it('should return 429 when usage limit exceeded (non-admin)', async () => {
      // Arrange
      const { getSupabaseServerClientWithLogging } = await import('@/lib/supabase/server');
      const { getClientForUser } = await import('@/lib/auth/adminUtils');
      const { generateDynamicQuestionsV2 } = await import(
        '@/src/lib/services/dynamicQuestionGenerationV2'
      );
      const { BlueprintUsageService } = await import('@/lib/services/blueprintUsageService');

      const blueprint = {
        id: validBlueprintId,
        user_id: mockUserId,
        static_answers: mockStaticAnswersV20,
        status: 'draft',
      };

      const mockQueryBuilder = createMockQueryBuilder(blueprint);
      const mockSupabase = {
        from: vi.fn(() => mockQueryBuilder),
      };

      vi.mocked(getSupabaseServerClientWithLogging).mockResolvedValue(mockSupabase as any);
      vi.mocked(getClientForUser).mockResolvedValue({
        client: mockSupabase as any,
        isAdmin: false,
      });

      vi.mocked(generateDynamicQuestionsV2).mockResolvedValue({
        sections: mockDynamicQuestions,
        metadata: {},
      } as any);

      vi.mocked(BlueprintUsageService.canCreateBlueprint).mockResolvedValue({
        canCreate: false,
        reason: 'You have reached your monthly blueprint creation limit',
      });

      const request = createMockRequest({ blueprintId: validBlueprintId });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(429);
      expect(data.error).toContain('Blueprint creation limit exceeded');
      expect(data.upgradeUrl).toBe('/pricing');
    });

    it('should rollback database changes when usage limit exceeded', async () => {
      // Arrange
      const { getSupabaseServerClientWithLogging } = await import('@/lib/supabase/server');
      const { getClientForUser } = await import('@/lib/auth/adminUtils');
      const { generateDynamicQuestionsV2 } = await import(
        '@/src/lib/services/dynamicQuestionGenerationV2'
      );
      const { BlueprintUsageService } = await import('@/lib/services/blueprintUsageService');

      const blueprint = {
        id: validBlueprintId,
        user_id: mockUserId,
        static_answers: mockStaticAnswersV20,
        status: 'draft',
      };

      const mockUpdateQuery = {
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: blueprint, error: null }),
      };

      const mockQueryBuilder = {
        ...createMockQueryBuilder(blueprint),
        update: vi.fn().mockReturnValue(mockUpdateQuery),
      };

      const mockSupabase = {
        from: vi.fn(() => mockQueryBuilder),
      };

      vi.mocked(getSupabaseServerClientWithLogging).mockResolvedValue(mockSupabase as any);
      vi.mocked(getClientForUser).mockResolvedValue({
        client: mockSupabase as any,
        isAdmin: false,
      });

      vi.mocked(generateDynamicQuestionsV2).mockResolvedValue({
        sections: mockDynamicQuestions,
        metadata: {},
      } as any);

      vi.mocked(BlueprintUsageService.canCreateBlueprint).mockResolvedValue({
        canCreate: false,
        reason: 'Limit exceeded',
      });

      const request = createMockRequest({ blueprintId: validBlueprintId });

      // Act
      await POST(request);

      // Assert - should have called update twice (initial save + rollback)
      expect(mockQueryBuilder.update).toHaveBeenCalledWith(
        expect.objectContaining({
          dynamic_questions: null,
          dynamic_questions_raw: null,
          dynamic_questions_metadata: expect.objectContaining({
            rollback: true,
          }),
        })
      );
    });

    it('should bypass usage limits for admin users', async () => {
      // Arrange
      const { getSupabaseServerClientWithLogging } = await import('@/lib/supabase/server');
      const { getClientForUser } = await import('@/lib/auth/adminUtils');
      const { generateDynamicQuestionsV2 } = await import(
        '@/src/lib/services/dynamicQuestionGenerationV2'
      );
      const { BlueprintUsageService } = await import('@/lib/services/blueprintUsageService');

      const blueprint = {
        id: validBlueprintId,
        user_id: 'other-user-456',
        static_answers: mockStaticAnswersV20,
        status: 'draft',
      };

      const mockQueryBuilder = createMockQueryBuilder(blueprint);
      const mockSupabase = {
        from: vi.fn(() => mockQueryBuilder),
      };

      vi.mocked(getSupabaseServerClientWithLogging).mockResolvedValue(mockSupabase as any);
      vi.mocked(getClientForUser).mockResolvedValue({
        client: mockSupabase as any,
        isAdmin: true, // Admin user
      });

      vi.mocked(generateDynamicQuestionsV2).mockResolvedValue({
        sections: mockDynamicQuestions,
        metadata: {},
      } as any);

      vi.mocked(BlueprintUsageService.canCreateBlueprint).mockResolvedValue({
        canCreate: false, // Would normally fail
        reason: 'Limit exceeded',
      });

      const request = createMockRequest({ blueprintId: validBlueprintId });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert: Admin should bypass limit
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });

  describe('Error Handling', () => {
    beforeEach(async () => {
      const { getServerSession } = await import('@/lib/supabase/server');
      vi.mocked(getServerSession).mockResolvedValue({
        session: createMockSession(mockUser),
      });
    });

    it('should return 502 when generation fails and increment retry counter', async () => {
      // Arrange
      const { getSupabaseServerClientWithLogging } = await import('@/lib/supabase/server');
      const { getClientForUser } = await import('@/lib/auth/adminUtils');
      const { generateDynamicQuestionsV2 } = await import(
        '@/src/lib/services/dynamicQuestionGenerationV2'
      );

      const blueprint = {
        id: validBlueprintId,
        user_id: mockUserId,
        static_answers: mockStaticAnswersV20,
        status: 'draft',
        dynamic_questions_metadata: {
          retryAttempt: 0,
        },
      };

      const mockUpdateQuery = {
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      };

      const mockQueryBuilder = {
        ...createMockQueryBuilder(blueprint),
        update: vi.fn().mockReturnValue(mockUpdateQuery),
      };

      const mockSupabase = {
        from: vi.fn(() => mockQueryBuilder),
      };

      vi.mocked(getSupabaseServerClientWithLogging).mockResolvedValue(mockSupabase as any);
      vi.mocked(getClientForUser).mockResolvedValue({
        client: mockSupabase as any,
        isAdmin: false,
      });

      vi.mocked(generateDynamicQuestionsV2).mockRejectedValue(new Error('Claude API timeout'));

      const request = createMockRequest({ blueprintId: validBlueprintId });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(502);
      expect(data.error).toContain('Failed to generate dynamic questions');
      expect(data.canRetry).toBe(true);
      expect(data.attemptsRemaining).toBe(2);

      // Verify retry counter incremented
      expect(mockQueryBuilder.update).toHaveBeenCalledWith(
        expect.objectContaining({
          dynamic_questions_metadata: expect.objectContaining({
            retryAttempt: 1,
          }),
        })
      );
    });

    it('should return 500 when database save fails', async () => {
      // Arrange
      const { getSupabaseServerClientWithLogging } = await import('@/lib/supabase/server');
      const { getClientForUser } = await import('@/lib/auth/adminUtils');
      const { generateDynamicQuestionsV2 } = await import(
        '@/src/lib/services/dynamicQuestionGenerationV2'
      );
      const { BlueprintUsageService } = await import('@/lib/services/blueprintUsageService');

      const blueprint = {
        id: validBlueprintId,
        user_id: mockUserId,
        static_answers: mockStaticAnswersV20,
        status: 'draft',
      };

      const mockUpdateQuery = {
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database write failed' },
        }),
      };

      const mockQueryBuilder = {
        ...createMockQueryBuilder(blueprint),
        update: vi.fn().mockReturnValue(mockUpdateQuery),
      };

      const mockSupabase = {
        from: vi.fn(() => mockQueryBuilder),
      };

      vi.mocked(getSupabaseServerClientWithLogging).mockResolvedValue(mockSupabase as any);
      vi.mocked(getClientForUser).mockResolvedValue({
        client: mockSupabase as any,
        isAdmin: false,
      });

      vi.mocked(generateDynamicQuestionsV2).mockResolvedValue({
        sections: mockDynamicQuestions,
        metadata: {},
      } as any);

      vi.mocked(BlueprintUsageService.canCreateBlueprint).mockResolvedValue({
        canCreate: true,
      });

      const request = createMockRequest({ blueprintId: validBlueprintId });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to save dynamic questions');
    });

    it('should return 500 when unexpected error occurs', async () => {
      // Arrange
      const { getServerSession } = await import('@/lib/supabase/server');
      const { getSupabaseServerClientWithLogging } = await import('@/lib/supabase/server');

      vi.mocked(getServerSession).mockResolvedValue({
        session: createMockSession(mockUser),
      });

      vi.mocked(getSupabaseServerClientWithLogging).mockRejectedValue(
        new Error('Unexpected database error')
      );

      const request = createMockRequest({ blueprintId: validBlueprintId });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });
  });
});
