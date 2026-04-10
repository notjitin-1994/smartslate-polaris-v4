import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { starmaps } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch starmap with responses
    const starmapData = await db.query.starmaps.findFirst({
      where: eq(starmaps.id, id),
      with: {
        starmapResponses: {
          orderBy: (responses, { asc }) => [asc(responses.createdAt)],
        },
      },
    });

    if (!starmapData) {
      return NextResponse.json({ error: 'Starmap not found' }, { status: 404 });
    }

    // Check ownership
    if (starmapData.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(starmapData);
  } catch (error) {
    console.error('[API] Error fetching starmap:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
