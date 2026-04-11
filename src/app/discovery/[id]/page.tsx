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

  // Format messages for useChat
  const formattedMessages = chatMessages.map((m) => ({
    id: m.id,
    role: m.role as any,
    parts: m.parts as any,
    createdAt: m.createdAt.toISOString(), // Convert Date to string
  }));

  // Ensure starmapData is also serializable
  const serializedStarmap = {
    ...starmapData,
    createdAt: starmapData.createdAt.toISOString(),
    updatedAt: starmapData.updatedAt.toISOString(),
    starmapResponses: starmapData.starmapResponses.map(r => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
    })),
  };

  return (
    <DiscoveryClient 
      initialStarmap={serializedStarmap as any} 
      initialMessages={formattedMessages as any} 
    />
  );
}
