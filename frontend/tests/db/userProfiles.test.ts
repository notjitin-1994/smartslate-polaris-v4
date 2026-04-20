import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { upsertUserProfile, getUserProfile } from '@/lib/db/userProfiles';

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

describeMaybe('db/userProfiles (integration)', () => {
  beforeAll(async () => {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing SUPABASE envs (URL/service role key) for integration tests');
    }
    serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    testUserId = await ensureTestUser();
  });

  afterAll(async () => {
    if (serviceClient && testUserId) {
      await serviceClient.auth.admin.deleteUser(testUserId);
    }
  });

  it('upserts and fetches user profile', async () => {
    const saved = await upsertUserProfile(
      { user_id: testUserId, full_name: 'Jane Doe' },
      serviceClient
    );
    expect(saved.user_id).toBe(testUserId);
    expect(saved.full_name).toBe('Jane Doe');

    const fetched = await getUserProfile(testUserId, serviceClient);
    expect(fetched?.user_id).toBe(testUserId);
  });
});
