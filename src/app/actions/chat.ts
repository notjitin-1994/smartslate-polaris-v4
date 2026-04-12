'use server';

import { db } from '@/lib/db';
import { starmaps } from '@/lib/db/schema';
import { createClient } from '@/lib/supabase/server';
import { eq, and } from 'drizzle-orm';

// persistMessage removed — all persistence now handled server-side in route.ts onFinish

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
