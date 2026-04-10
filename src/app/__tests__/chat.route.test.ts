import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '../api/chat/route';
import { streamText } from 'ai';
import { getModel } from '@/lib/ai/models';

// Mock AI SDK
vi.mock('ai', () => ({
  streamText: vi.fn(() => ({
    toUIMessageStreamResponse: vi.fn(() => new Response('stream-content')),
  })),
  convertToModelMessages: vi.fn((messages) => Promise.resolve(messages)),
}));

// Mock Supabase Server
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve({
    auth: {
      getUser: vi.fn(() => Promise.resolve({ data: { user: { id: 'test-user' } }, error: null })),
    },
  })),
}));

// Mock Models
vi.mock('@/lib/ai/models', () => ({
  getModel: vi.fn(() => ({ type: 'mock-model' })),
}));

// Mock Prompts
vi.mock('@/lib/ai/prompts', () => ({
  DISCOVERY_SYSTEM_PROMPT: 'Discovery system prompt',
}));

describe('Chat API Route Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls streamText with correct parameters', async () => {
    const messages = [{ id: '1', role: 'user', content: 'Hello' }];
    const req = new Request('http://localhost/api/chat', {
      method: 'POST',
      body: JSON.stringify({ messages, modelId: 'test-model', starmapId: 'test-starmap' }),
    });

    const response = await POST(req);
    
    expect(getModel).toHaveBeenCalledWith('test-model');
    expect(streamText).toHaveBeenCalledWith(expect.objectContaining({
      system: expect.stringContaining('Discovery system prompt'),
      messages: expect.any(Array),
      tools: expect.any(Object),
    }));
    
    expect(streamText).toHaveBeenCalledWith(expect.objectContaining({
      system: expect.stringContaining('CURRENT STARMAP ID: test-starmap'),
    }));

    const content = await response.text();
    expect(content).toBe('stream-content');
  });

  it('uses default model if modelId is not provided', async () => {
    const messages = [{ id: '1', role: 'user', content: 'Hello' }];
    const req = new Request('http://localhost/api/chat', {
      method: 'POST',
      body: JSON.stringify({ messages }),
    });

    await POST(req);
    expect(getModel).toHaveBeenCalledWith(undefined);
  });
});
