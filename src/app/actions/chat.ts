'use server';

import { getSafeAdminClient } from '@/lib/supabase/registry';

/**
 * Resilient Stage Metadata Update
 * Uses the registry client to prevent constructor crashes.
 */
export async function updateStarmapStage({ starmapId, stageNumber }: { starmapId: string, stageNumber: number }) {
  const admin = getSafeAdminClient();
  
  // Use snake_case for direct Supabase/PostgREST interaction
  await admin.from('starmaps').update({ 
    context: { currentStage: stageNumber },
    updated_at: new Date().toISOString() 
  }).eq('id', starmapId);
}
