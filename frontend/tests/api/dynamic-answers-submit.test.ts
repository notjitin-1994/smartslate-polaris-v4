/**
 * Tests for POST /api/dynamic-answers/submit endpoint (final submission)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/dynamic-answers/submit/route';

// Mock dependencies
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    getAll: vi.fn(() => []),
    set: vi.fn(),
  })),
}));

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn(() =>
        Promise.resolve({
          data: null,
          error: null,
        })
      ),
      update: vi.fn(() =>
        Promise.resolve({
          data: null,
          error: null,
        })
      ),
      insert: vi.fn(() =>
        Promise.resolve({
          data: null,
          error: null,
        })
      ),
      eq: vi.fn(() => ({
        eq: vi.fn(() =>
          Promise.resolve({
            data: null,
            error: null,
          })
        ),
        single: vi.fn(() =>
          Promise.resolve({
            data: null,
            error: null,
          })
        ),
      })),
    })),
  })),
}));

vi.mock('@/lib/logging', () => ({
  createServiceLogger: vi.fn(() => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  })),
}));

vi.mock('@/lib/validation/dynamicQuestionSchemas', () => ({
  validateCompleteAnswers: vi.fn(),
}));

describe('POST /api/dynamic-answers/submit', () => {
  const mockBlueprintId = '550e8400-e29b-41d4-a716-446655440000';
  const mockUserId = 'user-123';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 if user is not authenticated', async () => {
    const { createServerClient } = await import('@supabase/ssr');
    const mockSupabase = (createServerClient as any)();
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: new Error('Not authenticated'),
    });

    const request = new NextRequest('http://localhost:3000/api/dynamic-answers/submit', {
      method: 'POST',
      body: JSON.stringify({
        blueprintId: mockBlueprintId,
        answers: { s1_q1: 'test' },
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(401);
    const data = await response.json();
    console.log('Test response data:', data);
    expect(data.error).toBe('Unauthorized');
  });

  it('should return 400 if no dynamic questions exist', async () => {
    const { createServerClient } = await import('@supabase/ssr');
    const mockSupabase = (createServerClient as any)();
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: mockUserId } },
      error: null,
    });

    const mockSingle = vi.fn().mockResolvedValue({
      data: {
        id: mockBlueprintId,
        user_id: mockUserId,
        dynamic_questions: [], // Empty
        dynamic_answers: {},
        status: 'draft',
      },
      error: null,
    });

    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: mockSingle,
          }),
        }),
      }),
    });

    const request = new NextRequest('http://localhost:3000/api/dynamic-answers/submit', {
      method: 'POST',
      body: JSON.stringify({
        blueprintId: mockBlueprintId,
        answers: { s1_q1: 'test' },
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('No dynamic questions found. Please generate questions first.');
  });

  it('should return 400 if validation fails', async () => {
    const { createServerClient } = await import('@supabase/ssr');
    const { validateCompleteAnswers } = await import('@/lib/validation/dynamicQuestionSchemas');

    const mockSupabase = (createServerClient as any)();
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: mockUserId } },
      error: null,
    });

    const mockSections = [
      {
        id: 's1',
        title: 'Section 1',
        order: 1,
        questions: [
          {
            id: 's1_q1',
            label: 'Required question',
            type: 'text',
            required: true,
          },
        ],
      },
    ];

    const mockSingle = vi.fn().mockResolvedValue({
      data: {
        id: mockBlueprintId,
        user_id: mockUserId,
        dynamic_questions: mockSections,
        dynamic_answers: {},
        status: 'answering',
      },
      error: null,
    });

    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: mockSingle,
          }),
        }),
      }),
    });

    // Mock validation failure
    (validateCompleteAnswers as any).mockReturnValue({
      valid: false,
      errors: { s1_q1: 'This field is required' },
      missingRequired: ['s1_q1'],
    });

    const request = new NextRequest('http://localhost:3000/api/dynamic-answers/submit', {
      method: 'POST',
      body: JSON.stringify({
        blueprintId: mockBlueprintId,
        answers: {}, // Empty answers
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('Answer validation failed');
    expect(data.validationErrors).toBeDefined();
    expect(data.missingRequired).toEqual(['s1_q1']);
  });

  it('should successfully submit valid answers', async () => {
    const { createServerClient } = await import('@supabase/ssr');
    const { validateCompleteAnswers } = await import('@/lib/validation/dynamicQuestionSchemas');

    const mockSupabase = (createServerClient as any)();
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: mockUserId } },
      error: null,
    });

    const mockSections = [
      {
        id: 's1',
        title: 'Section 1',
        order: 1,
        questions: [
          {
            id: 's1_q1',
            label: 'Question 1',
            type: 'text',
            required: true,
          },
        ],
      },
    ];

    const mockSingle = vi.fn().mockResolvedValue({
      data: {
        id: mockBlueprintId,
        user_id: mockUserId,
        dynamic_questions: mockSections,
        dynamic_answers: {},
        status: 'answering',
      },
      error: null,
    });

    const mockUpdate = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    });

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'blueprint_generator') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: mockSingle,
              }),
            }),
          }),
          update: mockUpdate,
        };
      }
      return {};
    });

    // Mock validation success
    (validateCompleteAnswers as any).mockReturnValue({
      valid: true,
      errors: {},
      missingRequired: [],
    });

    const request = new NextRequest('http://localhost:3000/api/dynamic-answers/submit', {
      method: 'POST',
      body: JSON.stringify({
        blueprintId: mockBlueprintId,
        answers: { s1_q1: 'Complete answer' },
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.blueprintId).toBe(mockBlueprintId);
    expect(data.message).toBe('Answers submitted successfully');

    // Verify status was updated to 'completed'
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'completed',
        dynamic_answers: { s1_q1: 'Complete answer' },
      })
    );
  });

  it('should merge with existing answers on submission', async () => {
    const { createServerClient } = await import('@supabase/ssr');
    const { validateCompleteAnswers } = await import('@/lib/validation/dynamicQuestionSchemas');

    const mockSupabase = (createServerClient as any)();
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: mockUserId } },
      error: null,
    });

    const existingAnswers = { s1_q1: 'saved earlier' };
    const newAnswers = { s1_q2: 'final answer' };

    const mockSections = [
      {
        id: 's1',
        title: 'Section 1',
        order: 1,
        questions: [
          { id: 's1_q1', label: 'Q1', type: 'text', required: true },
          { id: 's1_q2', label: 'Q2', type: 'text', required: true },
        ],
      },
    ];

    const mockSingle = vi.fn().mockResolvedValue({
      data: {
        id: mockBlueprintId,
        user_id: mockUserId,
        dynamic_questions: mockSections,
        dynamic_answers: existingAnswers,
        status: 'answering',
      },
      error: null,
    });

    const mockUpdate = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    });

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'blueprint_generator') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: mockSingle,
              }),
            }),
          }),
          update: mockUpdate,
        };
      }
      return {};
    });

    // Mock validation success
    (validateCompleteAnswers as any).mockReturnValue({
      valid: true,
      errors: {},
      missingRequired: [],
    });

    const request = new NextRequest('http://localhost:3000/api/dynamic-answers/submit', {
      method: 'POST',
      body: JSON.stringify({
        blueprintId: mockBlueprintId,
        answers: newAnswers,
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(200);

    // Verify answers were merged
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        dynamic_answers: {
          s1_q1: 'saved earlier', // From existing
          s1_q2: 'final answer', // From new
        },
      })
    );
  });
});
