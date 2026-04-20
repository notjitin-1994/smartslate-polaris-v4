import { getSupabaseServerClient } from '@/lib/supabase/server';
import type { Database } from '@/types/supabase';

export type UserProfileRow = Database['public']['Tables']['user_profiles']['Row'];
export type UserProfileInsert = Database['public']['Tables']['user_profiles']['Insert'];
export type UserProfileUpdate = Database['public']['Tables']['user_profiles']['Update'];

export async function upsertUserProfile(
  profile: UserProfileInsert,
  client?: Awaited<ReturnType<typeof getSupabaseServerClient>>
): Promise<UserProfileRow> {
  const supabaseClient = client ?? (await getSupabaseServerClient());
  const { data, error } = await supabaseClient
    .from('user_profiles')
    .upsert(profile, { onConflict: 'user_id' })
    .select()
    .single();
  if (error) throw error;
  return data as UserProfileRow;
}

export async function getUserProfile(
  userId: string,
  client?: Awaited<ReturnType<typeof getSupabaseServerClient>>
): Promise<UserProfileRow | null> {
  const supabaseClient = client ?? (await getSupabaseServerClient());
  const { data, error } = await supabaseClient
    .from('user_profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return (data as UserProfileRow | null) ?? null;
}
