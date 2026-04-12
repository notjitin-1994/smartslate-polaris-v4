'use server';

import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { starmaps } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function updateStarmapStage({ starmapId, stageNumber }: { starmapId: string, stageNumber: number }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  // Direct DB update for metadata
  await db.update(starmaps)
    .set({ 
      context: sql`jsonb_set(context, '{currentStage}', ${stageNumber}::text::jsonb)`,
      updatedAt: new Date() 
    })
    .where(eq(starmaps.id, starmapId));
}

// Helper for SQL fragment since we're using Drizzle
import { sql } from 'drizzle-orm';
