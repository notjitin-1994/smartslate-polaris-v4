/**
 * Edit Section Data Loss Prevention Tests
 *
 * These tests ensure that the edit section feature never causes data loss.
 * All tests must pass before the feature can be considered safe to use.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { PATCH } from '@/app/api/blueprints/update-section/route';
import { NextRequest } from 'next/server';

// Mock Supabase
const mockSupabaseClient = {
  from: vi.fn(),
};

const mockSession = {
  user: { id: 'test-user-id' },
};

vi.mock('@/lib/supabase/server', () => ({
  getServerSession: vi.fn(() => Promise.resolve({ session: mockSession })),
  getSupabaseServerClient: vi.fn(() => Promise.resolve(mockSupabaseClient)),
}));

vi.mock('@/lib/logging', () => ({
  createServiceLogger: vi.fn(() => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  })),
}));

// Helper to create mock NextRequest
function createMockRequest(body: any): NextRequest {
  const request = new NextRequest('http://localhost:3000/api/blueprints/update-section', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  return request;
}

describe('Edit Section - Data Loss Prevention', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Critical: Null/Undefined Data Protection', () => {
    it('should reject null section data', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                id: 'blueprint-id',
                user_id: 'test-user-id',
                blueprint_json: {
                  learning_objectives: { objectives: [] },
                },
              },
              error: null,
            }),
          }),
        }),
      });

      mockSupabaseClient.from = vi.fn().mockReturnValue({
        select: mockSelect,
      });

      const req = createMockRequest({
        blueprintId: 'blueprint-id',
        sectionId: 'learning_objectives',
        data: null, // NULL DATA - SHOULD BE REJECTED
      });

      const response = await PATCH(req);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error).toContain('null or undefined');
      expect(body.success).toBe(false);
    });

    it('should reject undefined section data', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                id: 'blueprint-id',
                user_id: 'test-user-id',
                blueprint_json: {
                  learning_objectives: { objectives: [] },
                },
              },
              error: null,
            }),
          }),
        }),
      });

      mockSupabaseClient.from = vi.fn().mockReturnValue({
        select: mockSelect,
      });

      const req = createMockRequest({
        blueprintId: 'blueprint-id',
        sectionId: 'learning_objectives',
        // data field omitted - undefined
      });

      const response = await PATCH(req);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error).toContain('required');
    });
  });

  describe('Critical: Data Backup and Rollback', () => {
    it('should rollback on verification failure', async () => {
      const originalData = {
        objectives: [
          { id: 1, title: 'Objective 1' },
          { id: 2, title: 'Objective 2' },
        ],
      };

      const mockUpdate = vi.fn();

      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                id: 'blueprint-id',
                user_id: 'test-user-id',
                blueprint_json: {
                  learning_objectives: originalData,
                },
              },
              error: null,
            }),
          }),
        }),
      });

      mockSupabaseClient.from = vi.fn().mockImplementation((table) => {
        if (table === 'blueprint_generator') {
          return {
            select: mockSelect,
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  select: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                      data: {
                        blueprint_json: {}, // MISSING SECTION - SHOULD TRIGGER ROLLBACK
                      },
                      error: null,
                    }),
                  }),
                }),
              }),
            }),
          };
        }
        return { select: mockSelect };
      });

      const req = createMockRequest({
        blueprintId: 'blueprint-id',
        sectionId: 'learning_objectives',
        data: { objectives: [{ id: 1, title: 'Modified' }] },
      });

      const response = await PATCH(req);
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.error).toContain('rolled back');
      expect(body.success).toBe(false);
    });
  });

  describe('Critical: Structure Validation', () => {
    it('should preserve nested object structures', async () => {
      const complexData = {
        objectives: [
          {
            id: 1,
            title: 'Master Prompt Engineering',
            description: 'Achieve desired AI outputs',
            metrics: 'Iteration count',
            baseline: '10+ iterations',
            target: '≤3 iterations',
            dueDate: 'Feb 25, 2025',
          },
        ],
        chartConfig: {
          type: 'bar',
          colors: ['#00FF00'],
        },
      };

      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  blueprint_json: {
                    learning_objectives: complexData,
                  },
                },
                error: null,
              }),
            }),
          }),
        }),
      });

      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                id: 'blueprint-id',
                user_id: 'test-user-id',
                blueprint_json: {
                  learning_objectives: complexData,
                },
              },
              error: null,
            }),
          }),
        }),
      });

      mockSupabaseClient.from = vi.fn().mockReturnValue({
        select: mockSelect,
        update: mockUpdate,
      });

      const req = createMockRequest({
        blueprintId: 'blueprint-id',
        sectionId: 'learning_objectives',
        data: complexData,
      });

      const response = await PATCH(req);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
    });

    it('should handle arrays correctly', async () => {
      const arrayData = [
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' },
        { id: 3, name: 'Item 3' },
      ];

      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  blueprint_json: {
                    items: arrayData,
                  },
                },
                error: null,
              }),
            }),
          }),
        }),
      });

      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                id: 'blueprint-id',
                user_id: 'test-user-id',
                blueprint_json: {
                  items: [],
                },
              },
              error: null,
            }),
          }),
        }),
      });

      mockSupabaseClient.from = vi.fn().mockReturnValue({
        select: mockSelect,
        update: mockUpdate,
      });

      const req = createMockRequest({
        blueprintId: 'blueprint-id',
        sectionId: 'items',
        data: arrayData,
      });

      const response = await PATCH(req);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
    });
  });

  describe('Critical: Authorization and Ownership', () => {
    it('should reject unauthorized access', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Not found' },
            }),
          }),
        }),
      });

      mockSupabaseClient.from = vi.fn().mockReturnValue({
        select: mockSelect,
      });

      const req = createMockRequest({
        blueprintId: 'other-user-blueprint',
        sectionId: 'learning_objectives',
        data: { objectives: [] },
      });

      const response = await PATCH(req);
      const body = await response.json();

      expect(response.status).toBe(404);
      expect(body.error).toContain('not found');
    });
  });

  describe('Critical: Database Error Handling', () => {
    it('should handle database update errors gracefully', async () => {
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { message: 'Database connection failed', code: 'PGRST500' },
              }),
            }),
          }),
        }),
      });

      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                id: 'blueprint-id',
                user_id: 'test-user-id',
                blueprint_json: {
                  learning_objectives: { objectives: [] },
                },
              },
              error: null,
            }),
          }),
        }),
      });

      mockSupabaseClient.from = vi.fn().mockReturnValue({
        select: mockSelect,
        update: mockUpdate,
      });

      const req = createMockRequest({
        blueprintId: 'blueprint-id',
        sectionId: 'learning_objectives',
        data: { objectives: [{ id: 1, title: 'Test' }] },
      });

      const response = await PATCH(req);
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.error).toBeDefined();
      expect(body.success).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty objects with confirmation', async () => {
      const emptyData = {};

      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  blueprint_json: {
                    learning_objectives: emptyData,
                  },
                },
                error: null,
              }),
            }),
          }),
        }),
      });

      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                id: 'blueprint-id',
                user_id: 'test-user-id',
                blueprint_json: {
                  learning_objectives: { objectives: [] },
                },
              },
              error: null,
            }),
          }),
        }),
      });

      mockSupabaseClient.from = vi.fn().mockReturnValue({
        select: mockSelect,
        update: mockUpdate,
      });

      const req = createMockRequest({
        blueprintId: 'blueprint-id',
        sectionId: 'learning_objectives',
        data: emptyData,
      });

      const response = await PATCH(req);
      const body = await response.json();

      // Empty objects should be allowed (might be intentional clearing)
      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
    });

    it('should handle special characters in data', async () => {
      const dataWithSpecialChars = {
        objectives: [
          {
            id: 1,
            title: 'Test\'s "Special" Characters & Symbols',
            description: 'Contains <html> tags, émojis 🎉, and newlines\n\nLike this',
          },
        ],
      };

      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  blueprint_json: {
                    learning_objectives: dataWithSpecialChars,
                  },
                },
                error: null,
              }),
            }),
          }),
        }),
      });

      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                id: 'blueprint-id',
                user_id: 'test-user-id',
                blueprint_json: {
                  learning_objectives: {},
                },
              },
              error: null,
            }),
          }),
        }),
      });

      mockSupabaseClient.from = vi.fn().mockReturnValue({
        select: mockSelect,
        update: mockUpdate,
      });

      const req = createMockRequest({
        blueprintId: 'blueprint-id',
        sectionId: 'learning_objectives',
        data: dataWithSpecialChars,
      });

      const response = await PATCH(req);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
    });

    it('should handle large data payloads', async () => {
      // Create a large dataset with 100 objectives
      const largeData = {
        objectives: Array.from({ length: 100 }, (_, i) => ({
          id: i + 1,
          title: `Objective ${i + 1}`,
          description: `This is a detailed description for objective ${i + 1}. `.repeat(10),
          metrics: `Metric ${i + 1}`,
          baseline: `Baseline ${i + 1}`,
          target: `Target ${i + 1}`,
          dueDate: '2025-12-31',
        })),
      };

      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  blueprint_json: {
                    learning_objectives: largeData,
                  },
                },
                error: null,
              }),
            }),
          }),
        }),
      });

      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                id: 'blueprint-id',
                user_id: 'test-user-id',
                blueprint_json: {
                  learning_objectives: { objectives: [] },
                },
              },
              error: null,
            }),
          }),
        }),
      });

      mockSupabaseClient.from = vi.fn().mockReturnValue({
        select: mockSelect,
        update: mockUpdate,
      });

      const req = createMockRequest({
        blueprintId: 'blueprint-id',
        sectionId: 'learning_objectives',
        data: largeData,
      });

      const response = await PATCH(req);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
    });
  });
});
