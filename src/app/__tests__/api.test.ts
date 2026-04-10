import { describe, it, expect, vi } from 'vitest';

// Mock dependencies before importing the route
vi.mock('ai', () => ({
  streamText: vi.fn(() => ({
    toUIMessageStreamResponse: vi.fn(() => new Response()),
  })),
  convertToModelMessages: vi.fn(() => Promise.resolve([])),
  UIMessage: {},
}));

vi.mock('@/lib/ai/models', () => ({
  getModel: vi.fn(() => ({ type: 'test-model' })),
}));

vi.mock('@/lib/ai/prompts', () => ({
  DISCOVERY_SYSTEM_PROMPT: 'Test system prompt',
}));

describe('Chat API Route', () => {
  it('should export POST function', async () => {
    const { POST } = await import('../api/chat/route');
    expect(POST).toBeDefined();
    expect(typeof POST).toBe('function');
  });

  it('should export maxDuration as 30', async () => {
    const mod = await import('../api/chat/route');
    // maxDuration is an export const at module level
    expect(mod.maxDuration).toBe(30);
  });
});
