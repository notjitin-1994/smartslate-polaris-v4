/**
 * API Integration Tests: POST /api/dynamic-answers/submit
 *
 * Core test coverage for dynamic answers final submission endpoint focusing on:
 * - Authentication & Authorization
 * - Request Validation (UUID, answers format)
 * - Blueprint Ownership Verification
 * - Dynamic Questions Existence Check
 * - Answer Validation (comprehensive)
 * - Answer Sanitization
 * - Database Save Operation
 * - Error Handling
 *
 * Note: Due to complex validation logic and extensive error handling,
 * this test suite focuses on essential happy paths and critical error scenarios.
 * Full validation testing is covered in unit tests for validateCompleteAnswers.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/dynamic-answers/submit/route';
import { NextRequest } from 'next/server';
import { mockEmailUser } from '@/__tests__/fixtures/auth';

// Mock dependencies
vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(),
}));

vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}));

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

vi.mock('@/lib/validation/dynamicQuestionSchemas', () => ({
  validateCompleteAnswers: vi.fn(),
}));

describe('POST /api/dynamic-answers/submit - Final Submission', () => {
  const mockBlueprintId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
  const mockUserId = 'user-123';
  const mockUser = { ...mockEmailUser, id: mockUserId };

  const mockDynamicQuestions = [
    {
      id: 'section-1',
      title: 'Test Section',
      questions: [
        {
          id: 'q1',
          label: 'Test Question',
          type: 'text',
          required: true,
        },
      ],
    },
  ];

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
      const mockCookies = {
        getAll: vi.fn(() => []),
        set: vi.fn(),
      };

      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: null },
            error: { message: 'Not authenticated' },
          }),
        },
      };

      const { cookies } = await import('next/headers');
      vi.mocked(cookies).mockResolvedValue(mockCookies as any);

      const { createServerClient } = await import('@supabase/ssr');
      vi.mocked(createServerClient).mockReturnValue(mockSupabase as any);

      const request = createMockRequest({
        blueprintId: mockBlueprintId,
        answers: { q1: 'answer1' },
      });

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
      const mockCookies = {
        getAll: vi.fn(() => []),
        set: vi.fn(),
      };

      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null,
          }),
        },
      };

      const { cookies } = await import('next/headers');
      vi.mocked(cookies).mockResolvedValue(mockCookies as any);

      const { createServerClient } = await import('@supabase/ssr');
      vi.mocked(createServerClient).mockReturnValue(mockSupabase as any);
    });

    it('should return 400 when blueprintId is missing', async () => {
      // Arrange
      const request = createMockRequest({
        answers: { q1: 'answer1' },
      });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid request');
      expect(data.details).toBeDefined();
    });

    it('should return 400 when blueprintId is not a valid UUID', async () => {
      // Arrange
      const request = createMockRequest({
        blueprintId: 'invalid-uuid',
        answers: { q1: 'answer1' },
      });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid request');
    });

    it('should return 400 when answers is missing', async () => {
      // Arrange
      const request = createMockRequest({
        blueprintId: mockBlueprintId,
      });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid request');
    });
  });

  describe('Blueprint Ownership', () => {
    beforeEach(async () => {
      const mockCookies = {
        getAll: vi.fn(() => []),
        set: vi.fn(),
      };

      const { cookies } = await import('next/headers');
      vi.mocked(cookies).mockResolvedValue(mockCookies as any);
    });

    it('should return 404 when blueprint not found', async () => {
      // Arrange
      const mockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Not found' },
        }),
      };

      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null,
          }),
        },
        from: vi.fn(() => mockQueryBuilder),
      };

      const { createServerClient } = await import('@supabase/ssr');
      vi.mocked(createServerClient).mockReturnValue(mockSupabase as any);

      const request = createMockRequest({
        blueprintId: mockBlueprintId,
        answers: { q1: 'answer1' },
      });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(404);
      expect(data.error).toBe('Blueprint not found or access denied');
    });

    it('should verify ownership with user_id check', async () => {
      // Arrange
      const mockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: mockBlueprintId,
            user_id: mockUserId,
            dynamic_questions: mockDynamicQuestions,
            dynamic_answers: {},
            status: 'draft',
          },
          error: null,
        }),
      };

      const mockUpdateQuery = {
        eq: vi.fn().mockReturnThis(),
      };

      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null,
          }),
        },
        from: vi.fn(() => ({
          ...mockQueryBuilder,
          update: vi.fn(() => mockUpdateQuery),
        })),
      };

      mockUpdateQuery.eq.mockResolvedValue({ data: null, error: null });

      const { createServerClient } = await import('@supabase/ssr');
      vi.mocked(createServerClient).mockReturnValue(mockSupabase as any);

      const { validateCompleteAnswers } = await import('@/lib/validation/dynamicQuestionSchemas');
      vi.mocked(validateCompleteAnswers).mockReturnValue({
        valid: true,
        errors: {},
        missingRequired: [],
        sanitizedAnswers: { q1: 'answer1' },
      });

      const request = createMockRequest({
        blueprintId: mockBlueprintId,
        answers: { q1: 'answer1' },
      });

      // Act
      await POST(request);

      // Assert - Verify user_id check
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('id', mockBlueprintId);
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('user_id', mockUserId);
    });
  });

  describe('Dynamic Questions Validation', () => {
    beforeEach(async () => {
      const mockCookies = {
        getAll: vi.fn(() => []),
        set: vi.fn(),
      };

      const { cookies } = await import('next/headers');
      vi.mocked(cookies).mockResolvedValue(mockCookies as any);
    });

    it('should return 400 when no dynamic questions exist', async () => {
      // Arrange
      const mockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: mockBlueprintId,
            user_id: mockUserId,
            dynamic_questions: [],
            status: 'draft',
          },
          error: null,
        }),
      };

      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null,
          }),
        },
        from: vi.fn(() => mockQueryBuilder),
      };

      const { createServerClient } = await import('@supabase/ssr');
      vi.mocked(createServerClient).mockReturnValue(mockSupabase as any);

      const request = createMockRequest({
        blueprintId: mockBlueprintId,
        answers: { q1: 'answer1' },
      });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error).toContain('No dynamic questions found');
    });

    it('should return 400 when sections have invalid structure', async () => {
      // Arrange
      const mockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: mockBlueprintId,
            user_id: mockUserId,
            dynamic_questions: [
              { id: 'section-1' }, // Missing questions array
            ],
            status: 'draft',
          },
          error: null,
        }),
      };

      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null,
          }),
        },
        from: vi.fn(() => mockQueryBuilder),
      };

      const { createServerClient } = await import('@supabase/ssr');
      vi.mocked(createServerClient).mockReturnValue(mockSupabase as any);

      const request = createMockRequest({
        blueprintId: mockBlueprintId,
        answers: { q1: 'answer1' },
      });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid dynamic questions structure');
    });
  });

  describe('Answer Validation', () => {
    beforeEach(async () => {
      const mockCookies = {
        getAll: vi.fn(() => []),
        set: vi.fn(),
      };

      const { cookies } = await import('next/headers');
      vi.mocked(cookies).mockResolvedValue(mockCookies as any);
    });

    it('should return 400 when validation fails', async () => {
      // Arrange
      const mockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: mockBlueprintId,
            user_id: mockUserId,
            dynamic_questions: mockDynamicQuestions,
            status: 'draft',
          },
          error: null,
        }),
      };

      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null,
          }),
        },
        from: vi.fn(() => mockQueryBuilder),
      };

      const { createServerClient } = await import('@supabase/ssr');
      vi.mocked(createServerClient).mockReturnValue(mockSupabase as any);

      const { validateCompleteAnswers } = await import('@/lib/validation/dynamicQuestionSchemas');
      vi.mocked(validateCompleteAnswers).mockReturnValue({
        valid: false,
        errors: { q1: 'This field is required' },
        missingRequired: ['q1'],
      });

      const request = createMockRequest({
        blueprintId: mockBlueprintId,
        answers: {},
      });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error).toBe('Answer validation failed');
      expect(data.validationErrors).toEqual({ q1: 'This field is required' });
      expect(data.missingRequired).toContain('q1');
    });

    it('should return 500 when validation throws error', async () => {
      // Arrange
      const mockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: mockBlueprintId,
            user_id: mockUserId,
            dynamic_questions: mockDynamicQuestions,
            status: 'draft',
          },
          error: null,
        }),
      };

      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null,
          }),
        },
        from: vi.fn(() => mockQueryBuilder),
      };

      const { createServerClient } = await import('@supabase/ssr');
      vi.mocked(createServerClient).mockReturnValue(mockSupabase as any);

      const { validateCompleteAnswers } = await import('@/lib/validation/dynamicQuestionSchemas');
      vi.mocked(validateCompleteAnswers).mockImplementation(() => {
        throw new Error('Validation error');
      });

      const request = createMockRequest({
        blueprintId: mockBlueprintId,
        answers: { q1: 'answer1' },
      });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal validation error occurred');
    });
  });

  describe('Successful Submission', () => {
    beforeEach(async () => {
      const mockCookies = {
        getAll: vi.fn(() => []),
        set: vi.fn(),
      };

      const { cookies } = await import('next/headers');
      vi.mocked(cookies).mockResolvedValue(mockCookies as any);
    });

    it('should save answers successfully when validation passes', async () => {
      // Arrange
      // Mock SELECT query: .from().select().eq().eq().single()
      const mockSelectBuilder = {
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: mockBlueprintId,
            user_id: mockUserId,
            dynamic_questions: mockDynamicQuestions,
            dynamic_answers: {},
            status: 'draft',
          },
          error: null,
        }),
      };

      const mockSelect = vi.fn(() => mockSelectBuilder);

      // Mock UPDATE query: .from().update().eq().eq()
      const mockUpdateBuilder = {
        eq: vi.fn().mockReturnThis(),
      };
      // Chain: first .eq() returns self, second .eq() returns result
      mockUpdateBuilder.eq.mockReturnValueOnce(mockUpdateBuilder);
      mockUpdateBuilder.eq.mockResolvedValueOnce({ data: null, error: null });

      const mockUpdate = vi.fn(() => mockUpdateBuilder);

      // Mock from() to return object with both select and update methods
      let callCount = 0;
      const mockFrom = vi.fn(() => {
        callCount++;
        if (callCount === 1) {
          // First call is for SELECT
          return {
            select: mockSelect,
            update: mockUpdate,
          };
        } else {
          // Second call is for UPDATE
          return {
            select: mockSelect,
            update: mockUpdate,
          };
        }
      });

      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null,
          }),
        },
        from: mockFrom,
      };

      const { createServerClient } = await import('@supabase/ssr');
      vi.mocked(createServerClient).mockReturnValue(mockSupabase as any);

      const { validateCompleteAnswers } = await import('@/lib/validation/dynamicQuestionSchemas');
      vi.mocked(validateCompleteAnswers).mockReturnValue({
        valid: true,
        errors: {},
        missingRequired: [],
        sanitizedAnswers: { q1: 'answer1' },
      });

      const request = createMockRequest({
        blueprintId: mockBlueprintId,
        answers: { q1: 'answer1' },
      });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.blueprintId).toBe(mockBlueprintId);
      expect(data.message).toContain('Answers submitted successfully');

      // Verify update was called with correct data
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          dynamic_answers: { q1: 'answer1' },
        })
      );
    });

    it('should merge with existing answers', async () => {
      // Arrange
      const existingAnswers = { q2: 'existing_answer' };

      // Mock SELECT query: .from().select().eq().eq().single()
      const mockSelectBuilder = {
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: mockBlueprintId,
            user_id: mockUserId,
            dynamic_questions: mockDynamicQuestions,
            dynamic_answers: existingAnswers,
            status: 'draft',
          },
          error: null,
        }),
      };

      const mockSelect = vi.fn(() => mockSelectBuilder);

      // Mock UPDATE query: .from().update().eq().eq()
      const mockUpdateBuilder = {
        eq: vi.fn().mockReturnThis(),
      };
      // Chain: first .eq() returns self, second .eq() returns result
      mockUpdateBuilder.eq.mockReturnValueOnce(mockUpdateBuilder);
      mockUpdateBuilder.eq.mockResolvedValueOnce({ data: null, error: null });

      const mockUpdate = vi.fn(() => mockUpdateBuilder);

      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null,
          }),
        },
        from: vi.fn(() => ({
          select: mockSelect,
          update: mockUpdate,
        })),
      };

      const { createServerClient } = await import('@supabase/ssr');
      vi.mocked(createServerClient).mockReturnValue(mockSupabase as any);

      const { validateCompleteAnswers } = await import('@/lib/validation/dynamicQuestionSchemas');
      vi.mocked(validateCompleteAnswers).mockReturnValue({
        valid: true,
        errors: {},
        missingRequired: [],
        sanitizedAnswers: { q1: 'new_answer' },
      });

      const request = createMockRequest({
        blueprintId: mockBlueprintId,
        answers: { q1: 'new_answer' },
      });

      // Act
      await POST(request);

      // Assert - Should merge new answer with existing answers
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          dynamic_answers: {
            q2: 'existing_answer',
            q1: 'new_answer',
          },
        })
      );
    });

    it('should return 500 when database save fails', async () => {
      // Arrange
      // Mock SELECT query: .from().select().eq().eq().single()
      const mockSelectBuilder = {
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: mockBlueprintId,
            user_id: mockUserId,
            dynamic_questions: mockDynamicQuestions,
            dynamic_answers: {},
            status: 'draft',
          },
          error: null,
        }),
      };

      const mockSelect = vi.fn(() => mockSelectBuilder);

      // Mock UPDATE query: .from().update().eq().eq() - with error
      const mockUpdateBuilder = {
        eq: vi.fn().mockReturnThis(),
      };
      // Chain: first .eq() returns self, second .eq() returns error result
      mockUpdateBuilder.eq.mockReturnValueOnce(mockUpdateBuilder);
      mockUpdateBuilder.eq.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database error' },
      });

      const mockUpdate = vi.fn(() => mockUpdateBuilder);

      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null,
          }),
        },
        from: vi.fn(() => ({
          select: mockSelect,
          update: mockUpdate,
        })),
      };

      const { createServerClient } = await import('@supabase/ssr');
      vi.mocked(createServerClient).mockReturnValue(mockSupabase as any);

      const { validateCompleteAnswers } = await import('@/lib/validation/dynamicQuestionSchemas');
      vi.mocked(validateCompleteAnswers).mockReturnValue({
        valid: true,
        errors: {},
        missingRequired: [],
        sanitizedAnswers: { q1: 'answer1' },
      });

      const request = createMockRequest({
        blueprintId: mockBlueprintId,
        answers: { q1: 'answer1' },
      });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to save answers to database');
    });
  });

  describe('Error Handling', () => {
    it('should return 500 when unexpected error occurs', async () => {
      // Arrange
      const mockCookies = {
        getAll: vi.fn(() => []),
        set: vi.fn(),
      };

      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockRejectedValue(new Error('Unexpected error')),
        },
      };

      const { cookies } = await import('next/headers');
      vi.mocked(cookies).mockResolvedValue(mockCookies as any);

      const { createServerClient } = await import('@supabase/ssr');
      vi.mocked(createServerClient).mockReturnValue(mockSupabase as any);

      const request = createMockRequest({
        blueprintId: mockBlueprintId,
        answers: { q1: 'answer1' },
      });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });
  });
});
