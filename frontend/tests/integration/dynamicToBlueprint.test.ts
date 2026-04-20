/**
 * Integration Tests: Dynamic → Blueprint Flow
 * Tests the complete flow from submitting dynamic answers to generating blueprints
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { POST as submitDynamicAnswers } from '@/app/api/dynamic-answers/submit/route';
import { POST as generateBlueprint } from '@/app/api/blueprints/generate/route';
import { dynamicQuestionFixtures } from '../fixtures/dynamicQuestions';
import { dynamicAnswerFixtures } from '../fixtures/dynamicAnswers';
import { staticAnswerFixtures } from '../fixtures/staticAnswers';
import { blueprintFixtures } from '../fixtures/blueprints';
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

// Mock blueprint generation service
vi.mock('@/lib/services/blueprintGenerationService', () => ({
  blueprintGenerationService: {
    generate: vi.fn(),
  },
}));

// Mock markdown converter
vi.mock('@/lib/services/blueprintMarkdownConverter', () => ({
  convertBlueprintToMarkdown: vi.fn(() => '# Generated Blueprint Markdown'),
}));

// Mock cookies
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    getAll: vi.fn(() => []),
    set: vi.fn(),
  })),
}));

import { blueprintGenerationService } from '@/lib/services/blueprintGenerationService';

describe('Dynamic to Blueprint Flow', () => {
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

  describe('POST /api/dynamic-answers/submit', () => {
    it('should successfully submit and validate complete dynamic answers', async () => {
      const blueprintId = '123e4567-e89b-12d3-a456-426614174000';

      // Mock blueprint with dynamic questions
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: blueprintId,
          user_id: 'test-user-id',
          dynamic_questions: dynamicQuestionFixtures.valid,
          dynamic_answers: {},
          status: 'draft',
        },
        error: null,
      });

      // Mock successful update
      mockSupabase.single.mockResolvedValueOnce({
        data: { id: blueprintId },
        error: null,
      });

      const request = new NextRequest('http://localhost:3000/api/dynamic-answers/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          blueprintId,
          answers: dynamicAnswerFixtures.valid,
        }),
      });

      const response = await submitDynamicAnswers(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.blueprintId).toBe(blueprintId);
      expect(data.blueprintGenerationStarted).toBe(false); // Generation triggered separately

      // Verify answers were saved
      expect(mockSupabase.update).toHaveBeenCalledWith(
        expect.objectContaining({
          dynamic_answers: dynamicAnswerFixtures.valid,
          updated_at: expect.any(String),
        })
      );
    });

    it('should sanitize and accept answers with case variations', async () => {
      const blueprintId = '223e4567-e89b-12d3-a456-426614174000';

      // Mock blueprint with dynamic questions
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: blueprintId,
          user_id: 'test-user-id',
          dynamic_questions: dynamicQuestionFixtures.valid,
          dynamic_answers: {},
          status: 'draft',
        },
        error: null,
      });

      // Mock successful update
      mockSupabase.single.mockResolvedValueOnce({
        data: { id: blueprintId },
        error: null,
      });

      const request = new NextRequest('http://localhost:3000/api/dynamic-answers/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          blueprintId,
          answers: dynamicAnswerFixtures.toBeSanitized,
        }),
      });

      const response = await submitDynamicAnswers(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      // Verify sanitized answers were saved
      const updateCall = mockSupabase.update.mock.calls[0][0];
      const savedAnswers = updateCall.dynamic_answers;

      // Check that case variations were normalized
      expect(savedAnswers.q2_s1).toContain('cognitive'); // lowercase
      expect(savedAnswers.q3_s2).toBe('yes'); // lowercase
    });

    it('should reject invalid answers with clear error messages', async () => {
      const blueprintId = '323e4567-e89b-12d3-a456-426614174000';

      // Mock blueprint with dynamic questions
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: blueprintId,
          user_id: 'test-user-id',
          dynamic_questions: dynamicQuestionFixtures.valid,
          dynamic_answers: {},
          status: 'draft',
        },
        error: null,
      });

      const request = new NextRequest('http://localhost:3000/api/dynamic-answers/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          blueprintId,
          answers: dynamicAnswerFixtures.invalid,
        }),
      });

      const response = await submitDynamicAnswers(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Answer validation failed');
      expect(data.errorDetails).toBeDefined();
      expect(data.errorDetails.length).toBeGreaterThan(0);

      // Check for helpful error details
      const firstError = data.errorDetails[0];
      expect(firstError).toHaveProperty('questionId');
      expect(firstError).toHaveProperty('hint');
      expect(firstError).toHaveProperty('error');
    });

    it('should handle missing required fields appropriately', async () => {
      const blueprintId = '423e4567-e89b-12d3-a456-426614174000';

      // Mock blueprint with dynamic questions
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: blueprintId,
          user_id: 'test-user-id',
          dynamic_questions: dynamicQuestionFixtures.valid,
          dynamic_answers: {},
          status: 'draft',
        },
        error: null,
      });

      const request = new NextRequest('http://localhost:3000/api/dynamic-answers/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          blueprintId,
          answers: dynamicAnswerFixtures.partial, // Missing many required fields
        }),
      });

      const response = await submitDynamicAnswers(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.missingRequired).toBeDefined();
      expect(data.missingRequired.length).toBeGreaterThan(0);
      expect(data.message).toContain('required field');
    });
  });

  describe('POST /api/blueprints/generate', () => {
    it('should generate blueprint with both static and dynamic answers', async () => {
      const blueprintId = '523e4567-e89b-12d3-a456-426614174000';

      // Mock blueprint with both answer sets
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: blueprintId,
          user_id: 'test-user-id',
          static_answers: staticAnswerFixtures.valid,
          dynamic_answers: dynamicAnswerFixtures.valid,
          status: 'draft',
        },
        error: null,
      });

      // Mock status update to generating
      mockSupabase.single.mockResolvedValueOnce({
        data: { id: blueprintId },
        error: null,
      });

      // Mock blueprint generation service
      (blueprintGenerationService.generate as any).mockResolvedValueOnce({
        success: true,
        blueprint: blueprintFixtures.valid,
        metadata: {
          model: 'gemini-3.1-pro-preview',
          duration: 5000,
          timestamp: new Date().toISOString(),
          fallbackUsed: false,
          attempts: 1,
        },
      });

      // Mock final save
      mockSupabase.single.mockResolvedValueOnce({
        data: { id: blueprintId },
        error: null,
      });

      const request = new NextRequest('http://localhost:3000/api/blueprints/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blueprintId }),
      });

      const response = await generateBlueprint(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.blueprintId).toBe(blueprintId);

      // Verify the generation service was called with correct context
      expect(blueprintGenerationService.generate).toHaveBeenCalledWith(
        expect.objectContaining({
          blueprintId,
          userId: 'test-user-id',
          staticAnswers: staticAnswerFixtures.valid,
          dynamicAnswers: dynamicAnswerFixtures.valid,
          organization: 'TechCorp Solutions Inc.',
          role: 'Learning & Development Manager',
          industry: 'Technology',
          learningObjectives: expect.any(Array),
        })
      );

      // Verify blueprint was saved with all sections
      const saveCall = mockSupabase.update.mock.calls.find(
        (call: any) => call[0].blueprint_json !== undefined
      );
      expect(saveCall).toBeDefined();
      expect(saveCall[0].status).toBe('completed');
    });

    it('should fail if dynamic answers are missing', async () => {
      const blueprintId = '623e4567-e89b-12d3-a456-426614174000';

      // Mock blueprint without dynamic answers
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: blueprintId,
          user_id: 'test-user-id',
          static_answers: staticAnswerFixtures.valid,
          dynamic_answers: null,
          status: 'draft',
        },
        error: null,
      });

      const request = new NextRequest('http://localhost:3000/api/blueprints/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blueprintId }),
      });

      const response = await generateBlueprint(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Dynamic questionnaire incomplete');
    });

    it('should extract learning objectives from dynamic answers', async () => {
      const blueprintId = '723e4567-e89b-12d3-a456-426614174000';

      // Mock blueprint
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: blueprintId,
          user_id: 'test-user-id',
          static_answers: staticAnswerFixtures.valid,
          dynamic_answers: dynamicAnswerFixtures.valid,
          status: 'draft',
        },
        error: null,
      });

      // Mock updates
      mockSupabase.single.mockResolvedValue({
        data: { id: blueprintId },
        error: null,
      });

      // Mock successful generation
      (blueprintGenerationService.generate as any).mockResolvedValueOnce({
        success: true,
        blueprint: blueprintFixtures.valid,
        metadata: {
          model: 'gemini-3.1-pro-preview',
          duration: 5000,
          timestamp: new Date().toISOString(),
          fallbackUsed: false,
          attempts: 1,
        },
      });

      const request = new NextRequest('http://localhost:3000/api/blueprints/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blueprintId }),
      });

      const response = await generateBlueprint(request);
      expect(response.status).toBe(200);

      // Verify learning objectives were extracted
      const generateCall = (blueprintGenerationService.generate as any).mock.calls[0][0];
      expect(generateCall.learningObjectives).toBeDefined();
      expect(generateCall.learningObjectives.length).toBeGreaterThan(0);
    });
  });

  describe('End-to-End Blueprint Generation', () => {
    it('should complete full flow from dynamic answers to generated blueprint', async () => {
      const blueprintId = '823e4567-e89b-12d3-a456-426614174000';

      // Step 1: Submit dynamic answers
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: blueprintId,
          user_id: 'test-user-id',
          dynamic_questions: dynamicQuestionFixtures.valid,
          dynamic_answers: {},
          status: 'draft',
        },
        error: null,
      });

      mockSupabase.single.mockResolvedValueOnce({
        data: { id: blueprintId },
        error: null,
      });

      const submitRequest = new NextRequest('http://localhost:3000/api/dynamic-answers/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          blueprintId,
          answers: dynamicAnswerFixtures.valid,
        }),
      });

      const submitResponse = await submitDynamicAnswers(submitRequest);
      expect(submitResponse.status).toBe(200);

      // Step 2: Generate blueprint
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: blueprintId,
          user_id: 'test-user-id',
          static_answers: staticAnswerFixtures.valid,
          dynamic_answers: dynamicAnswerFixtures.valid,
          status: 'draft',
        },
        error: null,
      });

      mockSupabase.single.mockResolvedValue({
        data: { id: blueprintId },
        error: null,
      });

      (blueprintGenerationService.generate as any).mockResolvedValueOnce({
        success: true,
        blueprint: blueprintFixtures.valid,
        metadata: {
          model: 'gemini-3.1-pro-preview',
          duration: 5000,
          timestamp: new Date().toISOString(),
          fallbackUsed: false,
          attempts: 1,
        },
      });

      const generateRequest = new NextRequest('http://localhost:3000/api/blueprints/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blueprintId }),
      });

      const generateResponse = await generateBlueprint(generateRequest);
      expect(generateResponse.status).toBe(200);
      const generateData = await generateResponse.json();
      expect(generateData.success).toBe(true);

      // Verify all required sections are present in saved blueprint
      const finalSave = mockSupabase.update.mock.calls.find(
        (call: any) => call[0].blueprint_json && call[0].status === 'completed'
      );
      expect(finalSave).toBeDefined();

      const savedBlueprint = finalSave[0].blueprint_json;
      expect(savedBlueprint).toHaveProperty('metadata');
      expect(savedBlueprint).toHaveProperty('executive_summary');
      expect(savedBlueprint).toHaveProperty('learning_objectives');
      expect(savedBlueprint).toHaveProperty('target_audience');
      expect(savedBlueprint).toHaveProperty('content_outline');
      expect(savedBlueprint).toHaveProperty('resources');
      expect(savedBlueprint).toHaveProperty('assessment_strategy');
      expect(savedBlueprint).toHaveProperty('implementation_timeline');
      expect(savedBlueprint).toHaveProperty('risk_mitigation');
      expect(savedBlueprint).toHaveProperty('success_metrics');
      expect(savedBlueprint).toHaveProperty('sustainability_plan');
    });

    it('should handle common user mistakes gracefully', async () => {
      const blueprintId = '923e4567-e89b-12d3-a456-426614174000';

      // Submit answers with common mistakes (labels instead of values, etc.)
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: blueprintId,
          user_id: 'test-user-id',
          dynamic_questions: dynamicQuestionFixtures.valid,
          dynamic_answers: {},
          status: 'draft',
        },
        error: null,
      });

      mockSupabase.single.mockResolvedValueOnce({
        data: { id: blueprintId },
        error: null,
      });

      const request = new NextRequest('http://localhost:3000/api/dynamic-answers/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          blueprintId,
          answers: dynamicAnswerFixtures.commonMistakes,
        }),
      });

      const response = await submitDynamicAnswers(request);
      const data = await response.json();

      // Should either accept with sanitization or provide helpful errors
      if (response.status === 200) {
        expect(data.success).toBe(true);
      } else {
        expect(data.errorDetails).toBeDefined();
        // Check that errors mention the valid options
        const hasHelpfulErrors = data.errorDetails.some(
          (err: any) => err.hint || (err.error && err.error.includes('select from'))
        );
        expect(hasHelpfulErrors).toBe(true);
      }
    });
  });
});
