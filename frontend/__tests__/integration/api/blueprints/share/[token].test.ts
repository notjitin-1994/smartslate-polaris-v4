/**
 * API Integration Tests: GET /api/blueprints/share/[token]
 *
 * Core test coverage for public blueprint share access endpoint focusing on:
 * - Public Access (no authentication required)
 * - Share Token Validation
 * - Blueprint Completion Verification
 * - Data Security (only public-safe fields returned)
 * - Error Handling
 *
 * This is a PUBLIC endpoint that uses anon key with RLS policies.
 * It must NOT expose sensitive data like user_id, answers, or incomplete blueprints.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/blueprints/share/[token]/route';
import { NextRequest } from 'next/server';

// Mock Supabase
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(),
}));

describe('GET /api/blueprints/share/[token] - Public Share Access', () => {
  const mockShareToken = 'valid-share-token-123';
  const mockBlueprintId = 'blueprint-id-123';
  const mockBlueprintJson = {
    title: 'Test Blueprint',
    sections: [{ name: 'Section 1' }],
  };
  const mockBlueprintMarkdown = '# Test Blueprint\n\n## Section 1';
  const mockCreatedAt = '2025-01-12T10:00:00Z';

  async function createMockParams(token: string) {
    return Promise.resolve({ token });
  }

  function createMockRequest(): NextRequest {
    return {} as NextRequest;
  }

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Request Validation', () => {
    it('should return 400 when token is missing', async () => {
      // Arrange
      const params = createMockParams('');
      const request = createMockRequest();

      // Act
      const response = await GET(request, { params });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data).toEqual({ error: 'Share token is required' });
    });
  });

  describe('Successful Access', () => {
    it('should return blueprint data when valid share token is provided', async () => {
      // Arrange
      const mockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: mockBlueprintId,
            blueprint_json: mockBlueprintJson,
            blueprint_markdown: mockBlueprintMarkdown,
            title: 'Test Blueprint',
            created_at: mockCreatedAt,
          },
          error: null,
        }),
      };

      const mockSupabase = {
        from: vi.fn(() => mockQueryBuilder),
      };

      const { createClient } = await import('@supabase/supabase-js');
      vi.mocked(createClient).mockReturnValue(mockSupabase as any);

      const params = createMockParams(mockShareToken);
      const request = createMockRequest();

      // Act
      const response = await GET(request, { params });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data).toEqual({
        success: true,
        blueprint: {
          id: mockBlueprintId,
          title: 'Test Blueprint',
          created_at: mockCreatedAt,
          blueprint_json: mockBlueprintJson,
          blueprint_markdown: mockBlueprintMarkdown,
        },
      });
    });

    it('should use anon key for public access', async () => {
      // Arrange
      const mockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: mockBlueprintId,
            blueprint_json: mockBlueprintJson,
            blueprint_markdown: mockBlueprintMarkdown,
            title: 'Test Blueprint',
            created_at: mockCreatedAt,
          },
          error: null,
        }),
      };

      const mockSupabase = {
        from: vi.fn(() => mockQueryBuilder),
      };

      const { createClient } = await import('@supabase/supabase-js');
      vi.mocked(createClient).mockReturnValue(mockSupabase as any);

      const params = createMockParams(mockShareToken);
      const request = createMockRequest();

      // Act
      await GET(request, { params });

      // Assert - Verify createClient was called with anon key
      expect(createClient).toHaveBeenCalledWith(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      );
    });

    it('should query blueprint by share_token', async () => {
      // Arrange
      const mockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: mockBlueprintId,
            blueprint_json: mockBlueprintJson,
            blueprint_markdown: mockBlueprintMarkdown,
            title: 'Test Blueprint',
            created_at: mockCreatedAt,
          },
          error: null,
        }),
      };

      const mockSupabase = {
        from: vi.fn(() => mockQueryBuilder),
      };

      const { createClient } = await import('@supabase/supabase-js');
      vi.mocked(createClient).mockReturnValue(mockSupabase as any);

      const params = createMockParams(mockShareToken);
      const request = createMockRequest();

      // Act
      await GET(request, { params });

      // Assert
      expect(mockQueryBuilder.select).toHaveBeenCalledWith(
        'id, blueprint_json, blueprint_markdown, title, created_at'
      );
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('share_token', mockShareToken);
      expect(mockQueryBuilder.single).toHaveBeenCalled();
    });

    it('should work with blueprint that has markdown', async () => {
      // Arrange
      const mockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: mockBlueprintId,
            blueprint_json: mockBlueprintJson,
            blueprint_markdown: mockBlueprintMarkdown,
            title: 'Test Blueprint',
            created_at: mockCreatedAt,
          },
          error: null,
        }),
      };

      const mockSupabase = {
        from: vi.fn(() => mockQueryBuilder),
      };

      const { createClient } = await import('@supabase/supabase-js');
      vi.mocked(createClient).mockReturnValue(mockSupabase as any);

      const params = createMockParams(mockShareToken);
      const request = createMockRequest();

      // Act
      const response = await GET(request, { params });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.blueprint.blueprint_markdown).toBe(mockBlueprintMarkdown);
    });

    it('should work with blueprint that has no markdown', async () => {
      // Arrange
      const mockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: mockBlueprintId,
            blueprint_json: mockBlueprintJson,
            blueprint_markdown: null,
            title: 'Test Blueprint',
            created_at: mockCreatedAt,
          },
          error: null,
        }),
      };

      const mockSupabase = {
        from: vi.fn(() => mockQueryBuilder),
      };

      const { createClient } = await import('@supabase/supabase-js');
      vi.mocked(createClient).mockReturnValue(mockSupabase as any);

      const params = createMockParams(mockShareToken);
      const request = createMockRequest();

      // Act
      const response = await GET(request, { params });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.blueprint.blueprint_markdown).toBeNull();
    });
  });

  describe('Blueprint Not Found', () => {
    it('should return 404 when share token does not exist', async () => {
      // Arrange
      const mockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Not found' },
        }),
      };

      const mockSupabase = {
        from: vi.fn(() => mockQueryBuilder),
      };

      const { createClient } = await import('@supabase/supabase-js');
      vi.mocked(createClient).mockReturnValue(mockSupabase as any);

      const params = createMockParams('invalid-token');
      const request = createMockRequest();

      // Act
      const response = await GET(request, { params });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(404);
      expect(data).toEqual({ error: 'Blueprint not found or sharing is disabled' });
    });

    it('should return 404 when database query fails', async () => {
      // Arrange
      const mockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' },
        }),
      };

      const mockSupabase = {
        from: vi.fn(() => mockQueryBuilder),
      };

      const { createClient } = await import('@supabase/supabase-js');
      vi.mocked(createClient).mockReturnValue(mockSupabase as any);

      const params = createMockParams(mockShareToken);
      const request = createMockRequest();

      // Act
      const response = await GET(request, { params });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(404);
      expect(data).toEqual({ error: 'Blueprint not found or sharing is disabled' });
    });
  });

  describe('Blueprint Completion Verification', () => {
    it('should return 404 when blueprint_json is null (not generated)', async () => {
      // Arrange
      const mockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: mockBlueprintId,
            blueprint_json: null, // Not generated yet
            blueprint_markdown: null,
            title: 'Test Blueprint',
            created_at: mockCreatedAt,
          },
          error: null,
        }),
      };

      const mockSupabase = {
        from: vi.fn(() => mockQueryBuilder),
      };

      const { createClient } = await import('@supabase/supabase-js');
      vi.mocked(createClient).mockReturnValue(mockSupabase as any);

      const params = createMockParams(mockShareToken);
      const request = createMockRequest();

      // Act
      const response = await GET(request, { params });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(404);
      expect(data).toEqual({ error: 'Blueprint is not ready for sharing' });
    });

    it('should return 404 when blueprint_json is undefined', async () => {
      // Arrange
      const mockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: mockBlueprintId,
            blueprint_json: undefined,
            blueprint_markdown: null,
            title: 'Test Blueprint',
            created_at: mockCreatedAt,
          },
          error: null,
        }),
      };

      const mockSupabase = {
        from: vi.fn(() => mockQueryBuilder),
      };

      const { createClient } = await import('@supabase/supabase-js');
      vi.mocked(createClient).mockReturnValue(mockSupabase as any);

      const params = createMockParams(mockShareToken);
      const request = createMockRequest();

      // Act
      const response = await GET(request, { params });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(404);
      expect(data).toEqual({ error: 'Blueprint is not ready for sharing' });
    });
  });

  describe('Data Security', () => {
    it('should NOT return sensitive fields (user_id, answers)', async () => {
      // Arrange
      const mockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: mockBlueprintId,
            blueprint_json: mockBlueprintJson,
            blueprint_markdown: mockBlueprintMarkdown,
            title: 'Test Blueprint',
            created_at: mockCreatedAt,
            // These fields should NOT be in the SELECT, but let's verify they're not returned
          },
          error: null,
        }),
      };

      const mockSupabase = {
        from: vi.fn(() => mockQueryBuilder),
      };

      const { createClient } = await import('@supabase/supabase-js');
      vi.mocked(createClient).mockReturnValue(mockSupabase as any);

      const params = createMockParams(mockShareToken);
      const request = createMockRequest();

      // Act
      const response = await GET(request, { params });
      const data = await response.json();

      // Assert - Verify sensitive fields are not in response
      expect(data.blueprint).not.toHaveProperty('user_id');
      expect(data.blueprint).not.toHaveProperty('static_answers');
      expect(data.blueprint).not.toHaveProperty('dynamic_answers');
      expect(data.blueprint).not.toHaveProperty('share_token');
      expect(data.blueprint).not.toHaveProperty('status');
    });

    it('should only select public-safe fields from database', async () => {
      // Arrange
      const mockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: mockBlueprintId,
            blueprint_json: mockBlueprintJson,
            blueprint_markdown: mockBlueprintMarkdown,
            title: 'Test Blueprint',
            created_at: mockCreatedAt,
          },
          error: null,
        }),
      };

      const mockSupabase = {
        from: vi.fn(() => mockQueryBuilder),
      };

      const { createClient } = await import('@supabase/supabase-js');
      vi.mocked(createClient).mockReturnValue(mockSupabase as any);

      const params = createMockParams(mockShareToken);
      const request = createMockRequest();

      // Act
      await GET(request, { params });

      // Assert - Verify only safe fields are selected
      const selectCall = mockQueryBuilder.select.mock.calls[0][0];
      expect(selectCall).toBe('id, blueprint_json, blueprint_markdown, title, created_at');
      expect(selectCall).not.toContain('user_id');
      expect(selectCall).not.toContain('static_answers');
      expect(selectCall).not.toContain('dynamic_answers');
    });
  });

  describe('Error Handling', () => {
    it('should return 500 when unexpected error occurs', async () => {
      // Arrange
      const { createClient } = await import('@supabase/supabase-js');
      vi.mocked(createClient).mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      const params = createMockParams(mockShareToken);
      const request = createMockRequest();

      // Act
      const response = await GET(request, { params });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data).toEqual({ error: 'Internal server error' });
    });
  });
});
