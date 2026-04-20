import { getSupabaseServerClient } from '@/lib/supabase/server';
import { BlueprintService } from './blueprints';

export async function createServerBlueprintService(): Promise<BlueprintService> {
  const supabase = await getSupabaseServerClient();
  return new BlueprintService(supabase);
}
