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
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      redirect('/auth/login');
    }

    // Fetch starmap with responses on the server
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
      notFound();
    }

    // Fetch initial chat messages on the server
    const chatMessages = await db.query.messages.findMany({
      where: eq(messages.starmapId, id),
      orderBy: [asc(messages.createdAt)],
    });

    // Use JSON.parse(JSON.stringify()) to guarantee clean serialization of all nested fields (Dates, nulls, etc.)
    const serializedStarmap = JSON.parse(JSON.stringify(starmapData));
    const serializedMessages = JSON.parse(JSON.stringify(chatMessages.map(m => ({
      ...m,
      role: m.role,
      parts: m.parts,
    }))));

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
