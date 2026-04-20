import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { BlueprintService } from '@/lib/db/blueprints';
import { Blueprint } from '@/lib/ollama/schema';
import { AggregatedAnswer } from '@/lib/services/answerAggregation';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

function isServiceRoleKey(key: string): boolean {
  try {
    const payloadPart = key.split('.')[1];
    const json = JSON.parse(Buffer.from(payloadPart, 'base64').toString('utf8'));
    return json.role === 'service_role';
  } catch {
    return false;
  }
}

const describeMaybe = isServiceRoleKey(SUPABASE_SERVICE_ROLE_KEY) ? describe : describe.skip;

let serviceClient: SupabaseClient;
let blueprintService: BlueprintService;
let testUserId: string;

async function ensureTestUser(): Promise<string> {
  const email = `test+${Date.now()}@example.com`;
  const password = 'Password123!';
  const { data, error } = await serviceClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error || !data.user) throw error ?? new Error('Failed to create test user');
  return data.user.id;
}

describeMaybe('BlueprintService (integration)', () => {
  beforeAll(async () => {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing SUPABASE envs (URL/service role key) for integration tests');
    }
    serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    blueprintService = new BlueprintService(serviceClient);
    testUserId = await ensureTestUser();
  });

  afterAll(async () => {
    if (serviceClient && testUserId) {
      await serviceClient.auth.admin.deleteUser(testUserId);
    }
  });

  it('should save a new blueprint', async () => {
    const testBlueprint: Blueprint = {
      title: 'Test Blueprint',
      overview: 'Test overview',
      learningObjectives: ['Test objective'],
      modules: [
        {
          title: 'Test Module',
          duration: 2,
          topics: ['Topic 1'],
          activities: ['Activity 1'],
          assessments: ['Assessment 1'],
        },
      ],
    };

    const aggregatedAnswers: AggregatedAnswer = {
      staticResponses: [],
      dynamicResponses: [],
    };

    const savedBlueprint = await blueprintService.saveBlueprint(
      testUserId,
      testBlueprint,
      '# Test Blueprint\n\nTest overview',
      aggregatedAnswers
    );

    expect(savedBlueprint.user_id).toBe(testUserId);
    expect(savedBlueprint.blueprint_json).toEqual(testBlueprint);
    expect(savedBlueprint.blueprint_markdown).toBe('# Test Blueprint\n\nTest overview');
    expect(savedBlueprint.version).toBe(1);
    expect(savedBlueprint.status).toBe('completed');
  });

  it('should retrieve the latest version of a blueprint', async () => {
    const testBlueprint: Blueprint = {
      title: 'Version Test Blueprint',
      overview: 'Version test overview',
      learningObjectives: ['Version test objective'],
      modules: [
        {
          title: 'Version Test Module',
          duration: 1,
          topics: ['Version Topic'],
          activities: ['Version Activity'],
          assessments: ['Version Assessment'],
        },
      ],
    };

    const aggregatedAnswers: AggregatedAnswer = {
      staticResponses: [],
      dynamicResponses: [],
    };

    // Save first version
    const firstVersion = await blueprintService.saveBlueprint(
      testUserId,
      testBlueprint,
      '# Version Test Blueprint\n\nVersion test overview',
      aggregatedAnswers
    );

    // Update the blueprint (should create version 2)
    const updatedBlueprint: Blueprint = {
      ...testBlueprint,
      overview: 'Updated version test overview',
    };

    await blueprintService.saveBlueprint(
      testUserId,
      updatedBlueprint,
      '# Version Test Blueprint\n\nUpdated version test overview',
      aggregatedAnswers,
      firstVersion.id
    );

    // Get the latest version
    const latest = await blueprintService.getBlueprint(firstVersion.id);
    expect(latest?.version).toBe(2);
    expect(latest?.blueprint_json.overview).toBe('Updated version test overview');
  });

  it('should retrieve a specific version of a blueprint', async () => {
    const testBlueprint: Blueprint = {
      title: 'Specific Version Blueprint',
      overview: 'Specific version overview',
      learningObjectives: ['Specific version objective'],
      modules: [
        {
          title: 'Specific Version Module',
          duration: 3,
          topics: ['Specific Topic'],
          activities: ['Specific Activity'],
          assessments: ['Specific Assessment'],
        },
      ],
    };

    const aggregatedAnswers: AggregatedAnswer = {
      staticResponses: [],
      dynamicResponses: [],
    };

    // Save first version
    const firstVersion = await blueprintService.saveBlueprint(
      testUserId,
      testBlueprint,
      '# Specific Version Blueprint\n\nSpecific version overview',
      aggregatedAnswers
    );

    // Update the blueprint (should create version 2)
    const updatedBlueprint: Blueprint = {
      ...testBlueprint,
      overview: 'Updated specific version overview',
    };

    await blueprintService.saveBlueprint(
      testUserId,
      updatedBlueprint,
      '# Specific Version Blueprint\n\nUpdated specific version overview',
      aggregatedAnswers,
      firstVersion.id
    );

    // Get the first version specifically
    const first = await blueprintService.getBlueprint(firstVersion.id, 1);
    expect(first?.version).toBe(1);
    expect(first?.blueprint_json.overview).toBe('Specific version overview');
  });

  it('should retrieve all versions of a blueprint', async () => {
    const testBlueprint: Blueprint = {
      title: 'All Versions Blueprint',
      overview: 'All versions overview',
      learningObjectives: ['All versions objective'],
      modules: [
        {
          title: 'All Versions Module',
          duration: 4,
          topics: ['All Versions Topic'],
          activities: ['All Versions Activity'],
          assessments: ['All Versions Assessment'],
        },
      ],
    };

    const aggregatedAnswers: AggregatedAnswer = {
      staticResponses: [],
      dynamicResponses: [],
    };

    // Save first version
    const firstVersion = await blueprintService.saveBlueprint(
      testUserId,
      testBlueprint,
      '# All Versions Blueprint\n\nAll versions overview',
      aggregatedAnswers
    );

    // Update the blueprint twice (should create versions 2 and 3)
    const updatedBlueprint1: Blueprint = {
      ...testBlueprint,
      overview: 'Updated all versions overview 1',
    };

    await blueprintService.saveBlueprint(
      testUserId,
      updatedBlueprint1,
      '# All Versions Blueprint\n\nUpdated all versions overview 1',
      aggregatedAnswers,
      firstVersion.id
    );

    const updatedBlueprint2: Blueprint = {
      ...testBlueprint,
      overview: 'Updated all versions overview 2',
    };

    await blueprintService.saveBlueprint(
      testUserId,
      updatedBlueprint2,
      '# All Versions Blueprint\n\nUpdated all versions overview 2',
      aggregatedAnswers,
      firstVersion.id
    );

    // Get all versions
    const allVersions = await blueprintService.getBlueprintVersions(firstVersion.id);
    expect(allVersions).toHaveLength(3);
    expect(allVersions[0].version).toBe(1);
    expect(allVersions[1].version).toBe(2);
    expect(allVersions[2].version).toBe(3);
    expect(allVersions[0].blueprint_json.overview).toBe('All versions overview');
    expect(allVersions[1].blueprint_json.overview).toBe('Updated all versions overview 1');
    expect(allVersions[2].blueprint_json.overview).toBe('Updated all versions overview 2');
  });

  it('should handle errors gracefully', async () => {
    const testBlueprint: Blueprint = {
      title: 'Error Test Blueprint',
      overview: 'Error test overview',
      learningObjectives: ['Error test objective'],
      modules: [
        {
          title: 'Error Test Module',
          duration: 1,
          topics: ['Error Topic'],
          activities: ['Error Activity'],
          assessments: ['Error Assessment'],
        },
      ],
    };

    const aggregatedAnswers: AggregatedAnswer = {
      staticResponses: [],
      dynamicResponses: [],
    };

    // Test with invalid user ID
    await expect(
      blueprintService.saveBlueprint(
        'invalid-user-id',
        testBlueprint,
        '# Error Test Blueprint\n\nError test overview',
        aggregatedAnswers
      )
    ).rejects.toThrow();

    // Test getBlueprint with non-existent ID
    const nonExistent = await blueprintService.getBlueprint('non-existent-id');
    expect(nonExistent).toBeNull();
  });

  it('should create distinct draft blueprints and not mutate previous drafts', async () => {
    // Create first draft
    const { data: draft1, error: err1 } = await serviceClient
      .from('blueprint_generator')
      .insert({ user_id: testUserId, status: 'draft', static_answers: { role: 'Alpha' } })
      .select()
      .single();
    if (err1 || !draft1) throw err1 ?? new Error('Failed to insert first draft');

    // Create second draft
    const { data: draft2, error: err2 } = await serviceClient
      .from('blueprint_generator')
      .insert({ user_id: testUserId, status: 'draft', static_answers: { role: 'Beta' } })
      .select()
      .single();
    if (err2 || !draft2) throw err2 ?? new Error('Failed to insert second draft');

    // Ensure distinct UUIDs
    expect(draft1.id).toBeTypeOf('string');
    expect(draft2.id).toBeTypeOf('string');
    expect(draft1.id).not.toBe(draft2.id);

    // Update second draft to simulate autosave and ensure first remains unchanged
    const { error: updateErr } = await serviceClient
      .from('blueprint_generator')
      .update({ static_answers: { role: 'Gamma' } })
      .eq('id', draft2.id);
    if (updateErr) throw updateErr;

    const { data: firstRow, error: fetchErr } = await serviceClient
      .from('blueprint_generator')
      .select('id, static_answers')
      .eq('id', draft1.id)
      .single();
    if (fetchErr || !firstRow) throw fetchErr ?? new Error('Failed to fetch first draft');

    expect((firstRow.static_answers as any).role).toBe('Alpha');

    // Cleanup
    await serviceClient.from('blueprint_generator').delete().in('id', [draft1.id, draft2.id]);
  });
});
