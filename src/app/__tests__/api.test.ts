import { describe, it, expect, vi } from 'vitest';
import { POST } from '../api/chat/route';

// Mock dependencies
vi.mock('@ai-sdk/react', () => ({
  streamText: vi.fn(),
  convertToModelMessages: vi.fn(),
}));

vi.mock('@/lib/ai/models', () => ({
  getModel: vi.fn(() => ({ type: 'test-model' })),
}));

vi.mock('@/lib/ai/prompts', () => ({
  DISCOVERY_SYSTEM_PROMPT: 'Test system prompt',
}));

describe('Chat API Route', () => {
  it('should export POST function', () => {
    expect(POST).toBeDefined();
    expect(typeof POST).toBe('function');
  });

  it('should have maxDuration export', () => {
    const { maxDuration } = require('../api/chat/route');
    expect(maxDuration).toBe(30);
  });
});
