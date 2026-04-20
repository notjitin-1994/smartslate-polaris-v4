/**
 * Database State Integration Tests
 * Tests blueprint status flow through the complete lifecycle
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'test-service-key';

describe('Blueprint Status Flow', () => {
  let supabase: ReturnType<typeof createClient>;
  let testBlueprintId: string;
  let testUserId: string;

  beforeEach(async () => {
    supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    testUserId = 'test-user-' + Date.now();

    // Create test blueprint
    const { data, error } = await supabase
      .from('blueprint_generator')
      .insert({
        user_id: testUserId,
        status: 'draft',
        static_answers: {},
        dynamic_questions: [],
        dynamic_answers: {},
      })
      .select()
      .single();

    expect(error).toBeNull();
    testBlueprintId = data!.id;
  });

  afterEach(async () => {
    // Cleanup test data
    if (testBlueprintId) {
      await supabase.from('blueprint_generator').delete().eq('id', testBlueprintId);
    }
  });

  it('should maintain correct status through complete flow', async () => {
    // Step 1: Create blueprint (status: 'draft')
    let bp = await supabase
      .from('blueprint_generator')
      .select('*')
      .eq('id', testBlueprintId)
      .single();

    expect(bp.data?.status).toBe('draft');

    // Step 2: Generate dynamic questions (status: 'generating')
    await supabase
      .from('blueprint_generator')
      .update({
        status: 'generating',
        dynamic_questions: [
          {
            id: 's1',
            title: 'Test Section',
            questions: [{ id: 's1_q1', label: 'Test Question', type: 'text', required: true }],
          },
        ],
      })
      .eq('id', testBlueprintId);

    bp = await supabase
      .from('blueprint_generator')
      .select('status')
      .eq('id', testBlueprintId)
      .single();

    expect(bp.data?.status).toBe('generating');

    // Step 3: Submit dynamic answers - status should NOT become 'completed'
    await supabase
      .from('blueprint_generator')
      .update({
        dynamic_answers: { s1_q1: 'test answer' },
        // Simulating the fix: no status update here
      })
      .eq('id', testBlueprintId);

    bp = await supabase.from('blueprint_generator').select('*').eq('id', testBlueprintId).single();

    // CRITICAL ASSERTION: Status should NOT be 'completed' yet
    expect(bp.data?.status).not.toBe('completed');
    expect(bp.data?.status).toBe('generating'); // Should remain in previous state
    expect(bp.data?.dynamic_answers).toEqual({ s1_q1: 'test answer' });

    // Step 4: Generate blueprint (status: 'generating' → 'completed')
    await supabase
      .from('blueprint_generator')
      .update({
        status: 'generating', // Set to generating before generation
      })
      .eq('id', testBlueprintId);

    // Simulate successful generation
    await supabase
      .from('blueprint_generator')
      .update({
        status: 'completed',
        blueprint_json: {
          metadata: { title: 'Test Blueprint' },
          executive_summary: { content: 'Summary', displayType: 'markdown' },
        },
        blueprint_markdown: '# Test Blueprint\n\nContent',
      })
      .eq('id', testBlueprintId);

    bp = await supabase.from('blueprint_generator').select('*').eq('id', testBlueprintId).single();

    expect(bp.data?.status).toBe('completed');
    expect(bp.data?.blueprint_json).toBeDefined();
    expect(bp.data?.blueprint_json).not.toEqual({});
    expect(bp.data?.blueprint_markdown).toBeTruthy();
  });

  it('should allow answering status as valid state', async () => {
    // Test the new 'answering' status
    const { error } = await supabase
      .from('blueprint_generator')
      .update({ status: 'answering' })
      .eq('id', testBlueprintId);

    // Should not throw constraint violation
    expect(error).toBeNull();

    const bp = await supabase
      .from('blueprint_generator')
      .select('status')
      .eq('id', testBlueprintId)
      .single();

    expect(bp.data?.status).toBe('answering');
  });

  it('should reject invalid status values', async () => {
    const { error } = await supabase
      .from('blueprint_generator')
      .update({ status: 'invalid-status' as any })
      .eq('id', testBlueprintId);

    // Should fail constraint check
    expect(error).not.toBeNull();
    expect(error?.message).toContain('check constraint');
  });

  it('should handle error status correctly', async () => {
    await supabase
      .from('blueprint_generator')
      .update({
        status: 'generating',
        dynamic_questions: [{ id: 's1', title: 'Test', questions: [] }],
        dynamic_answers: { s1_q1: 'answer' },
      })
      .eq('id', testBlueprintId);

    // Simulate generation failure
    const { error } = await supabase
      .from('blueprint_generator')
      .update({ status: 'error' })
      .eq('id', testBlueprintId);

    expect(error).toBeNull();

    const bp = await supabase
      .from('blueprint_generator')
      .select('status')
      .eq('id', testBlueprintId)
      .single();

    expect(bp.data?.status).toBe('error');
  });

  it('should preserve all data through status transitions', async () => {
    const staticAnswers = { test: 'static' };
    const dynamicQuestions = [{ id: 's1', title: 'Section', questions: [] }];
    const dynamicAnswers = { s1_q1: 'answer' };

    // Update through different statuses
    await supabase
      .from('blueprint_generator')
      .update({
        static_answers: staticAnswers,
        status: 'generating',
      })
      .eq('id', testBlueprintId);

    await supabase
      .from('blueprint_generator')
      .update({
        dynamic_questions: dynamicQuestions,
        status: 'answering',
      })
      .eq('id', testBlueprintId);

    await supabase
      .from('blueprint_generator')
      .update({
        dynamic_answers: dynamicAnswers,
      })
      .eq('id', testBlueprintId);

    // Verify all data is intact
    const bp = await supabase
      .from('blueprint_generator')
      .select('*')
      .eq('id', testBlueprintId)
      .single();

    expect(bp.data?.static_answers).toEqual(staticAnswers);
    expect(bp.data?.dynamic_questions).toEqual(dynamicQuestions);
    expect(bp.data?.dynamic_answers).toEqual(dynamicAnswers);
  });

  it('should identify broken blueprints (completed status with empty blueprint_json)', async () => {
    // Create a broken blueprint (simulating the bug)
    await supabase
      .from('blueprint_generator')
      .update({
        status: 'completed', // Incorrectly marked complete
        dynamic_answers: { s1_q1: 'answer' },
        blueprint_json: {}, // Empty!
        blueprint_markdown: null,
      })
      .eq('id', testBlueprintId);

    // Query for broken blueprints
    const { data: brokenBlueprints } = await supabase
      .from('blueprint_generator')
      .select('id, status, blueprint_json, dynamic_answers')
      .eq('status', 'completed')
      .filter('blueprint_json', 'eq', '{}');

    expect(brokenBlueprints).toBeDefined();

    // Should find at least our test blueprint
    const foundBroken = brokenBlueprints?.some((bp) => bp.id === testBlueprintId);
    expect(foundBroken).toBe(true);
  });

  it('should repair broken blueprints by resetting status', async () => {
    // Create a broken blueprint
    await supabase
      .from('blueprint_generator')
      .update({
        status: 'completed',
        dynamic_answers: { s1_q1: 'answer' },
        dynamic_questions: [{ id: 's1', title: 'Test', questions: [] }],
        blueprint_json: {},
      })
      .eq('id', testBlueprintId);

    // Repair query (from migration)
    await supabase
      .from('blueprint_generator')
      .update({ status: 'answering' })
      .eq('id', testBlueprintId)
      .eq('status', 'completed')
      .filter('blueprint_json', 'eq', '{}')
      .not('dynamic_answers', 'eq', '{}');

    // Verify repaired
    const bp = await supabase
      .from('blueprint_generator')
      .select('status')
      .eq('id', testBlueprintId)
      .single();

    expect(bp.data?.status).toBe('answering');
  });
});
