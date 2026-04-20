/**
 * Tests for POST /api/dynamic-answers/save endpoint (auto-save)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/dynamic-answers/save/route';

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
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(),
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

describe('POST /api/dynamic-answers/save', () => {
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

    const request = new NextRequest('http://localhost:3000/api/dynamic-answers/save', {
      method: 'POST',
      body: JSON.stringify({
        blueprintId: mockBlueprintId,
        answers: { s1_q1: 'test' },
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error).toBe('Unauthorized');
  });

  it('should return 400 if request body is invalid', async () => {
    const { createServerClient } = await import('@supabase/ssr');
    const mockSupabase = (createServerClient as any)();
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: mockUserId } },
      error: null,
    });

    const request = new NextRequest('http://localhost:3000/api/dynamic-answers/save', {
      method: 'POST',
      body: JSON.stringify({
        // Missing blueprintId
        answers: { s1_q1: 'test' },
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('Invalid request');
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

    const request = new NextRequest('http://localhost:3000/api/dynamic-answers/save', {
      method: 'POST',
      body: JSON.stringify({
        blueprintId: mockBlueprintId,
        answers: { s1_q1: 'test' },
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data.error).toBe('Blueprint not found or access denied');
  });

  it('should merge new answers with existing answers', async () => {
    const { createServerClient } = await import('@supabase/ssr');
    const mockSupabase = (createServerClient as any)();
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: mockUserId } },
      error: null,
    });

    const existingAnswers = { s1_q1: 'old answer', s1_q2: 'keep this' };
    const newAnswers = { s1_q1: 'new answer', s1_q3: 'additional' };

    const mockSingle = vi.fn().mockResolvedValue({
      data: {
        id: mockBlueprintId,
        user_id: mockUserId,
        dynamic_answers: existingAnswers,
        status: 'draft',
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

    const request = new NextRequest('http://localhost:3000/api/dynamic-answers/save', {
      method: 'POST',
      body: JSON.stringify({
        blueprintId: mockBlueprintId,
        answers: newAnswers,
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.saved).toBe(true);
    expect(data.answerCount).toBe(3); // Merged: s1_q1 (updated), s1_q2 (kept), s1_q3 (new)

    // Verify update was called with merged answers
    expect(mockUpdate).toHaveBeenCalledWith({
      dynamic_answers: {
        s1_q1: 'new answer', // Updated
        s1_q2: 'keep this', // Kept
        s1_q3: 'additional', // New
      },
      status: 'answering',
      updated_at: expect.any(String),
    });
  });

  it('should update status to "answering"', async () => {
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
        dynamic_answers: {},
        status: 'draft',
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

    const request = new NextRequest('http://localhost:3000/api/dynamic-answers/save', {
      method: 'POST',
      body: JSON.stringify({
        blueprintId: mockBlueprintId,
        answers: { s1_q1: 'test' },
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'answering',
      })
    );
  });

  it('should handle save errors gracefully', async () => {
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
        dynamic_answers: {},
        status: 'draft',
      },
      error: null,
    });

    const mockUpdate = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          error: new Error('Database error'),
        }),
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

    const request = new NextRequest('http://localhost:3000/api/dynamic-answers/save', {
      method: 'POST',
      body: JSON.stringify({
        blueprintId: mockBlueprintId,
        answers: { s1_q1: 'test' },
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toBe('Failed to save answers to database');
  });
});
