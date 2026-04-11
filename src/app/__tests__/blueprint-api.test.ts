import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST as assumptionsPOST } from '../api/starmaps/[id]/assumptions/route';
import { POST as blueprintPOST } from '../api/starmaps/[id]/blueprint/route';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { streamObject } from 'ai';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  db: {
    query: {
      starmaps: {
        findFirst: vi.fn(),
      },
    },
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn().mockResolvedValue({}),
      })),
    })),
  },
}));

vi.mock('ai', () => ({
  streamObject: vi.fn(() => ({
    toTextStreamResponse: vi.fn(() => new Response('stream')),
  })),
}));

vi.mock('@/lib/ai/models', () => ({
  getModel: vi.fn(() => ({})),
}));

describe('Blueprint API Workflow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Assumptions API', () => {
    it('returns 401 for unauthenticated user', async () => {
      (createClient as any).mockResolvedValue({
        auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) }
      });

      const req = new Request('http://localhost', { method: 'POST' });
      const res = await assumptionsPOST(req, { params: Promise.resolve({ id: '123' }) });
      expect(res.status).toBe(401);
    });

    it('returns 404 for non-existent or unauthorized starmap', async () => {
      (createClient as any).mockResolvedValue({
        auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }) }
      });
      (db.query.starmaps.findFirst as any).mockResolvedValue(null);

      const req = new Request('http://localhost', { method: 'POST' });
      const res = await assumptionsPOST(req, { params: Promise.resolve({ id: '123' }) });
      expect(res.status).toBe(404);
    });

    it('starts streaming assumptions for authorized owner', async () => {
      (createClient as any).mockResolvedValue({
        auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }) }
      });
      (db.query.starmaps.findFirst as any).mockResolvedValue({
        id: '123',
        userId: 'u1',
        starmapResponses: []
      });

      const req = new Request('http://localhost', { method: 'POST' });
      const res = await assumptionsPOST(req, { params: Promise.resolve({ id: '123' }) });
      expect(res.status).toBe(200);
      expect(streamObject).toHaveBeenCalled();
    });
  });

  describe('Blueprint API', () => {
    it('requires approvedAssumptions in body', async () => {
      (createClient as any).mockResolvedValue({
        auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }) }
      });
      (db.query.starmaps.findFirst as any).mockResolvedValue({
        id: '123',
        userId: 'u1',
        starmapResponses: []
      });

      const req = new Request('http://localhost', {
        method: 'POST',
        body: JSON.stringify({ approvedAssumptions: ['test'] })
      });
      const res = await blueprintPOST(req, { params: Promise.resolve({ id: '123' }) });
      expect(res.status).toBe(200);
      expect(streamObject).toHaveBeenCalled();
    });
  });
});
