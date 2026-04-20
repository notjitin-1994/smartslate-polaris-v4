/**
 * Integration Tests: Static → Dynamic Flow
 * Tests the complete flow from saving static answers to generating dynamic questions
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { POST as saveStaticAnswers } from '@/app/api/questionnaire/save/route';
import { POST as generateDynamicQuestions } from '@/app/api/generate-dynamic-questions/route';
import { staticAnswerFixtures } from '../fixtures/staticAnswers';
import { createServerClient } from '@supabase/ssr';

// Mock Supabase client
vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(),
}));

// Mock the auth module
vi.mock('@/lib/supabase/server', () => ({
  getServerSession: vi.fn(() => ({ session: { user: { id: 'test-user-id' } } })),
  getSupabaseServerClient: vi.fn(),
}));

// Import getSupabaseServerClient after mocking
import { getSupabaseServerClient } from '@/lib/supabase/server';

// Mock dynamic question generation service
vi.mock('@/src/lib/services/dynamicQuestionGenerationV2', () => ({
  generateDynamicQuestionsV2: vi.fn().mockResolvedValue({
    sections: [
      {
        id: 'learning_objectives',
        title: 'Learning Objectives & Outcomes',
        description:
          'Define what learners should be able to do after completing the learning experience',
        questions: [
          {
            id: 'q1_s1',
            question_text: 'What are your primary learning objectives?',
            input_type: 'textarea',
            validation: { required: true },
            options: null,
            placeholder: 'Enter your learning objectives...',
          },
          {
            id: 'q2_s1',
            question_text: 'How will you measure the success of these learning objectives?',
            input_type: 'select',
            validation: { required: true },
            options: [
              { value: 'pre_post_assessments', label: 'Pre and post assessments' },
              { value: 'performance_metrics', label: 'Performance metrics' },
              { value: 'learner_feedback', label: 'Learner feedback' },
              { value: 'business_impact', label: 'Business impact measurements' },
            ],
          },
        ],
      },
      {
        id: 'target_audience',
        title: 'Target Audience Analysis',
        description: 'Understand who your learners are and their characteristics',
        questions: [
          {
            id: 'q1_s2',
            question_text: 'Describe the primary audience for this learning experience',
            input_type: 'textarea',
            validation: { required: true },
            options: null,
            placeholder: 'Describe your target audience...',
          },
        ],
      },
    ],
    metadata: {
      generatedAt: new Date().toISOString(),
      version: '2.0',
      totalQuestions: 3,
      estimatedTime: '15-20 minutes',
    },
  }),
}));

// Mock Gemini client
vi.mock('@/lib/claude/client', () => ({
  GeminiClient: vi.fn().mockImplementation(() => ({
    generateResponse: vi.fn().mockResolvedValue({
      content: 'Mocked Gemini response',
      usage: { input_tokens: 100, output_tokens: 200 },
    }),
  })),
}));

// Mock validation service
vi.mock('@/lib/validation/dynamicQuestionSchemas', () => ({
  normalizeSectionQuestions: vi.fn().mockImplementation((sections) => sections),
}));

// Mock Ollama client (kept for backward compatibility)
vi.mock('@/lib/ollama/client', () => ({
  OllamaClient: vi.fn().mockImplementation(() => ({
    generateQuestions: vi.fn().mockResolvedValue({
      sections: [
        {
          title: 'Learning Objectives & Outcomes',
          questions: [
            {
              id: 'q1_s1',
              question_text: 'What are your primary learning objectives?',
              input_type: 'textarea',
              validation: { required: true },
              options: null,
            },
          ],
        },
      ],
    }),
  })),
}));

describe('Static to Dynamic Question Flow', () => {
  let mockSupabase: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup mock Supabase responses
    mockSupabase = {
      from: vi.fn(() => mockSupabase),
      insert: vi.fn(() => mockSupabase),
      update: vi.fn(() => mockSupabase),
      select: vi.fn(() => mockSupabase),
      eq: vi.fn(() => mockSupabase),
      single: vi.fn(() => mockSupabase),
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'test-user-id' } },
          error: null,
        }),
      },
    };

    (createServerClient as any).mockReturnValue(mockSupabase);
    (getSupabaseServerClient as any).mockResolvedValue(mockSupabase);
  });

  describe('POST /api/questionnaire/save', () => {
    it('should save valid static answers in V2.0 format', async () => {
      const blueprintId = '123e4567-e89b-12d3-a456-426614174000';

      // Mock successful insert
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: blueprintId,
          user_id: 'test-user-id',
          static_answers: staticAnswerFixtures.valid,
          status: 'draft',
        },
        error: null,
      });

      const request = new NextRequest('http://localhost:3000/api/questionnaire/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          staticAnswers: staticAnswerFixtures.valid,
        }),
      });

      const response = await saveStaticAnswers(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.blueprintId).toBe(blueprintId);

      // Verify the correct data structure was saved
      expect(mockSupabase.insert).toHaveBeenCalledWith({
        user_id: 'test-user-id',
        static_answers: staticAnswerFixtures.valid,
        status: 'draft',
      });
    });

    it('should accept incomplete static answers (no validation on server side)', async () => {
      const blueprintId = '323e4567-e89b-12d3-a456-426614174000';

      // Mock successful insert
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: blueprintId,
          user_id: 'test-user-id',
          static_answers: staticAnswerFixtures.incomplete,
          status: 'draft',
        },
        error: null,
      });

      const request = new NextRequest('http://localhost:3000/api/questionnaire/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          staticAnswers: staticAnswerFixtures.incomplete,
        }),
      });

      const response = await saveStaticAnswers(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.blueprintId).toBe(blueprintId);
    });

    it('should handle legacy V2 format gracefully', async () => {
      const blueprintId = '223e4567-e89b-12d3-a456-426614174000';

      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: blueprintId,
          user_id: 'test-user-id',
          static_answers: staticAnswerFixtures.legacy,
          status: 'draft',
        },
        error: null,
      });

      const request = new NextRequest('http://localhost:3000/api/questionnaire/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          staticAnswers: staticAnswerFixtures.legacy,
        }),
      });

      const response = await saveStaticAnswers(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });

  describe('POST /api/generate-dynamic-questions', () => {
    it('should generate dynamic questions from valid static answers', async () => {
      const blueprintId = '123e4567-e89b-12d3-a456-426614174000';

      // Mock blueprint fetch with static answers
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: blueprintId,
          static_answers: staticAnswerFixtures.valid,
          user_id: 'test-user-id',
          status: 'draft',
        },
        error: null,
      });

      // Mock update with dynamic questions
      mockSupabase.single.mockResolvedValueOnce({
        data: { id: blueprintId },
        error: null,
      });

      const request = new NextRequest('http://localhost:3000/api/generate-dynamic-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blueprintId }),
      });

      const response = await generateDynamicQuestions(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.dynamicQuestions).toBeDefined();
      expect(Array.isArray(data.dynamicQuestions)).toBe(true);

      // Verify status was updated
      expect(mockSupabase.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'generating',
        })
      );
    });

    it('should fail if no static answers exist', async () => {
      const blueprintId = '323e4567-e89b-12d3-a456-426614174000';

      // Mock blueprint without static answers
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: blueprintId,
          static_answers: null,
          user_id: 'test-user-id',
          status: 'draft',
        },
        error: null,
      });

      const request = new NextRequest('http://localhost:3000/api/generate-dynamic-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blueprintId }),
      });

      const response = await generateDynamicQuestions(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('static answers');
    });

    it('should ensure generated questions have consistent format', async () => {
      const blueprintId = '423e4567-e89b-12d3-a456-426614174000';

      // Mock blueprint fetch
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: blueprintId,
          static_answers: staticAnswerFixtures.valid,
          user_id: 'test-user-id',
          status: 'draft',
        },
        error: null,
      });

      // Mock update
      mockSupabase.single.mockResolvedValueOnce({
        data: { id: blueprintId },
        error: null,
      });

      const request = new NextRequest('http://localhost:3000/api/generate-dynamic-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blueprintId }),
      });

      const response = await generateDynamicQuestions(request);
      const data = await response.json();

      expect(response.status).toBe(200);

      // Verify the update was called with properly formatted questions
      const updateCall = mockSupabase.update.mock.calls.find(
        (call: any) => call[0].dynamic_questions !== undefined
      );

      expect(updateCall).toBeDefined();
      const savedQuestions = updateCall[0].dynamic_questions;

      // Check that questions have been mapped to the correct format
      expect(Array.isArray(savedQuestions)).toBe(true);
      if (savedQuestions.length > 0) {
        const firstSection = savedQuestions[0];
        expect(firstSection).toHaveProperty('id');
        expect(firstSection).toHaveProperty('title');
        expect(firstSection).toHaveProperty('questions');
      }
    });
  });

  describe('End-to-End Flow', () => {
    it('should complete full flow from static answers to dynamic questions', async () => {
      const blueprintId = '523e4567-e89b-12d3-a456-426614174000';

      // Step 1: Save static answers
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: blueprintId,
          user_id: 'test-user-id',
          static_answers: staticAnswerFixtures.valid,
          status: 'draft',
        },
        error: null,
      });

      const saveRequest = new NextRequest('http://localhost:3000/api/questionnaire/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          staticAnswers: staticAnswerFixtures.valid,
        }),
      });

      const saveResponse = await saveStaticAnswers(saveRequest);
      expect(saveResponse.status).toBe(200);
      const saveData = await saveResponse.json();
      expect(saveData.blueprintId).toBe(blueprintId);

      // Step 2: Generate dynamic questions using the blueprint ID
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: blueprintId,
          static_answers: staticAnswerFixtures.valid,
          user_id: 'test-user-id',
          status: 'draft',
        },
        error: null,
      });

      mockSupabase.single.mockResolvedValueOnce({
        data: { id: blueprintId },
        error: null,
      });

      const generateRequest = new NextRequest(
        'http://localhost:3000/api/generate-dynamic-questions',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ blueprintId }),
        }
      );

      const generateResponse = await generateDynamicQuestions(generateRequest);
      expect(generateResponse.status).toBe(200);
      const generateData = await generateResponse.json();
      expect(generateData.success).toBe(true);
      expect(generateData.dynamicQuestions).toBeDefined();
    });

    it('should handle edge case static answers correctly', async () => {
      const blueprintId = '623e4567-e89b-12d3-a456-426614174000';

      // Use edge case fixture with extreme values
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: blueprintId,
          user_id: 'test-user-id',
          static_answers: staticAnswerFixtures.edgeCase,
          status: 'draft',
        },
        error: null,
      });

      const saveRequest = new NextRequest('http://localhost:3000/api/questionnaire/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          staticAnswers: staticAnswerFixtures.edgeCase,
        }),
      });

      const response = await saveStaticAnswers(saveRequest);
      expect(response.status).toBe(200);

      // Verify that extreme values are preserved
      expect(mockSupabase.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          static_answers: expect.objectContaining({
            section_3_learning_gap: expect.objectContaining({
              budget_available: {
                amount: 50000000, // $50 million preserved
                currency: 'USD',
              },
            }),
          }),
        })
      );
    });
  });
});
