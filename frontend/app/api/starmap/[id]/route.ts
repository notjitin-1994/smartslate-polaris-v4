import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Fetch the blueprint with the specified ID
    const { data: blueprint, error: blueprintError } = await supabase
      .from('blueprint_generator')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (blueprintError) {
      console.error('Error fetching blueprint:', blueprintError);
      return NextResponse.json({ error: 'Blueprint not found or access denied' }, { status: 404 });
    }

    return NextResponse.json({
      id: blueprint.id,
      static_answers: blueprint.static_answers,
      dynamic_questions: blueprint.dynamic_questions || [],
      dynamic_answers: blueprint.dynamic_answers || {},
      status: blueprint.status,
      version: blueprint.version,
      questionnaire_version: blueprint.questionnaire_version || 1,
      completed_steps: blueprint.completed_steps || [],
      created_at: blueprint.created_at,
      updated_at: blueprint.updated_at,
    });
  } catch (error) {
    console.error('Error in blueprint API route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
