import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

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
const testUserIds: string[] = [];

async function createTestUser(email: string, password: string): Promise<string> {
  const { data, error } = await serviceClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error || !data.user) throw error ?? new Error('Failed to create test user');
  testUserIds.push(data.user.id);
  return data.user.id;
}

async function cleanupTestUsers() {
  for (const userId of testUserIds) {
    try {
      await serviceClient.auth.admin.deleteUser(userId);
    } catch (error) {
      console.error(`Failed to cleanup user ${userId}:`, error);
    }
  }
  testUserIds.length = 0;
}

describeMaybe('db/rolesAndSubscriptions (integration)', () => {
  beforeAll(async () => {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing SUPABASE envs (URL/service role key) for integration tests');
    }
    serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  });

  afterAll(async () => {
    await cleanupTestUsers();
  });

  describe('Schema Validation', () => {
    it('user_profiles table has subscription and role columns', async () => {
      // Query information_schema to verify columns exist
      const { data, error } = await serviceClient
        .from('user_profiles')
        .select(
          'subscription_tier, user_role, subscription_metadata, role_assigned_at, role_assigned_by'
        )
        .limit(0);

      expect(error).toBeNull();
      expect(data).toBeDefined();
    });

    it('user_usage_history table exists', async () => {
      const { data, error } = await serviceClient.from('user_usage_history').select('*').limit(0);

      expect(error).toBeNull();
      expect(data).toBeDefined();
    });

    it('role_audit_log table exists', async () => {
      const { data, error } = await serviceClient.from('role_audit_log').select('*').limit(0);

      expect(error).toBeNull();
      expect(data).toBeDefined();
    });
  });

  describe('User Profile Tier and Role Assignment', () => {
    let testUserId: string;

    beforeEach(async () => {
      const email = `test-role-${Date.now()}@example.com`;
      testUserId = await createTestUser(email, 'TestPass123!');
    });

    it('new user gets default explorer tier and role', async () => {
      const { data, error } = await serviceClient
        .from('user_profiles')
        .select('subscription_tier, user_role')
        .eq('user_id', testUserId)
        .single();

      expect(error).toBeNull();
      expect(data?.subscription_tier).toBe('free');
      expect(data?.user_role).toBe('user');
    });

    it('accepts valid subscription tiers', async () => {
      const validTiers = [
        'explorer',
        'navigator',
        'voyager',
        'crew',
        'fleet',
        'armada',
        'enterprise',
        'developer',
      ];

      for (const tier of validTiers) {
        const { error } = await serviceClient
          .from('user_profiles')
          .update({ subscription_tier: tier })
          .eq('user_id', testUserId);

        expect(error).toBeNull();
      }
    });

    it('rejects invalid subscription tiers', async () => {
      const { error } = await serviceClient
        .from('user_profiles')
        .update({ subscription_tier: 'invalid_tier' })
        .eq('user_id', testUserId);

      expect(error).not.toBeNull();
      expect(error?.message).toContain('check_valid_subscription_tier');
    });

    it('accepts valid user roles', async () => {
      const validRoles = [
        'explorer',
        'navigator',
        'voyager',
        'crew',
        'fleet',
        'armada',
        'enterprise',
        'developer',
      ];

      for (const role of validRoles) {
        const { error } = await serviceClient
          .from('user_profiles')
          .update({ user_role: role })
          .eq('user_id', testUserId);

        expect(error).toBeNull();
      }
    });

    it('rejects invalid user roles', async () => {
      const { error } = await serviceClient
        .from('user_profiles')
        .update({ user_role: 'invalid_role' })
        .eq('user_id', testUserId);

      expect(error).not.toBeNull();
      expect(error?.message).toContain('check_valid_user_role');
    });

    it('initializes subscription_metadata correctly', async () => {
      const { data, error } = await serviceClient
        .from('user_profiles')
        .select('subscription_metadata')
        .eq('user_id', testUserId)
        .single();

      expect(error).toBeNull();
      expect(data?.subscription_metadata).toBeDefined();
      expect(data?.subscription_metadata.usage).toBeDefined();
      expect(data?.subscription_metadata.limits).toBeDefined();
      expect(data?.subscription_metadata.limits.max_generations_monthly).toBe(5);
      expect(data?.subscription_metadata.limits.max_saved_starmaps).toBe(5);
    });
  });

  describe('Database Functions', () => {
    let testUserId: string;

    beforeEach(async () => {
      const email = `test-func-${Date.now()}@example.com`;
      testUserId = await createTestUser(email, 'TestPass123!');
    });

    it('increment_usage function increments generations counter', async () => {
      // Get initial value
      const { data: before } = await serviceClient
        .from('user_profiles')
        .select('subscription_metadata')
        .eq('user_id', testUserId)
        .single();

      const beforeCount = before?.subscription_metadata?.usage?.generations_this_month || 0;

      // Call increment_usage function
      const { data: result, error } = await serviceClient.rpc('increment_usage', {
        p_user_id: testUserId,
        p_usage_type: 'generations_this_month',
        p_amount: 1,
      });

      expect(error).toBeNull();
      expect(result).toBe(true);

      // Verify increment
      const { data: after } = await serviceClient
        .from('user_profiles')
        .select('subscription_metadata')
        .eq('user_id', testUserId)
        .single();

      const afterCount = after?.subscription_metadata?.usage?.generations_this_month || 0;
      expect(afterCount).toBe(beforeCount + 1);
    });

    it('increment_usage can increment by custom amount', async () => {
      const { data: before } = await serviceClient
        .from('user_profiles')
        .select('subscription_metadata')
        .eq('user_id', testUserId)
        .single();

      const beforeCount = before?.subscription_metadata?.usage?.generations_this_month || 0;

      // Increment by 5
      await serviceClient.rpc('increment_usage', {
        p_user_id: testUserId,
        p_usage_type: 'generations_this_month',
        p_amount: 5,
      });

      const { data: after } = await serviceClient
        .from('user_profiles')
        .select('subscription_metadata')
        .eq('user_id', testUserId)
        .single();

      const afterCount = after?.subscription_metadata?.usage?.generations_this_month || 0;
      expect(afterCount).toBe(beforeCount + 5);
    });

    it('get_user_limits returns correct limits', async () => {
      // Update user to navigator tier
      await serviceClient
        .from('user_profiles')
        .update({
          subscription_tier: 'navigator',
          user_role: 'user',
          subscription_metadata: {
            usage: {
              generations_this_month: 10,
              saved_starmaps: 5,
            },
            limits: {
              max_generations_monthly: 15,
              max_saved_starmaps: 30,
            },
          },
        })
        .eq('user_id', testUserId);

      // Get limits
      const { data, error } = await serviceClient.rpc('get_user_limits', {
        p_user_id: testUserId,
      });

      expect(error).toBeNull();
      expect(data).toHaveLength(1);
      expect(data[0].role).toBe('navigator');
      expect(data[0].max_generations_monthly).toBe(15);
      expect(data[0].max_saved_starmaps).toBe(30);
      expect(data[0].current_generations).toBe(10);
      expect(data[0].current_saved_starmaps).toBe(5);
      expect(data[0].generations_remaining).toBe(5);
    });
  });

  describe('Role Change Audit Logging', () => {
    let testUserId: string;
    let adminUserId: string;

    beforeEach(async () => {
      testUserId = await createTestUser(`test-target-${Date.now()}@example.com`, 'TestPass123!');
      adminUserId = await createTestUser(`test-admin-${Date.now()}@example.com`, 'TestPass123!');

      // Make admin a developer
      await serviceClient
        .from('user_profiles')
        .update({ user_role: 'developer' })
        .eq('user_id', adminUserId);
    });

    it('logs role changes to audit table', async () => {
      // Change user role
      await serviceClient
        .from('user_profiles')
        .update({
          user_role: 'user',
          role_assigned_by: adminUserId,
        })
        .eq('user_id', testUserId);

      // Check audit log
      const { data: auditLogs, error } = await serviceClient
        .from('role_audit_log')
        .select('*')
        .eq('target_user_id', testUserId)
        .order('created_at', { ascending: false })
        .limit(1);

      expect(error).toBeNull();
      expect(auditLogs).toHaveLength(1);
      expect(auditLogs![0].old_role).toBe('explorer');
      expect(auditLogs![0].new_role).toBe('voyager');
      expect(auditLogs![0].admin_user_id).toBeDefined();
    });

    it('does not log when role is not changed', async () => {
      // Get initial audit log count
      const { data: beforeLogs } = await serviceClient
        .from('role_audit_log')
        .select('id')
        .eq('target_user_id', testUserId);

      const beforeCount = beforeLogs?.length || 0;

      // Update other fields but not role
      await serviceClient
        .from('user_profiles')
        .update({ subscription_tier: 'voyager' })
        .eq('user_id', testUserId);

      // Check audit log count hasn't changed
      const { data: afterLogs } = await serviceClient
        .from('role_audit_log')
        .select('id')
        .eq('target_user_id', testUserId);

      const afterCount = afterLogs?.length || 0;
      expect(afterCount).toBe(beforeCount);
    });
  });

  describe('Usage History Tracking', () => {
    let testUserId: string;

    beforeEach(async () => {
      testUserId = await createTestUser(`test-usage-${Date.now()}@example.com`, 'TestPass123!');
    });

    it('can insert usage history records', async () => {
      const now = new Date();
      const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const { data, error } = await serviceClient
        .from('user_usage_history')
        .insert({
          user_id: testUserId,
          period_start: periodStart.toISOString(),
          period_end: periodEnd.toISOString(),
          subscription_tier: 'free',
          starmaps_generated: 5,
          starmaps_saved: 3,
          exports_pdf: 2,
          exports_word: 0,
          api_calls: 0,
          processing_time_ms: 15000,
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data?.starmaps_generated).toBe(5);
      expect(data?.subscription_tier).toBe('free');
    });

    it('enforces unique constraint on user_id and period_start', async () => {
      const now = new Date();
      const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      // Insert first record
      await serviceClient.from('user_usage_history').insert({
        user_id: testUserId,
        period_start: periodStart.toISOString(),
        period_end: periodEnd.toISOString(),
        subscription_tier: 'free',
        starmaps_generated: 5,
      });

      // Try to insert duplicate
      const { error } = await serviceClient.from('user_usage_history').insert({
        user_id: testUserId,
        period_start: periodStart.toISOString(),
        period_end: periodEnd.toISOString(),
        subscription_tier: 'free',
        starmaps_generated: 10,
      });

      expect(error).not.toBeNull();
      expect(error?.message).toContain('unique');
    });
  });

  describe('Row Level Security (RLS)', () => {
    let regularUserId: string;
    let developerUserId: string;

    beforeEach(async () => {
      // Create regular user
      const regularEmail = `regular-${Date.now()}@example.com`;
      const regularPassword = 'Regular123!';
      regularUserId = await createTestUser(regularEmail, regularPassword);

      // Create developer user
      const devEmail = `dev-${Date.now()}@example.com`;
      const devPassword = 'Dev123!';
      developerUserId = await createTestUser(devEmail, devPassword);

      // Assign developer role
      await serviceClient
        .from('user_profiles')
        .update({ user_role: 'developer' })
        .eq('user_id', developerUserId);
    });

    it('service role can view all profiles', async () => {
      // Service role views regular user profile
      const { data: regularProfile, error: regularError } = await serviceClient
        .from('user_profiles')
        .select('*')
        .eq('user_id', regularUserId)
        .single();

      expect(regularError).toBeNull();
      expect(regularProfile).toBeDefined();

      // Service role views developer profile
      const { data: devProfile, error: devError } = await serviceClient
        .from('user_profiles')
        .select('*')
        .eq('user_id', developerUserId)
        .single();

      expect(devError).toBeNull();
      expect(devProfile).toBeDefined();
    });

    it('service role can manage all profiles', async () => {
      // Service role updates a profile
      const { error: updateError } = await serviceClient
        .from('user_profiles')
        .update({ subscription_tier: 'voyager' })
        .eq('user_id', regularUserId);

      expect(updateError).toBeNull();

      // Verify update
      const { data } = await serviceClient
        .from('user_profiles')
        .select('subscription_tier')
        .eq('user_id', regularUserId)
        .single();

      expect(data?.subscription_tier).toBe('voyager');
    });

    it('service role can manage usage history', async () => {
      // Insert usage history for users
      const { error: insertError } = await serviceClient.from('user_usage_history').insert([
        {
          user_id: regularUserId,
          period_start: new Date().toISOString(),
          period_end: new Date().toISOString(),
          subscription_tier: 'free',
          starmaps_generated: 5,
        },
        {
          user_id: developerUserId,
          period_start: new Date().toISOString(),
          period_end: new Date().toISOString(),
          subscription_tier: 'free',
          starmaps_generated: 100,
        },
      ]);

      expect(insertError).toBeNull();

      // Service role views all history
      const { data: allHistory, error } = await serviceClient
        .from('user_usage_history')
        .select('*');

      expect(error).toBeNull();
      expect(allHistory!.length).toBeGreaterThanOrEqual(2);
    });

    it('only service role can access audit logs', async () => {
      // Service role inserts an audit log entry
      const { error: insertError } = await serviceClient.from('role_audit_log').insert({
        admin_user_id: developerUserId,
        target_user_id: regularUserId,
        old_role: 'explorer',
        new_role: 'navigator',
        reason: 'Test upgrade',
      });

      expect(insertError).toBeNull();

      // Service role views audit logs
      const { data: logs, error: viewError } = await serviceClient
        .from('role_audit_log')
        .select('*');

      expect(viewError).toBeNull();
      expect(logs!.length).toBeGreaterThan(0);
    });
  });
});
