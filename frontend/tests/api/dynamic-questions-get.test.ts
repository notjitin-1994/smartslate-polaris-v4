/**
 * Tests for GET /api/dynamic-questions/:blueprintId endpoint
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/dynamic-questions/[blueprintId]/route';

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
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(),
          })),
        })),
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

describe('GET /api/dynamic-questions/:blueprintId', () => {
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

    const request = new NextRequest(
      `http://localhost:3000/api/dynamic-questions/${mockBlueprintId}`
    );
    const response = await GET(request, {
      params: Promise.resolve({ blueprintId: mockBlueprintId }),
    });

    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error).toBe('Unauthorized');
  });

  it('should return 400 if blueprintId is missing', async () => {
    const { createServerClient } = await import('@supabase/ssr');
    const mockSupabase = (createServerClient as any)();
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: mockUserId } },
      error: null,
    });

    const request = new NextRequest('http://localhost:3000/api/dynamic-questions/');
    const response = await GET(request, {
      params: Promise.resolve({ blueprintId: '' }),
    });

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('Blueprint ID required');
  });

  it('should return 400 if blueprintId has invalid UUID format', async () => {
    const { createServerClient } = await import('@supabase/ssr');
    const mockSupabase = (createServerClient as any)();
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: mockUserId } },
      error: null,
    });

    const request = new NextRequest('http://localhost:3000/api/dynamic-questions/invalid-uuid');
    const response = await GET(request, {
      params: Promise.resolve({ blueprintId: 'invalid-uuid' }),
    });

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('Invalid blueprint ID format');
  });

  it('should return 404 if blueprint is not found', async () => {
    const { createServerClient } = await import('@supabase/ssr');
    const mockSupabase = (createServerClient as any)();
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: mockUserId } },
      error: null,
    });

    const mockSingle = vi.fn().mockResolvedValue({
      data: null,
      error: new Error('Not found'),
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

    const request = new NextRequest(
      `http://localhost:3000/api/dynamic-questions/${mockBlueprintId}`
    );
    const response = await GET(request, {
      params: Promise.resolve({ blueprintId: mockBlueprintId }),
    });

    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data.error).toBe('Blueprint not found or access denied');
  });

  it('should return dynamic questions successfully', async () => {
    const { createServerClient } = await import('@supabase/ssr');
    const mockSupabase = (createServerClient as any)();
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: mockUserId } },
      error: null,
    });

    const mockSections = [
      {
        id: 's1',
        title: 'Section 1',
        description: 'Test section',
        order: 1,
        questions: [
          {
            id: 's1_q1',
            label: 'Test question',
            type: 'text',
            required: true,
          },
        ],
      },
    ];

    const mockSingle = vi.fn().mockResolvedValue({
      data: {
        dynamic_questions: mockSections,
        dynamic_answers: { s1_q1: 'test answer' },
        status: 'answering',
        dynamic_questions_raw: {
          metadata: {
            generatedAt: '2025-10-06T10:00:00Z',
            provider: 'anthropic',
            model: 'claude-3-5-sonnet',
          },
        },
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

    const request = new NextRequest(
      `http://localhost:3000/api/dynamic-questions/${mockBlueprintId}`
    );
    const response = await GET(request, {
      params: Promise.resolve({ blueprintId: mockBlueprintId }),
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.blueprintId).toBe(mockBlueprintId);
    expect(data.sections).toEqual(mockSections);
    expect(data.existingAnswers).toEqual({ s1_q1: 'test answer' });
    expect(data.metadata.totalQuestions).toBe(1);
    expect(data.metadata.sectionCount).toBe(1);
  });

  it('should handle sections in nested structure', async () => {
    const { createServerClient } = await import('@supabase/ssr');
    const mockSupabase = (createServerClient as any)();
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: mockUserId } },
      error: null,
    });

    const mockSections = [
      {
        id: 's1',
        title: 'Section 1',
        questions: [{ id: 's1_q1', label: 'Q1', type: 'text', required: true }],
      },
    ];

    const mockSingle = vi.fn().mockResolvedValue({
      data: {
        dynamic_questions: { sections: mockSections }, // Nested structure
        dynamic_answers: {},
        status: 'answering',
        dynamic_questions_raw: {},
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

    const request = new NextRequest(
      `http://localhost:3000/api/dynamic-questions/${mockBlueprintId}`
    );
    const response = await GET(request, {
      params: Promise.resolve({ blueprintId: mockBlueprintId }),
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.sections).toEqual(mockSections);
  });
});
