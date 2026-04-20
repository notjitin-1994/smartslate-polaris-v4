import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST, GET } from '@/app/api/generate-blueprint/route';

/**
 * Tests for /api/generate-blueprint (Redirect to Gemini)
 * This route has been migrated from Ollama to Gemini AI.
 * It now acts as a proxy/redirect to /api/claude/generate-blueprint
 */

describe('/api/generate-blueprint (Redirect to Gemini)', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock the global fetch function
    global.fetch = vi.fn();
  });

  describe('POST - Blueprint Generation (Redirect)', () => {
    it('should successfully redirect to Gemini endpoint', async () => {
      const mockGeminiResponse = {
        success: true,
        blueprint: {
          title: 'Test Blueprint',
          overview: 'Test overview',
          learningObjectives: ['Objective 1'],
          modules: [],
        },
        usage: {
          input_tokens: 100,
          output_tokens: 200,
        },
        metadata: {
          model: 'gemini-3.1-pro-preview',
          duration: 1500,
          timestamp: new Date().toISOString(),
        },
      };

      // Mock fetch to simulate Gemini endpoint response
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockGeminiResponse,
      } as Response);

      const requestBody = {
        blueprintId: '123e4567-e89b-12d3-a456-426614174000',
        systemPrompt: 'You are a blueprint generator',
        userPrompt: 'Create a blueprint for React',
      };

      const request = new NextRequest('http://localhost:3000/api/generate-blueprint', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.blueprint).toBeDefined();
      expect(data.blueprint.title).toBe('Test Blueprint');

      // Verify fetch was called with correct URL
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/claude/generate-blueprint'),
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        })
      );
    });

    it('should handle Gemini endpoint errors gracefully', async () => {
      // Mock fetch to simulate Gemini endpoint error
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      } as Response);

      const request = new NextRequest('http://localhost:3000/api/generate-blueprint', {
        method: 'POST',
        body: JSON.stringify({
          blueprintId: '123e4567-e89b-12d3-a456-426614174001',
          systemPrompt: 'System',
          userPrompt: 'User',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Blueprint generation failed');
      expect(data.details).toBe('Internal Server Error');
    });

    it('should handle invalid request body', async () => {
      const request = new NextRequest('http://localhost:3000/api/generate-blueprint', {
        method: 'POST',
        body: 'invalid json',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });

    it('should handle fetch failures (network errors)', async () => {
      // Mock fetch to simulate network error
      vi.mocked(global.fetch).mockRejectedValueOnce(new Error('Network error'));

      const request = new NextRequest('http://localhost:3000/api/generate-blueprint', {
        method: 'POST',
        body: JSON.stringify({
          blueprintId: '123e4567-e89b-12d3-a456-426614174002',
          systemPrompt: 'System',
          userPrompt: 'User',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
      expect(data.details).toBe('Network error');
    });

    it('should handle Gemini endpoint returning 400 (Bad Request)', async () => {
      // Mock fetch to simulate Gemini endpoint validation error
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
      } as Response);

      const request = new NextRequest('http://localhost:3000/api/generate-blueprint', {
        method: 'POST',
        body: JSON.stringify({
          blueprintId: 'invalid-id',
          systemPrompt: '',
          userPrompt: '',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Blueprint generation failed');
    });

    it('should handle Gemini endpoint timeout (504)', async () => {
      // Mock fetch to simulate timeout
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        status: 504,
        statusText: 'Gateway Timeout',
      } as Response);

      const request = new NextRequest('http://localhost:3000/api/generate-blueprint', {
        method: 'POST',
        body: JSON.stringify({
          blueprintId: '123e4567-e89b-12d3-a456-426614174003',
          systemPrompt: 'System',
          userPrompt: 'User',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(504);
      expect(data.error).toBe('Blueprint generation failed');
      expect(data.details).toBe('Gateway Timeout');
    });
  });

  describe('GET - Migration Information', () => {
    it('should return migration information', async () => {
      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe('This endpoint has been migrated to use Gemini AI');
      expect(data.newEndpoint).toBe('/api/claude/generate-blueprint');
      expect(data.status).toBe('migrated');
    });
  });
});
