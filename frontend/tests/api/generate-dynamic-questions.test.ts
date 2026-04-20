import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock Supabase
const mockSelect = vi.fn();
const mockUpdate = vi.fn();
const mockRpc = vi.fn();
const mockFrom = vi.fn(() => {
  return {
    select: mockSelect,
    update: mockUpdate,
  };
});

const mockSupabase = {
  from: mockFrom,
  rpc: mockRpc,
};

// Mock BlueprintUsageService
vi.mock('@/lib/services/blueprintUsageService', () => ({
  BlueprintUsageService: {
    incrementCreationCountV2: vi.fn(),
    incrementSavingCountV2: vi.fn(),
  },
}));

vi.mock('@/src/lib/services/dynamicQuestionGenerationV2', () => ({
  generateDynamicQuestionsV2: vi.fn(),
}));

vi.mock('@/lib/validation/dynamicQuestionSchemas', () => ({
  normalizeSectionQuestions: vi.fn((sections) => sections),
}));

vi.mock('@/lib/supabase/server', () => ({
  getSupabaseServerClient: () => mockSupabase,
}));

// Import after mocking
import { POST } from '@/app/api/generate-dynamic-questions/route';
import { generateDynamicQuestionsV2 } from '@/src/lib/services/dynamicQuestionGenerationV2';
import { BlueprintUsageService } from '@/lib/services/blueprintUsageService';
import { normalizeSectionQuestions } from '@/lib/validation/dynamicQuestionSchemas';

describe('/api/generate-dynamic-questions', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mock chain
    mockSelect.mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn(),
      }),
    });

    mockUpdate.mockReturnValue({
      eq: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn(),
        }),
      }),
    });
  });

  it('should generate a full 10-section dynamic questionnaire successfully', async () => {
    const blueprintId = '123e4567-e89b-12d3-a456-426614174000';
    const mockBlueprint = {
      id: blueprintId,
      static_answers: {
        section_1_role_experience: {
          current_role: 'Software Developer',
          years_in_role: '3-5',
          custom_role: 'Frontend Developer',
        },
        section_2_organization: {
          organization_name: 'Tech Corp',
          industry_sector: 'Technology',
          organization_size: '100-500',
        },
        section_3_learning_gap: {
          learning_gap_description: 'Need to improve React skills',
          total_learners_range: '10-25',
          budget_available: { amount: 5000, currency: 'USD' },
        },
      },
      user_id: 'test-user-id',
      status: 'draft',
    };

    const mockDynamicQuestions = {
      sections: Array.from({ length: 10 }, (_, si) => ({
        id: `section-${si + 1}`,
        title: `Section ${si + 1}`,
        description: `Description for section ${si + 1}`,
        questions: Array.from({ length: 6 }, (_, qi) => ({
          id: `q${si + 1}-${qi + 1}`,
          label: `Question ${qi + 1} in section ${si + 1}`,
          type: 'text',
          required: true,
        })),
      })),
      metadata: {
        generatedAt: new Date().toISOString(),
        totalQuestions: 60,
      },
    };

    // Mock Supabase responses
    const mockSelectChain = mockSelect();
    mockSelectChain.eq().single.mockResolvedValue({
      data: mockBlueprint,
      error: null,
    });

    const mockUpdateChain = mockUpdate();
    mockUpdateChain
      .eq()
      .select()
      .single.mockResolvedValue({
        data: { ...mockBlueprint, dynamic_questions: mockDynamicQuestions.sections },
        error: null,
      });

    // Mock the generation service response
    const mockGenerate = vi.mocked(generateDynamicQuestionsV2);
    mockGenerate.mockResolvedValue(mockDynamicQuestions);

    // Mock successful dual counting
    vi.mocked(BlueprintUsageService.incrementCreationCountV2).mockResolvedValue({
      success: true,
      reason: 'Increment successful',
      newCount: 1,
    });

    vi.mocked(BlueprintUsageService.incrementSavingCountV2).mockResolvedValue({
      success: true,
      reason: 'Increment successful',
      newCount: 1,
    });

    const request = new NextRequest('http://localhost:3000/api/generate-dynamic-questions', {
      method: 'POST',
      body: JSON.stringify({ blueprintId }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(Array.isArray(data.dynamicQuestions)).toBe(true);
    expect(data.dynamicQuestions.length).toBe(10);
    for (const section of data.dynamicQuestions) {
      expect(Array.isArray(section.questions)).toBe(true);
      expect(section.questions.length).toBeGreaterThan(0);
    }
    expect(mockGenerate).toHaveBeenCalledWith(blueprintId, mockBlueprint.static_answers);
  });

  it('should return 404 if blueprint not found', async () => {
    const blueprintId = '123e4567-e89b-12d3-a456-426614174001';

    const mockSelectChain = mockSelect();
    mockSelectChain.eq().single.mockResolvedValue({
      data: null,
      error: { message: 'Not found' },
    });

    const request = new NextRequest('http://localhost:3000/api/generate-dynamic-questions', {
      method: 'POST',
      body: JSON.stringify({ blueprintId }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Blueprint not found');
  });

  it('should return existing dynamic questions if already generated', async () => {
    const blueprintId = '123e4567-e89b-12d3-a456-426614174002';
    const existingQuestions = [
      {
        id: 'section-1',
        title: 'Existing Section',
        description: 'Existing description',
        questions: [
          {
            id: 'q1',
            label: 'Existing question',
            type: 'text',
            required: true,
          },
        ],
      },
    ];

    const mockBlueprint = {
      id: blueprintId,
      static_answers: {
        section_1_role_experience: {},
        section_2_organization: {},
        section_3_learning_gap: {},
      },
      dynamic_questions: existingQuestions,
      user_id: 'test-user-id',
      status: 'draft',
    };

    const mockSelectChain = mockSelect();
    mockSelectChain.eq().single.mockResolvedValue({
      data: mockBlueprint,
      error: null,
    });

    const request = new NextRequest('http://localhost:3000/api/generate-dynamic-questions', {
      method: 'POST',
      body: JSON.stringify({ blueprintId }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.dynamicQuestions).toEqual(existingQuestions);
    expect(data.message).toBe('Dynamic questions already exist');
    expect(vi.mocked(generateDynamicQuestionsV2)).not.toHaveBeenCalled();
  });

  it('should return 400 for invalid request body', async () => {
    const request = new NextRequest('http://localhost:3000/api/generate-dynamic-questions', {
      method: 'POST',
      body: JSON.stringify({ invalidField: 'test' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid request data');
  });

  describe('Dual Counting Logic (CVE-001 fix)', () => {
    it('should increment both creation and saving counts on successful generation', async () => {
      const blueprintId = '123e4567-e89b-12d3-a456-426614174010';
      const mockBlueprint = {
        id: blueprintId,
        static_answers: {
          section_1_role_experience: { current_role: 'Developer', years_in_role: '3-5' },
          section_2_organization: { organization_name: 'Tech Corp', industry_sector: 'Tech' },
          section_3_learning_gap: { learning_gap_description: 'React skills' },
        },
        user_id: 'test-user-id',
        status: 'draft',
      };

      const mockDynamicQuestions = {
        sections: [
          {
            id: 'section-1',
            title: 'Section 1',
            questions: [{ id: 'q1', label: 'Question 1', type: 'text', required: true }],
          },
        ],
        metadata: { generatedAt: new Date().toISOString(), totalQuestions: 1 },
      };

      const mockSelectChain = mockSelect();
      mockSelectChain.eq().single.mockResolvedValue({
        data: mockBlueprint,
        error: null,
      });

      const mockUpdateChain = mockUpdate();
      mockUpdateChain
        .eq()
        .select()
        .single.mockResolvedValue({
          data: { ...mockBlueprint, dynamic_questions: mockDynamicQuestions.sections },
          error: null,
        });

      // Mock successful generation
      vi.mocked(generateDynamicQuestionsV2).mockResolvedValue(mockDynamicQuestions);

      // Mock successful dual counting
      vi.mocked(BlueprintUsageService.incrementCreationCountV2).mockResolvedValue({
        success: true,
        reason: 'Increment successful',
        newCount: 3,
      });

      vi.mocked(BlueprintUsageService.incrementSavingCountV2).mockResolvedValue({
        success: true,
        reason: 'Increment successful',
        newCount: 2,
      });

      const request = new NextRequest('http://localhost:3000/api/generate-dynamic-questions', {
        method: 'POST',
        body: JSON.stringify({ blueprintId }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      // Verify both counters were incremented
      expect(BlueprintUsageService.incrementCreationCountV2).toHaveBeenCalledWith(
        expect.anything(),
        'test-user-id'
      );
      expect(BlueprintUsageService.incrementSavingCountV2).toHaveBeenCalledWith(
        expect.anything(),
        'test-user-id'
      );

      // Verify usage metadata is returned
      expect(data.metadata.usage).toEqual({
        creationCount: 3,
        savingCount: 2,
      });
    });

    it('should rollback and return 429 when creation limit exceeded', async () => {
      const blueprintId = '123e4567-e89b-12d3-a456-426614174011';
      const mockBlueprint = {
        id: blueprintId,
        static_answers: {
          section_1_role_experience: { current_role: 'Developer' },
          section_2_organization: { organization_name: 'Tech Corp' },
          section_3_learning_gap: { learning_gap_description: 'React' },
        },
        user_id: 'test-user-id',
        status: 'draft',
      };

      const mockDynamicQuestions = {
        sections: [{ id: 's1', title: 'S1', questions: [] }],
        metadata: {},
      };

      const mockSelectChain = mockSelect();
      mockSelectChain.eq().single.mockResolvedValue({
        data: mockBlueprint,
        error: null,
      });

      const mockUpdateChain = mockUpdate();
      mockUpdateChain
        .eq()
        .select()
        .single.mockResolvedValue({
          data: { ...mockBlueprint, dynamic_questions: mockDynamicQuestions.sections },
          error: null,
        });

      vi.mocked(generateDynamicQuestionsV2).mockResolvedValue(mockDynamicQuestions);

      // Mock creation limit exceeded
      vi.mocked(BlueprintUsageService.incrementCreationCountV2).mockResolvedValue({
        success: false,
        reason: 'Blueprint creation limit exceeded',
        newCount: 2,
      });

      vi.mocked(BlueprintUsageService.incrementSavingCountV2).mockResolvedValue({
        success: true,
        reason: 'Increment successful',
        newCount: 1,
      });

      const request = new NextRequest('http://localhost:3000/api/generate-dynamic-questions', {
        method: 'POST',
        body: JSON.stringify({ blueprintId }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data.error).toContain('creation limit exceeded');
      expect(data.upgradeUrl).toBe('/pricing');

      // Verify rollback was called (at least once for rollback update)
      expect(mockUpdate).toHaveBeenCalled();
    });

    it('should rollback and return 429 when saving limit exceeded', async () => {
      const blueprintId = '123e4567-e89b-12d3-a456-426614174012';
      const mockBlueprint = {
        id: blueprintId,
        static_answers: {
          section_1_role_experience: { current_role: 'Developer' },
          section_2_organization: { organization_name: 'Tech Corp' },
          section_3_learning_gap: { learning_gap_description: 'React' },
        },
        user_id: 'test-user-id',
        status: 'draft',
      };

      const mockDynamicQuestions = {
        sections: [{ id: 's1', title: 'S1', questions: [] }],
        metadata: {},
      };

      const mockSelectChain = mockSelect();
      mockSelectChain.eq().single.mockResolvedValue({
        data: mockBlueprint,
        error: null,
      });

      const mockUpdateChain = mockUpdate();
      mockUpdateChain
        .eq()
        .select()
        .single.mockResolvedValue({
          data: { ...mockBlueprint, dynamic_questions: mockDynamicQuestions.sections },
          error: null,
        });

      vi.mocked(generateDynamicQuestionsV2).mockResolvedValue(mockDynamicQuestions);

      // Mock saving limit exceeded
      vi.mocked(BlueprintUsageService.incrementCreationCountV2).mockResolvedValue({
        success: true,
        reason: 'Increment successful',
        newCount: 1,
      });

      vi.mocked(BlueprintUsageService.incrementSavingCountV2).mockResolvedValue({
        success: false,
        reason: 'Blueprint saving limit exceeded',
        newCount: 2,
      });

      const request = new NextRequest('http://localhost:3000/api/generate-dynamic-questions', {
        method: 'POST',
        body: JSON.stringify({ blueprintId }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data.error).toContain('saving limit exceeded');
      expect(data.upgradeUrl).toBe('/pricing');
      expect(data.details).toHaveProperty('creation');
      expect(data.details).toHaveProperty('saving');
    });

    it('should rollback when BOTH limits exceeded', async () => {
      const blueprintId = '123e4567-e89b-12d3-a456-426614174013';
      const mockBlueprint = {
        id: blueprintId,
        static_answers: {
          section_1_role_experience: { current_role: 'Developer' },
          section_2_organization: { organization_name: 'Tech Corp' },
          section_3_learning_gap: { learning_gap_description: 'React' },
        },
        user_id: 'test-user-id',
        status: 'draft',
      };

      const mockDynamicQuestions = {
        sections: [{ id: 's1', title: 'S1', questions: [] }],
        metadata: {},
      };

      const mockSelectChain = mockSelect();
      mockSelectChain.eq().single.mockResolvedValue({
        data: mockBlueprint,
        error: null,
      });

      const mockUpdateChain = mockUpdate();
      mockUpdateChain
        .eq()
        .select()
        .single.mockResolvedValue({
          data: { ...mockBlueprint, dynamic_questions: mockDynamicQuestions.sections },
          error: null,
        });

      vi.mocked(generateDynamicQuestionsV2).mockResolvedValue(mockDynamicQuestions);

      // Mock BOTH limits exceeded
      vi.mocked(BlueprintUsageService.incrementCreationCountV2).mockResolvedValue({
        success: false,
        reason: 'Blueprint creation limit exceeded',
        newCount: 2,
      });

      vi.mocked(BlueprintUsageService.incrementSavingCountV2).mockResolvedValue({
        success: false,
        reason: 'Blueprint saving limit exceeded',
        newCount: 2,
      });

      const request = new NextRequest('http://localhost:3000/api/generate-dynamic-questions', {
        method: 'POST',
        body: JSON.stringify({ blueprintId }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data.error).toContain('both creation and saving limit exceeded');
    });
  });

  describe('Retry Logic with Metadata Tracking', () => {
    it('should track retry attempts in metadata', async () => {
      const blueprintId = '123e4567-e89b-12d3-a456-426614174014';
      const mockBlueprint = {
        id: blueprintId,
        static_answers: {
          section_1_role_experience: { current_role: 'Developer' },
          section_2_organization: { organization_name: 'Tech Corp' },
          section_3_learning_gap: { learning_gap_description: 'React' },
        },
        user_id: 'test-user-id',
        status: 'draft',
        dynamic_questions_metadata: {
          retryAttempt: 0,
        },
      };

      const mockSelectChain = mockSelect();
      mockSelectChain.eq().single.mockResolvedValue({
        data: mockBlueprint,
        error: null,
      });

      const mockUpdateChain = mockUpdate();
      mockUpdateChain.eq().select().single.mockResolvedValue({
        data: mockBlueprint,
        error: null,
      });

      // Mock generation failure to trigger retry logic
      vi.mocked(generateDynamicQuestionsV2).mockRejectedValue(new Error('Generation failed'));

      const request = new NextRequest('http://localhost:3000/api/generate-dynamic-questions', {
        method: 'POST',
        body: JSON.stringify({ blueprintId }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(502);
      expect(data.error).toBe('Failed to generate dynamic questions. Please try again.');
      expect(data.canRetry).toBe(true);
      expect(data.attemptsRemaining).toBe(2);

      // Verify retry counter was incremented
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          dynamic_questions_metadata: expect.objectContaining({
            retryAttempt: 1,
          }),
        })
      );
    });

    it('should return 429 when max retries exceeded', async () => {
      const blueprintId = '123e4567-e89b-12d3-a456-426614174015';
      const mockBlueprint = {
        id: blueprintId,
        static_answers: {
          section_1_role_experience: { current_role: 'Developer' },
          section_2_organization: { organization_name: 'Tech Corp' },
          section_3_learning_gap: { learning_gap_description: 'React' },
        },
        user_id: 'test-user-id',
        status: 'draft',
        dynamic_questions_metadata: {
          retryAttempt: 3, // Already at max retries
        },
      };

      const mockSelectChain = mockSelect();
      mockSelectChain.eq().single.mockResolvedValue({
        data: mockBlueprint,
        error: null,
      });

      const request = new NextRequest('http://localhost:3000/api/generate-dynamic-questions', {
        method: 'POST',
        body: JSON.stringify({ blueprintId }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data.error).toContain('Maximum retry attempts (3) reached');
      expect(data.canRetry).toBe(false);

      // Verify generation was never called
      expect(vi.mocked(generateDynamicQuestionsV2)).not.toHaveBeenCalled();
    });

    it('should reset retry counter on successful generation', async () => {
      const blueprintId = '123e4567-e89b-12d3-a456-426614174016';
      const mockBlueprint = {
        id: blueprintId,
        static_answers: {
          section_1_role_experience: { current_role: 'Developer' },
          section_2_organization: { organization_name: 'Tech Corp' },
          section_3_learning_gap: { learning_gap_description: 'React' },
        },
        user_id: 'test-user-id',
        status: 'draft',
        dynamic_questions_metadata: {
          retryAttempt: 2, // Had previous failures
        },
      };

      const mockDynamicQuestions = {
        sections: [{ id: 's1', title: 'S1', questions: [] }],
        metadata: {},
      };

      const mockSelectChain = mockSelect();
      mockSelectChain.eq().single.mockResolvedValue({
        data: mockBlueprint,
        error: null,
      });

      const mockUpdateChain = mockUpdate();
      mockUpdateChain
        .eq()
        .select()
        .single.mockResolvedValue({
          data: { ...mockBlueprint, dynamic_questions: mockDynamicQuestions.sections },
          error: null,
        });

      vi.mocked(generateDynamicQuestionsV2).mockResolvedValue(mockDynamicQuestions);

      // Mock successful dual counting
      vi.mocked(BlueprintUsageService.incrementCreationCountV2).mockResolvedValue({
        success: true,
        reason: 'Success',
        newCount: 1,
      });

      vi.mocked(BlueprintUsageService.incrementSavingCountV2).mockResolvedValue({
        success: true,
        reason: 'Success',
        newCount: 1,
      });

      const request = new NextRequest('http://localhost:3000/api/generate-dynamic-questions', {
        method: 'POST',
        body: JSON.stringify({ blueprintId }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      // Verify retry counter was reset to 0
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          dynamic_questions_metadata: expect.objectContaining({
            retryAttempt: 0, // Reset on success
          }),
        })
      );
    });
  });

  describe('Normalization of Dynamic Questions', () => {
    it('should normalize section questions after generation', async () => {
      const blueprintId = '123e4567-e89b-12d3-a456-426614174017';
      const mockBlueprint = {
        id: blueprintId,
        static_answers: {
          section_1_role_experience: { current_role: 'Developer' },
          section_2_organization: { organization_name: 'Tech Corp' },
          section_3_learning_gap: { learning_gap_description: 'React' },
        },
        user_id: 'test-user-id',
        status: 'draft',
      };

      const unnormalizedQuestions = {
        sections: [
          {
            id: 's1',
            title: 'Section 1',
            questions: [
              {
                id: 'q1',
                label: 'Question',
                type: 'radio',
                options: [
                  { label: 'Option A', value: 'option_a' }, // Should be normalized
                  { label: 'Option B', value: 'option_b' },
                ],
              },
            ],
          },
        ],
        metadata: {},
      };

      const normalizedQuestions = [
        {
          id: 's1',
          title: 'Section 1',
          questions: [
            {
              id: 'q1',
              label: 'Question',
              type: 'radio',
              options: [
                { label: 'Option A', value: 'option_a' },
                { label: 'Option B', value: 'option_b' },
              ],
            },
          ],
        },
      ];

      const mockSelectChain = mockSelect();
      mockSelectChain.eq().single.mockResolvedValue({
        data: mockBlueprint,
        error: null,
      });

      const mockUpdateChain = mockUpdate();
      mockUpdateChain
        .eq()
        .select()
        .single.mockResolvedValue({
          data: { ...mockBlueprint, dynamic_questions: normalizedQuestions },
          error: null,
        });

      vi.mocked(generateDynamicQuestionsV2).mockResolvedValue(unnormalizedQuestions);
      vi.mocked(normalizeSectionQuestions).mockReturnValue(normalizedQuestions);

      // Mock successful dual counting
      vi.mocked(BlueprintUsageService.incrementCreationCountV2).mockResolvedValue({
        success: true,
        reason: 'Success',
        newCount: 1,
      });

      vi.mocked(BlueprintUsageService.incrementSavingCountV2).mockResolvedValue({
        success: true,
        reason: 'Success',
        newCount: 1,
      });

      const request = new NextRequest('http://localhost:3000/api/generate-dynamic-questions', {
        method: 'POST',
        body: JSON.stringify({ blueprintId }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      // Verify normalization was called
      expect(normalizeSectionQuestions).toHaveBeenCalledWith(unnormalizedQuestions.sections);

      // Verify normalized data was saved
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          dynamic_questions: normalizedQuestions,
        })
      );
    });
  });
});
