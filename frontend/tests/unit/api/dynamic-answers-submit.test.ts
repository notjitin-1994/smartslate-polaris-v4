/**
 * Unit Tests for Dynamic Answers Submit Endpoint
 * Tests the critical fix: status should NOT be set to 'completed' when answers are submitted
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { POST } from '@/app/api/dynamic-answers/submit/route';
import { NextRequest } from 'next/server';

// Mock dependencies
vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn(() => ({
        data: { user: { id: 'test-user-id' } },
        error: null,
      })),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => ({
            data: {
              id: 'test-blueprint-id',
              user_id: 'test-user-id',
              dynamic_questions: [
                {
                  id: 's1',
                  title: 'Section 1',
                  questions: [
                    {
                      id: 's1_q1',
                      label: 'Question 1',
                      type: 'text',
                      required: true,
                    },
                  ],
                },
              ],
              dynamic_answers: {},
              status: 'generating',
            },
            error: null,
          })),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({ error: null })),
        })),
      })),
    })),
  })),
}));

vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    getAll: vi.fn(() => []),
    setAll: vi.fn(),
  })),
}));

vi.mock('@/lib/logging', () => ({
  createServiceLogger: vi.fn(() => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  })),
}));

vi.mock('@/lib/validation/dynamicQuestionSchemas', () => ({
  validateCompleteAnswers: vi.fn(() => ({
    valid: true,
    errors: {},
    missingRequired: [],
    sanitizedAnswers: { s1_q1: 'test answer' },
  })),
}));

describe('Dynamic Answers Submit Endpoint', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Critical Fix: Status Handling', () => {
    it('should NOT set status to completed when answers are submitted', async () => {
      const request = new NextRequest('http://localhost:3000/api/dynamic-answers/submit', {
        method: 'POST',
        body: JSON.stringify({
          blueprintId: 'test-blueprint-id',
          answers: {
            s1_q1: 'test answer',
          },
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      // Verify the update call did NOT include status='completed'
      const { createServerClient } = await import('@supabase/ssr');
      const mockSupabase = createServerClient('', '', {} as any);
      const updateCall = mockSupabase.from('blueprint_generator').update;

      // The update should have been called
      expect(updateCall).toHaveBeenCalled();

      // Get the arguments passed to update
      const updateArgs = (updateCall as any).mock.calls[0][0];

      // CRITICAL: status should NOT be in the update
      expect(updateArgs).not.toHaveProperty('status');
      expect(updateArgs.dynamic_answers).toBeDefined();
    });

    it('should indicate generation has not started yet in response', async () => {
      const request = new NextRequest('http://localhost:3000/api/dynamic-answers/submit', {
        method: 'POST',
        body: JSON.stringify({
          blueprintId: 'test-blueprint-id',
          answers: { s1_q1: 'answer' },
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.blueprintGenerationStarted).toBe(false);
      expect(data.message).toContain('Ready for blueprint generation');
    });
  });

  describe('Answer Validation', () => {
    it('should validate complete answers before accepting', async () => {
      const request = new NextRequest('http://localhost:3000/api/dynamic-answers/submit', {
        method: 'POST',
        body: JSON.stringify({
          blueprintId: 'test-blueprint-id',
          answers: { s1_q1: 'test answer' },
        }),
      });

      await POST(request);

      const { validateCompleteAnswers } = await import('@/lib/validation/dynamicQuestionSchemas');
      expect(validateCompleteAnswers).toHaveBeenCalled();
    });

    it('should reject submission with validation errors', async () => {
      const { validateCompleteAnswers } = await import('@/lib/validation/dynamicQuestionSchemas');
      vi.mocked(validateCompleteAnswers).mockReturnValueOnce({
        valid: false,
        errors: { s1_q1: 'Required field missing' },
        missingRequired: ['s1_q1'],
      });

      const request = new NextRequest('http://localhost:3000/api/dynamic-answers/submit', {
        method: 'POST',
        body: JSON.stringify({
          blueprintId: 'test-blueprint-id',
          answers: {},
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('validation');
    });
  });

  describe('Answer Persistence', () => {
    it('should save dynamic answers to database', async () => {
      const testAnswers = {
        s1_q1: 'answer 1',
        s1_q2: ['option1', 'option2'],
        s1_q3: 5,
      };

      const request = new NextRequest('http://localhost:3000/api/dynamic-answers/submit', {
        method: 'POST',
        body: JSON.stringify({
          blueprintId: 'test-blueprint-id',
          answers: testAnswers,
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(200);

      const { createServerClient } = await import('@supabase/ssr');
      const mockSupabase = createServerClient('', '', {} as any);
      const updateCall = mockSupabase.from('blueprint_generator').update;

      expect(updateCall).toHaveBeenCalled();

      const updateArgs = (updateCall as any).mock.calls[0][0];
      expect(updateArgs.dynamic_answers).toEqual(expect.objectContaining(testAnswers));
    });

    it('should merge with existing answers', async () => {
      const request = new NextRequest('http://localhost:3000/api/dynamic-answers/submit', {
        method: 'POST',
        body: JSON.stringify({
          blueprintId: 'test-blueprint-id',
          answers: { s1_q2: 'new answer' },
        }),
      });

      await POST(request);

      const { createServerClient } = await import('@supabase/ssr');
      const mockSupabase = createServerClient('', '', {} as any);
      const updateCall = mockSupabase.from('blueprint_generator').update;

      const updateArgs = (updateCall as any).mock.calls[0][0];
      expect(updateArgs.dynamic_answers).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle database save errors gracefully', async () => {
      const { createServerClient } = await import('@supabase/ssr');
      const mockSupabase = createServerClient('', '', {} as any);

      vi.mocked(mockSupabase.from('blueprint_generator').update as any).mockReturnValueOnce({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({ error: { message: 'Database error' } })),
        })),
      });

      const request = new NextRequest('http://localhost:3000/api/dynamic-answers/submit', {
        method: 'POST',
        body: JSON.stringify({
          blueprintId: 'test-blueprint-id',
          answers: { s1_q1: 'answer' },
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(500);
    });

    it('should handle blueprint not found error', async () => {
      const { createServerClient } = await import('@supabase/ssr');
      const mockSupabase = createServerClient('', '', {} as any);

      vi.mocked(mockSupabase.from('blueprint_generator').select as any).mockReturnValueOnce({
        eq: vi.fn(() => ({
          single: vi.fn(() => ({
            data: null,
            error: { message: 'Not found' },
          })),
        })),
      });

      const request = new NextRequest('http://localhost:3000/api/dynamic-answers/submit', {
        method: 'POST',
        body: JSON.stringify({
          blueprintId: 'test-blueprint-id',
          answers: { s1_q1: 'answer' },
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(404);
    });
  });

  describe('Authentication', () => {
    it('should reject unauthenticated requests', async () => {
      const { createServerClient } = await import('@supabase/ssr');
      const mockSupabase = createServerClient('', '', {} as any);

      vi.mocked(mockSupabase.auth.getUser).mockResolvedValueOnce({
        data: { user: null },
        error: { message: 'Not authenticated', name: 'AuthError', status: 401 },
      } as any);

      const request = new NextRequest('http://localhost:3000/api/dynamic-answers/submit', {
        method: 'POST',
        body: JSON.stringify({
          blueprintId: 'test-blueprint-id',
          answers: { s1_q1: 'answer' },
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(401);
    });
  });
});
