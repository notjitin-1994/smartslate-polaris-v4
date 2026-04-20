import { getSupabaseBrowserClient } from '@/lib/supabase/client-fixed';
import { BlueprintService } from './blueprints';

export function createBrowserBlueprintService(): BlueprintService {
  return new BlueprintService(getSupabaseBrowserClient());
}
