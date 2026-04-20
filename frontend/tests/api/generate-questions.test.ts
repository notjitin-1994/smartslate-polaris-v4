import { describe, it, expect, vi, beforeAll } from 'vitest';

function makeRequest(body: unknown): Request {
  return new Request('http://localhost/api/generate-questions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

let POST: (req: Request) => Promise<Response>;
let getCallCount: () => number;

// Mock before importing the route
vi.mock('@/lib/ollama/client', () => {
  let calls = 0;
  return {
    OllamaClient: class {
      async generateQuestions() {
        calls += 1;
        return {
          sections: [
            { title: 'S', questions: [{ id: 'q', question: 'Q', type: 'text', required: true }] },
          ],
        };
      }
    },
    getCallCount: () => calls,
  };
});

beforeAll(async () => {
  ({ POST } = await import('@/app/api/generate-questions/route'));
  ({ getCallCount } = await import('@/lib/ollama/client'));
});

describe('POST /api/generate-questions', () => {
  it('returns 400 on invalid body', async () => {
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(400);
  });

  it('returns 200 with valid JSON on success', async () => {
    const res = await POST(
      makeRequest({
        assessmentType: 'Quiz',
        deliveryMethod: 'Online',
        duration: '30m',
        learningObjectives: ['Obj1'],
        targetAudience: 'Developers',
      })
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(Array.isArray(json.sections)).toBe(true);
  });

  it('deduplicates in-flight requests and uses cache on repeat', async () => {
    const reqBody = {
      assessmentType: 'Quiz',
      deliveryMethod: 'Online',
      duration: '30m',
      learningObjectives: ['Obj1'],
      targetAudience: 'Developers',
    };

    const [r1, r2] = await Promise.all([POST(makeRequest(reqBody)), POST(makeRequest(reqBody))]);
    expect(r1.status).toBe(200);
    expect(r2.status).toBe(200);
    expect(getCallCount()).toBe(1);

    // Third call should hit cache and not increment
    const r3 = await POST(makeRequest(reqBody));
    expect(r3.status).toBe(200);
    expect(getCallCount()).toBe(1);
  });
});
