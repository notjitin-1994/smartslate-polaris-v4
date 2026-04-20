import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/generate-blueprint/route';

vi.mock('@/lib/ollama/client', () => ({
  OllamaClient: vi.fn(() => ({
    health: vi.fn().mockResolvedValue(true),
    streamBlueprint: vi.fn().mockResolvedValue(
      new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode('{"done": true}'));
          controller.close();
        },
      })
    ),
  })),
}));

vi.mock('@/lib/supabase/server', () => ({
  getSupabaseServerClient: vi.fn(async () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => ({
            single: async () => ({
              data: { id: 'bid', user_id: 'u', static_answers: {}, dynamic_answers: {} },
              error: null,
            }),
          }),
        }),
      }),
    }),
  })),
  getServerSession: vi.fn(async () => ({ session: { user: { id: 'u' } }, error: null })),
}));

vi.mock('@/lib/ollama/blueprintValidation', () => ({
  parseAndValidateBlueprintJSON: vi.fn(() => ({ title: 'ok' })),
}));

vi.mock('@/lib/services/markdownGenerator', () => ({
  markdownGeneratorService: { generateMarkdown: vi.fn(() => '# md') },
}));

vi.mock('@/lib/fallbacks/blueprintFallbacks', () => ({
  blueprintFallbackService: { getFallbackBlueprint: vi.fn(() => ({ title: 'fallback' })) },
}));

vi.mock('@/lib/db/blueprints.server', () => ({
  createServerBlueprintService: vi.fn(async () => ({
    hasCompletedGeneration: vi.fn(async () => false),
    saveBlueprint: vi.fn(async () => ({ id: 'saved-id' })),
  })),
}));

vi.mock('@/lib/services/answerAggregation', () => ({
  answerAggregationService: {
    getAggregatedAnswers: vi.fn(async () => ({ staticResponses: [], dynamicResponses: [] })),
  },
}));

describe('generate-blueprint API server session & GET', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('uses server session (401 when missing)', async () => {
    const mod = await import('@/lib/supabase/server');
    vi.spyOn(mod, 'getServerSession').mockResolvedValueOnce({ session: null, error: null } as any);

    const req = new NextRequest('http://localhost:3000/api/generate-blueprint', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('supports GET with bid query param', async () => {
    const req = new NextRequest(
      'http://localhost:3000/api/generate-blueprint?bid=00000000-0000-0000-0000-000000000000',
      { method: 'GET' }
    );
    const res = await GET(req);
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('text/event-stream');
  });
});
