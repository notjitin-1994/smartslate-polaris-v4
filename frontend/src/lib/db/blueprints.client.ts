import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { BlueprintService } from './blueprints';

export function createBrowserBlueprintService(): BlueprintService {
  return new BlueprintService(getSupabaseBrowserClient());
}
