'use server';

import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { starmaps } from '@/lib/db/schema';
import { redirect } from 'next/navigation';

export async function createStarmap() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const [newStarmap] = await db.insert(starmaps)
    .values({
      userId: user.id,
      title: 'Untitled Strategy Blueprint',
      status: 'draft',
    })
    .returning();

  redirect(`/discovery/${newStarmap.id}`);
}
