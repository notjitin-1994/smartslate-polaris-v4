'use server';

import { db } from '@/lib/db';
import { chatMessages as dbMessages, starmaps } from '@/lib/db/schema';
import { createClient } from '@/lib/supabase/server';
import { eq, and } from 'drizzle-orm';

export async function persistMessage({
  id,
  starmapId,
  role,
  parts,
}: {
  id: string;
  starmapId: string;
  role: 'user' | 'assistant' | 'tool' | 'system' | 'data';
  parts: any;
}) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error('Unauthorized');

    // Verify ownership
    const starmap = await db.query.starmaps.findFirst({
      where: and(
        eq(starmaps.id, starmapId),
        eq(starmaps.userId, user.id)
      ),
    });

    if (!starmap) throw new Error('Starmap not found or unauthorized');

    // Persist to DB
    await db.insert(dbMessages).values({
      id,
      starmapId,
      role,
      parts,
    }).onConflictDoNothing({ target: dbMessages.id });

    return { success: true };
  } catch (error) {
    console.error('[PersistMessage Action] Error:', error);
    return { success: false, error: String(error) };
  }
}

export async function updateStarmapStage({
  starmapId,
  stageNumber,
}: {
  starmapId: string;
  stageNumber: number;
}) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error('Unauthorized');

    const starmap = await db.query.starmaps.findFirst({
      where: and(
        eq(starmaps.id, starmapId),
        eq(starmaps.userId, user.id)
      ),
    });

    if (!starmap) throw new Error('Starmap not found or unauthorized');

    const nextStage = Math.min(stageNumber + 1, 8);

    await db.update(starmaps)
      .set({ 
        context: { ...starmap.context, currentStage: nextStage },
        updatedAt: new Date()
      })
      .where(eq(starmaps.id, starmapId));

    return { success: true, nextStage };
  } catch (error) {
    console.error('[UpdateStarmapStage Action] Error:', error);
    return { success: false, error: String(error) };
  }
}
