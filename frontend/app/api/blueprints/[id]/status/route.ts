/**
 * Blueprint Generation Status Endpoint
 * Returns current status for polling
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession, getSupabaseServerClient } from '@/lib/supabase/server';

interface StatusResponse {
  status: 'draft' | 'generating' | 'completed' | 'error';
  model?: string;
  duration?: number;
  timestamp?: string;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<StatusResponse>> {
  try {
    // Authenticate
    const { session } = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ status: 'error' }, { status: 401 });
    }

    const { id } = await params;

    // Fetch blueprint status
    const supabase = await getSupabaseServerClient();
    const { data, error } = await supabase
      .from('blueprint_generator')
      .select('status, blueprint_json, updated_at')
      .eq('id', id)
      .eq('user_id', session.user.id)
      .single();

    if (error || !data) {
      return NextResponse.json({ status: 'error' }, { status: 404 });
    }

    // Extract metadata from blueprint_json if available
    let model: string | undefined;
    let duration: number | undefined;

    if (data.blueprint_json && typeof data.blueprint_json === 'object') {
      const metadata = (data.blueprint_json as any)._generation_metadata;
      if (metadata) {
        model = metadata.model;
        duration = metadata.duration;
      }
    }

    return NextResponse.json({
      status: data.status as any,
      model,
      duration,
      timestamp: data.updated_at,
    });
  } catch (error) {
    return NextResponse.json({ status: 'error' }, { status: 500 });
  }
}
