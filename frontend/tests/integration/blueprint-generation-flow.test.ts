/**
 * Integration Tests for Complete Blueprint Generation Flow
 * Tests the end-to-end flow from questionnaire submission to blueprint generation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createClient } from '@supabase/supabase-js';

// Test configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'test-key';

describe('Blueprint Generation Flow Integration', () => {
  let supabase: ReturnType<typeof createClient>;
  let testBlueprintId: string;
  const testUserId: string = 'test-user-' + Date.now();

  beforeEach(async () => {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // Create test blueprint
    const { data, error } = await supabase
      .from('blueprint_generator')
      .insert({
        user_id: testUserId,
        static_answers: {
          section_1_role_experience: {
            current_role: 'L&D Manager',
            years_in_role: 5,
            industry_experience: ['Technology'],
            team_size: '50-100',
            budget_responsibility: 150000,
          },
          section_2_organization: {
            organization_name: 'Test Corp',
            industry_sector: 'Technology',
            organization_size: '100-500',
            geographic_regions: ['North America'],
          },
          section_3_learning_gap: {
            learning_gap_description: 'Need to improve security awareness',
            total_learners_range: '50-100',
            current_knowledge_level: 3,
            motivation_factors: ['Compliance'],
          },
        },
        status: 'draft',
      })
      .select()
      .single();

    expect(error).toBeNull();
    expect(data).toBeDefined();
    testBlueprintId = data!.id;
  });

  it('should generate blueprint after dynamic answers submitted', async () => {
    // Step 1: Verify initial status
    let blueprint = await supabase
      .from('blueprint_generator')
      .select('*')
      .eq('id', testBlueprintId)
      .single();

    expect(blueprint.data?.status).toBe('draft');

    // Step 2: Simulate dynamic questions generation
    await supabase
      .from('blueprint_generator')
      .update({
        dynamic_questions: [
          {
            id: 's1',
            title: 'Section 1',
            questions: [
              {
                id: 's1_q1',
                label: 'Question 1',
                type: 'text',
                required: true,
              },
            ],
          },
        ],
        status: 'generating',
      })
      .eq('id', testBlueprintId);

    // Step 3: Submit dynamic answers
    const submitResponse = await fetch('http://localhost:3000/api/dynamic-answers/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        blueprintId: testBlueprintId,
        answers: {
          s1_q1: 'Test answer',
        },
      }),
    });

    expect(submitResponse.ok).toBe(true);
    const submitData = await submitResponse.json();
    expect(submitData.success).toBe(true);

    // Step 4: Verify status is NOT 'completed' yet
    blueprint = await supabase
      .from('blueprint_generator')
      .select('*')
      .eq('id', testBlueprintId)
      .single();

    // CRITICAL ASSERTION: Status should NOT be 'completed'
    expect(blueprint.data?.status).not.toBe('completed');
    expect(blueprint.data?.dynamic_answers).toEqual({ s1_q1: 'Test answer' });

    // Step 5: Call generation endpoint
    const generateResponse = await fetch('http://localhost:3000/api/blueprints/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        blueprintId: testBlueprintId,
      }),
    });

    expect(generateResponse.ok).toBe(true);
    const generateData = await generateResponse.json();
    expect(generateData.success).toBe(true);

    // Step 6: Verify status is NOW 'completed' with blueprint data
    blueprint = await supabase
      .from('blueprint_generator')
      .select('*')
      .eq('id', testBlueprintId)
      .single();

    expect(blueprint.data?.status).toBe('completed');
    expect(blueprint.data?.blueprint_json).toBeDefined();
    expect(blueprint.data?.blueprint_json).not.toEqual({});
    expect(blueprint.data?.blueprint_markdown).toBeTruthy();
  });

  it('should not skip generation for status=answering', async () => {
    // Setup blueprint with status='answering'
    await supabase
      .from('blueprint_generator')
      .update({
        dynamic_questions: [{ id: 's1', title: 'Test', questions: [] }],
        dynamic_answers: { s1_q1: 'answer' },
        status: 'answering',
      })
      .eq('id', testBlueprintId);

    // Call generation endpoint
    const generateResponse = await fetch('http://localhost:3000/api/blueprints/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        blueprintId: testBlueprintId,
      }),
    });

    expect(generateResponse.ok).toBe(true);

    // Verify generation actually happened (would take >60 seconds in real scenario)
    const data = await generateResponse.json();
    expect(data.success).toBe(true);
    expect(data.metadata).toBeDefined();
    expect(data.metadata.model).toBeDefined();
  });

  it('should handle generation failures gracefully', async () => {
    // Mock the generation service to fail
    const { blueprintGenerationService } = await import(
      '@/lib/services/blueprintGenerationService'
    );
    vi.mocked(blueprintGenerationService.generate).mockResolvedValueOnce({
      success: false,
      error: 'Gemini API error',
      metadata: {} as any,
      blueprint: {} as any,
    });

    // Setup blueprint ready for generation
    await supabase
      .from('blueprint_generator')
      .update({
        dynamic_questions: [{ id: 's1', title: 'Test', questions: [] }],
        dynamic_answers: { s1_q1: 'answer' },
        status: 'answering',
      })
      .eq('id', testBlueprintId);

    // Call generation endpoint
    const generateResponse = await fetch('http://localhost:3000/api/blueprints/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        blueprintId: testBlueprintId,
      }),
    });

    expect(generateResponse.status).toBe(500);
    const data = await generateResponse.json();
    expect(data.success).toBe(false);
    expect(data.error).toBeDefined();

    // Verify status was set to 'error'
    const blueprint = await supabase
      .from('blueprint_generator')
      .select('status')
      .eq('id', testBlueprintId)
      .single();

    expect(blueprint.data?.status).toBe('error');
  });

  it('should maintain data integrity through the flow', async () => {
    const staticAnswers = {
      section_1_role_experience: { current_role: 'Designer' },
      section_2_organization: { organization_name: 'Test Inc' },
      section_3_learning_gap: { learning_gap_description: 'Gap' },
    };

    const dynamicAnswers = {
      s1_q1: 'answer1',
      s1_q2: ['option1', 'option2'],
      s1_q3: 7,
    };

    // Setup blueprint
    await supabase
      .from('blueprint_generator')
      .update({
        static_answers: staticAnswers,
        dynamic_questions: [{ id: 's1', title: 'Test', questions: [] }],
        dynamic_answers: dynamicAnswers,
        status: 'answering',
      })
      .eq('id', testBlueprintId);

    // Generate blueprint
    await fetch('http://localhost:3000/api/blueprints/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ blueprintId: testBlueprintId }),
    });

    // Verify all data preserved
    const blueprint = await supabase
      .from('blueprint_generator')
      .select('*')
      .eq('id', testBlueprintId)
      .single();

    expect(blueprint.data?.static_answers).toEqual(staticAnswers);
    expect(blueprint.data?.dynamic_answers).toEqual(dynamicAnswers);
    expect(blueprint.data?.dynamic_questions).toBeDefined();
  });
});
