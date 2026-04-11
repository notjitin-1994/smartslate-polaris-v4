import { db } from '@/lib/db';
import { messages, starmaps } from '@/lib/db/schema';
import { eq, and, asc } from 'drizzle-orm';
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify starmap ownership
    const starmap = await db.query.starmaps.findFirst({
      where: and(
        eq(starmaps.id, id),
        eq(starmaps.userId, user.id)
      )
    });

    if (!starmap) {
      return NextResponse.json({ error: 'Starmap not found' }, { status: 404 });
    }

    // Fetch messages
    const chatMessages = await db.query.messages.findMany({
      where: eq(messages.starmapId, id),
      orderBy: [asc(messages.createdAt)],
    });

    // Format for useChat initialMessages
    const formattedMessages = chatMessages.map((m) => ({
      id: m.id,
      role: m.role,
      parts: m.parts,
      createdAt: m.createdAt,
    }));

    return NextResponse.json(formattedMessages);
  } catch (error) {
    console.error('[API] Error fetching messages:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
