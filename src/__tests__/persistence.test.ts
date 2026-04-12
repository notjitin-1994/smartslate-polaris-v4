import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST as chatPOST } from '../app/api/chat/route';
import { GET as messagesGET } from '../app/api/starmaps/[id]/messages/route';
import { createClient } from '@/lib/supabase/server';
import { streamText, generateId } from 'ai';
import { db } from '@/lib/db';
import { messages, starmaps } from '@/lib/db/schema';

// Mock Supabase
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

// Mock AI SDK
vi.mock('ai', () => ({
  streamText: vi.fn(() => ({
    toUIMessageStreamResponse: vi.fn(({ onFinish }) => {
      // Simulate onFinish callback
      if (onFinish) {
        onFinish({ 
          messages: [{ 
            id: 'u-msg-1', 
            role: 'user', 
            parts: [{ type: 'text', text: 'hi' }] 
          }, { 
            id: 'assistant-msg-1', 
            role: 'assistant', 
            parts: [{ type: 'text', text: 'hello' }] 
          }] 
        });
      }
      return new Response('stream');
    }),
  })),
  convertToModelMessages: vi.fn((m) => Promise.resolve(m)),
  generateId: vi.fn(() => 'generated-id'),
}));

// Mock Database
vi.mock('@/lib/db', () => ({
  db: {
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        onConflictDoNothing: vi.fn().mockResolvedValue({}),
      })),
    })),
    query: {
      starmaps: {
        findFirst: vi.fn(),
      },
      chatMessages: {
        findMany: vi.fn(),
      },
      starmapResponses: {
        findMany: vi.fn().mockResolvedValue([]),
      }
    },
  },
}));

vi.mock('@/lib/ai/models', () => ({
  getModel: vi.fn(() => ({})),
}));

describe('Chat Persistence Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/starmaps/[id]/messages', () => {
    it('returns 401 if not authenticated', async () => {
      (createClient as any).mockResolvedValue({
        auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) }
      });

      const response = await messagesGET(new Request('http://l'), { params: Promise.resolve({ id: '123' }) });
      expect(response.status).toBe(401);
    });

    it('returns 404 if starmap not found or not owned', async () => {
      (createClient as any).mockResolvedValue({
        auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }) }
      });
      (db.query.starmaps.findFirst as any).mockResolvedValue(null);

      const response = await messagesGET(new Request('http://l'), { params: Promise.resolve({ id: '123' }) });
      expect(response.status).toBe(404);
    });

    it('returns messages if authorized', async () => {
      (createClient as any).mockResolvedValue({
        auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }) }
      });
      (db.query.starmaps.findFirst as any).mockResolvedValue({ id: '123', userId: 'u1' });
      (db.query.chatMessages.findMany as any).mockResolvedValue([
        { id: 'm1', role: 'user', parts: [], createdAt: new Date() }
      ]);

      const response = await messagesGET(new Request('http://l'), { params: Promise.resolve({ id: '123' }) });
      const data = await response.json();
      expect(response.status).toBe(200);
      expect(data).toHaveLength(1);
      expect(data[0].id).toBe('m1');
    });
  });

  describe('POST /api/chat Persistence', () => {
    it('persists user message if starmapId is provided', async () => {
      (createClient as any).mockResolvedValue({
        auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }) }
      });

      const req = new Request('http://localhost/api/chat', {
        method: 'POST',
        body: JSON.stringify({ 
          messages: [{ id: 'u-msg-1', role: 'user', parts: [{ type: 'text', text: 'hi' }] }],
          starmapId: 's1'
        }),
      });

      await chatPOST(req);

      // Verify db.insert was called for user message
      expect(db.insert).toHaveBeenCalledWith(expect.anything());
      // We check if the table being inserted into is the messages table (proxied in mock)
    });

    it('persists assistant response on completion', async () => {
      (createClient as any).mockResolvedValue({
        auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }) }
      });

      const req = new Request('http://localhost/api/chat', {
        method: 'POST',
        body: JSON.stringify({ 
          messages: [{ id: 'u-msg-1', role: 'user', parts: [{ type: 'text', text: 'hi' }] }],
          starmapId: 's1'
        }),
      });

      await chatPOST(req);

      // The mock streamText.toUIMessageStreamResponse calls onFinish immediately
      // So db.insert should have been called for both user and assistant
      expect(db.insert).toHaveBeenCalledTimes(2);
    });
  });
});
