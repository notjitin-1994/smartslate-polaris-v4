import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

/**
 * GET /api/blueprints/share/[token]
 *
 * Public endpoint to fetch a blueprint by its share token.
 * No authentication required - uses anon key with RLS policy.
 *
 * Returns only the data needed for the public analytics dashboard:
 * - blueprint_json
 * - title
 * - created_at
 *
 * Does NOT return:
 * - user_id
 * - static_answers
 * - dynamic_answers
 * - Any other sensitive data
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params;

    if (!token) {
      return NextResponse.json({ error: 'Share token is required' }, { status: 400 });
    }

    // Create Supabase client with anon key for public access
    // This uses the RLS policy "Public can view shared blueprints"
    const supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Fetch blueprint by share token
    // RLS policy will ensure only blueprints with share_token can be accessed
    const { data: blueprint, error: fetchError } = await supabase
      .from('blueprint_generator')
      .select('id, blueprint_json, blueprint_markdown, title, created_at')
      .eq('share_token', token)
      .single();

    if (fetchError || !blueprint) {
      return NextResponse.json(
        { error: 'Blueprint not found or sharing is disabled' },
        { status: 404 }
      );
    }

    // Verify blueprint has completed generation
    // We don't expose draft or errored blueprints
    // Only require blueprint_json - markdown is optional
    if (!blueprint.blueprint_json) {
      return NextResponse.json({ error: 'Blueprint is not ready for sharing' }, { status: 404 });
    }

    // Return only public-safe data
    return NextResponse.json({
      success: true,
      blueprint: {
        id: blueprint.id,
        title: blueprint.title,
        created_at: blueprint.created_at,
        blueprint_json: blueprint.blueprint_json,
        blueprint_markdown: blueprint.blueprint_markdown,
      },
    });
  } catch (error) {
    console.error('Error fetching shared blueprint:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
