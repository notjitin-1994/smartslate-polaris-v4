import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST as chatPOST } from '../app/api/chat/route';
import { createClient } from '@/lib/supabase/server';
import { streamText } from 'ai';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('ai', () => ({
  streamText: vi.fn(() => ({
    toUIMessageStreamResponse: vi.fn(() => new Response('stream')),
  })),
  convertToModelMessages: vi.fn((m) => Promise.resolve(m)),
}));

vi.mock('@/lib/ai/models', () => ({
  getModel: vi.fn(() => ({})),
}));

describe('Comprehensive API Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Chat API', () => {
    it('returns 401 if not authenticated', async () => {
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
        },
      };
      (createClient as any).mockResolvedValue(mockSupabase);

      const req = new Request('http://localhost/api/chat', {
        method: 'POST',
        body: JSON.stringify({ messages: [] }),
      });

      const response = await chatPOST(req);
      expect(response.status).toBe(401);
    });

    it('returns 200 and streams if authenticated', async () => {
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null }),
        },
      };
      (createClient as any).mockResolvedValue(mockSupabase);

      const req = new Request('http://localhost/api/chat', {
        method: 'POST',
        body: JSON.stringify({ messages: [{ role: 'user', content: 'hi' }] }),
      });

      const response = await chatPOST(req);
      expect(response.status).toBe(200);
      expect(streamText).toHaveBeenCalled();
    });
  });
});
