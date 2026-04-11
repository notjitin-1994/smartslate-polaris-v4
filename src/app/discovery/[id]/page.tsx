import { db } from '@/lib/db';
import { starmaps, messages } from '@/lib/db/schema';
import { eq, and, asc } from 'drizzle-orm';
import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import { DiscoveryClient } from '@/components/Discovery/DiscoveryClient';

export default async function DiscoveryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  try {
    const { id } = await params;
    console.log('[DiscoveryPage] Initializing for ID:', id);
    
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.log('[DiscoveryPage] Auth error or no user:', authError);
      redirect('/auth/login');
    }

    console.log('[DiscoveryPage] User authenticated:', user.id);

    // Fetch starmap with responses on the server
    console.log('[DiscoveryPage] Fetching starmap data...');
    const starmapData = await db.query.starmaps.findFirst({
      where: and(
        eq(starmaps.id, id),
        eq(starmaps.userId, user.id)
      ),
      with: {
        starmapResponses: true,
      },
    });

    if (!starmapData) {
      console.log('[DiscoveryPage] Starmap not found');
      notFound();
    }

    console.log('[DiscoveryPage] Starmap found:', starmapData.id);

    // Fetch initial chat messages on the server
    console.log('[DiscoveryPage] Fetching chat messages...');
    const chatMessages = await db.query.messages.findMany({
      where: eq(messages.starmapId, id),
      orderBy: [asc(messages.createdAt)],
    });

    console.log('[DiscoveryPage] Messages fetched, count:', chatMessages.length);

    // Use JSON.parse(JSON.stringify()) to guarantee clean serialization
    console.log('[DiscoveryPage] Serializing data...');
    const serializedStarmap = JSON.parse(JSON.stringify(starmapData));
    const serializedMessages = JSON.parse(JSON.stringify(chatMessages));

    console.log('[DiscoveryPage] Rendering DiscoveryClient');
    return (
      <DiscoveryClient 
        initialStarmap={serializedStarmap} 
        initialMessages={serializedMessages} 
      />
    );
  } catch (error) {
    console.error('[DiscoveryPage] Server Component Error:', error);
    // Re-throw to let Next.js handle it, but now it's logged
    throw error;
  }
}
