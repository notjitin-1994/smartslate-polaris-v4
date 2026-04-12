import { db } from '@/lib/db';
import { starmaps, chatMessages } from '@/lib/db/schema';
import { eq, and, asc } from 'drizzle-orm';
import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import { DiscoveryClient } from '@/components/Discovery/DiscoveryClient';

export default async function DiscoveryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/auth/login');
  }

  let starmapData;
  let history: any[] = [];

  try {
    // Fetch starmap with responses on the server
    starmapData = await db.query.starmaps.findFirst({
      where: and(
        eq(starmaps.id, id),
        eq(starmaps.userId, user.id)
      ),
      with: {
        starmapResponses: true,
      },
    });

    if (starmapData) {
      // Fetch initial chat messages on the server
      const rawHistory = await db.query.chatMessages.findMany({
        where: eq(chatMessages.starmapId, id),
        orderBy: [asc(chatMessages.createdAt)],
      });
      console.log(`[DiscoveryPage] Fetched ${rawHistory?.length ?? 0} messages for starmap ${id}`);
      history = rawHistory;
    }
  } catch (error) {
    console.error('[DiscoveryPage] Data Fetch Error:', error);
    throw error;
  }

  if (!starmapData) {
    notFound();
  }

  // Use JSON.parse(JSON.stringify()) to guarantee clean serialization
  const serializedStarmap = JSON.parse(JSON.stringify(starmapData));
  const serializedMessages = JSON.parse(JSON.stringify(history));

  return (
    <DiscoveryClient 
      initialStarmap={serializedStarmap} 
      initialMessages={serializedMessages} 
    />
  );
}
