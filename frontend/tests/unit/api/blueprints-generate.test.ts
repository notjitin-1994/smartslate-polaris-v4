/**
 * Unit Tests for Blueprint Generation Endpoint
 * Tests that blueprint generation is NOT skipped and status transitions correctly
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/blueprints/generate/route';
import { NextRequest } from 'next/server';

// Mock dependencies
vi.mock('@/lib/supabase/server', () => ({
  getServerSession: vi.fn(() => ({
    session: { user: { id: 'test-user-id' } },
  })),
  getSupabaseServerClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => ({
              data: {
                id: 'test-blueprint-id',
                user_id: 'test-user-id',
                static_answers: {
                  section_1_role_experience: { current_role: 'L&D Manager' },
                  section_2_organization: { organization_name: 'Test Corp' },
                  section_3_learning_gap: { learning_gap_description: 'Test gap' },
                },
                dynamic_answers: {
                  s1_q1: 'answer 1',
                  s1_q2: 'answer 2',
                },
                status: 'answering', // Not 'completed'!
              },
              error: null,
            })),
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

vi.mock('@/lib/services/blueprintGenerationService', () => ({
  blueprintGenerationService: {
    generate: vi.fn(() => ({
      success: true,
      blueprint: {
        metadata: { title: 'Test Blueprint' },
        executive_summary: { content: 'Test summary', displayType: 'markdown' },
      },
      metadata: {
        model: 'gemini-3.1-pro-preview',
        duration: 65000,
        timestamp: new Date().toISOString(),
        fallbackUsed: false,
        attempts: 1,
      },
    })),
  },
}));

vi.mock('@/lib/services/blueprintMarkdownConverter', () => ({
  convertBlueprintToMarkdown: vi.fn(() => '# Test Blueprint\n\nTest content'),
}));

vi.mock('@/lib/claude/prompts', () => ({
  extractLearningObjectives: vi.fn(() => ['Objective 1', 'Objective 2']),
}));

vi.mock('@/lib/logging', () => ({
  createServiceLogger: vi.fn(() => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  })),
}));

describe('Blueprint Generation Endpoint', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Critical Fix: Generation Not Skipped', () => {
    it('should NOT skip generation when status is not completed', async () => {
      const request = new NextRequest('http://localhost:3000/api/blueprints/generate', {
        method: 'POST',
        body: JSON.stringify({
          blueprintId: 'test-blueprint-id',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      // Verify generation service was called
      const { blueprintGenerationService } = await import(
        '@/lib/services/blueprintGenerationService'
      );
      expect(blueprintGenerationService.generate).toHaveBeenCalled();
    });

    it('should skip generation only when status is already completed', async () => {
      const { getSupabaseServerClient } = await import('@/lib/supabase/server');
      const mockSupabase = getSupabaseServerClient();

      // Mock blueprint with status='completed'
      vi.mocked(mockSupabase.from as any).mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() => ({
                data: {
                  id: 'test-blueprint-id',
                  user_id: 'test-user-id',
                  static_answers: { test: 'data' },
                  dynamic_answers: { test: 'data' },
                  status: 'completed', // Already completed
                },
                error: null,
              })),
            })),
          })),
        })),
      });

      const request = new NextRequest('http://localhost:3000/api/blueprints/generate', {
        method: 'POST',
        body: JSON.stringify({
          blueprintId: 'test-blueprint-id',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      // Verify generation service was NOT called
      const { blueprintGenerationService } = await import(
        '@/lib/services/blueprintGenerationService'
      );
      expect(blueprintGenerationService.generate).not.toHaveBeenCalled();
    });
  });

  describe('Status Transitions', () => {
    it('should set status to generating before LLM call', async () => {
      const { getSupabaseServerClient } = await import('@/lib/supabase/server');
      const mockSupabase = getSupabaseServerClient();
      const updateMock = mockSupabase.from('blueprint_generator').update;

      const request = new NextRequest('http://localhost:3000/api/blueprints/generate', {
        method: 'POST',
        body: JSON.stringify({
          blueprintId: 'test-blueprint-id',
        }),
      });

      await POST(request);

      // First update should set status to 'generating'
      expect(updateMock).toHaveBeenCalled();
      const firstUpdateCall = (updateMock as any).mock.calls[0][0];
      expect(firstUpdateCall.status).toBe('generating');
    });

    it('should set status to completed only after successful generation', async () => {
      const { getSupabaseServerClient } = await import('@/lib/supabase/server');
      const mockSupabase = getSupabaseServerClient();
      const updateMock = mockSupabase.from('blueprint_generator').update;

      const request = new NextRequest('http://localhost:3000/api/blueprints/generate', {
        method: 'POST',
        body: JSON.stringify({
          blueprintId: 'test-blueprint-id',
        }),
      });

      await POST(request);

      // Second update should set status to 'completed' with blueprint data
      expect(updateMock).toHaveBeenCalledTimes(2);
      const secondUpdateCall = (updateMock as any).mock.calls[1][0];
      expect(secondUpdateCall.status).toBe('completed');
      expect(secondUpdateCall.blueprint_json).toBeDefined();
      expect(secondUpdateCall.blueprint_markdown).toBeDefined();
    });

    it('should set status to error if generation fails', async () => {
      const { blueprintGenerationService } = await import(
        '@/lib/services/blueprintGenerationService'
      );
      vi.mocked(blueprintGenerationService.generate).mockResolvedValueOnce({
        success: false,
        error: 'Generation failed',
        metadata: {} as any,
        blueprint: {} as any,
      });

      const request = new NextRequest('http://localhost:3000/api/blueprints/generate', {
        method: 'POST',
        body: JSON.stringify({
          blueprintId: 'test-blueprint-id',
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(500);

      const { getSupabaseServerClient } = await import('@/lib/supabase/server');
      const mockSupabase = getSupabaseServerClient();
      const updateMock = mockSupabase.from('blueprint_generator').update;

      // Should have updated to status='error'
      const errorUpdateCall = (updateMock as any).mock.calls.find(
        (call: any) => call[0].status === 'error'
      );
      expect(errorUpdateCall).toBeDefined();
    });
  });

  describe('Generation Service Integration', () => {
    it('should call generation service with correct context', async () => {
      const request = new NextRequest('http://localhost:3000/api/blueprints/generate', {
        method: 'POST',
        body: JSON.stringify({
          blueprintId: 'test-blueprint-id',
        }),
      });

      await POST(request);

      const { blueprintGenerationService } = await import(
        '@/lib/services/blueprintGenerationService'
      );
      expect(blueprintGenerationService.generate).toHaveBeenCalledWith(
        expect.objectContaining({
          blueprintId: 'test-blueprint-id',
          userId: 'test-user-id',
          staticAnswers: expect.any(Object),
          dynamicAnswers: expect.any(Object),
          learningObjectives: expect.any(Array),
        })
      );
    });

    it('should save generated blueprint to database', async () => {
      const request = new NextRequest('http://localhost:3000/api/blueprints/generate', {
        method: 'POST',
        body: JSON.stringify({
          blueprintId: 'test-blueprint-id',
        }),
      });

      await POST(request);

      const { getSupabaseServerClient } = await import('@/lib/supabase/server');
      const mockSupabase = getSupabaseServerClient();
      const updateMock = mockSupabase.from('blueprint_generator').update;

      // Find the update call that saves the blueprint
      const blueprintSaveCall = (updateMock as any).mock.calls.find(
        (call: any) => call[0].blueprint_json !== undefined
      );

      expect(blueprintSaveCall).toBeDefined();
      expect(blueprintSaveCall[0].blueprint_json).toBeDefined();
      expect(blueprintSaveCall[0].blueprint_markdown).toBeDefined();
      expect(blueprintSaveCall[0].status).toBe('completed');
    });
  });

  describe('Validation Requirements', () => {
    it('should reject if static questionnaire incomplete', async () => {
      const { getSupabaseServerClient } = await import('@/lib/supabase/server');
      const mockSupabase = getSupabaseServerClient();

      vi.mocked(mockSupabase.from as any).mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() => ({
                data: {
                  id: 'test-blueprint-id',
                  user_id: 'test-user-id',
                  static_answers: {}, // Empty!
                  dynamic_answers: { s1_q1: 'answer' },
                  status: 'answering',
                },
                error: null,
              })),
            })),
          })),
        })),
      });

      const request = new NextRequest('http://localhost:3000/api/blueprints/generate', {
        method: 'POST',
        body: JSON.stringify({
          blueprintId: 'test-blueprint-id',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Static questionnaire incomplete');
    });

    it('should reject if dynamic questionnaire incomplete', async () => {
      const { getSupabaseServerClient } = await import('@/lib/supabase/server');
      const mockSupabase = getSupabaseServerClient();

      vi.mocked(mockSupabase.from as any).mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() => ({
                data: {
                  id: 'test-blueprint-id',
                  user_id: 'test-user-id',
                  static_answers: { test: 'data' },
                  dynamic_answers: {}, // Empty!
                  status: 'answering',
                },
                error: null,
              })),
            })),
          })),
        })),
      });

      const request = new NextRequest('http://localhost:3000/api/blueprints/generate', {
        method: 'POST',
        body: JSON.stringify({
          blueprintId: 'test-blueprint-id',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Dynamic questionnaire incomplete');
    });
  });
});
