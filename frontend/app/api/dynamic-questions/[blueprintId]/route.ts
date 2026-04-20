/**
 * Dynamic Questions API Endpoint
 * GET /api/dynamic-questions/:blueprintId
 * Fetches generated dynamic questions and existing answers for a blueprint
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createServiceLogger } from '@/lib/logging';

const logger = createServiceLogger('api');
const dbLogger = createServiceLogger('database');

export const dynamic = 'force-dynamic';

/**
 * GET /api/dynamic-questions/:blueprintId
 * Retrieve generated dynamic questions and existing answers
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ blueprintId: string }> }
): Promise<Response> {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const startTime = Date.now();

  try {
    // Authenticate user
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
      logger.warn('api.auth.failure', 'Unauthorized access attempt', {
        requestId,
        error: authError?.message,
      });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get blueprint ID from path params
    const { blueprintId } = await params;

    if (!blueprintId) {
      logger.warn('api.error', 'Blueprint ID missing from path', {
        requestId,
        userId: user.id,
      });
      return NextResponse.json({ error: 'Blueprint ID required' }, { status: 400 });
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(blueprintId)) {
      logger.warn('api.error', 'Invalid blueprint ID format', {
        requestId,
        userId: user.id,
        blueprintId,
      });
      return NextResponse.json({ error: 'Invalid blueprint ID format' }, { status: 400 });
    }

    dbLogger.info('database.query.start', 'Fetching dynamic questions', {
      blueprintId,
      userId: user.id,
      requestId,
    });

    // Fetch dynamic questions and answers with RLS enforcement
    const { data: blueprint, error: blueprintError } = await supabase
      .from('blueprint_generator')
      .select('dynamic_questions, dynamic_answers, status, dynamic_questions_raw, current_section')
      .eq('id', blueprintId)
      .eq('user_id', user.id)
      .single();

    if (blueprintError || !blueprint) {
      dbLogger.error('database.query.failure', 'Blueprint not found or access denied', {
        blueprintId,
        userId: user.id,
        error: blueprintError?.message,
        requestId,
      });
      return NextResponse.json({ error: 'Blueprint not found or access denied' }, { status: 404 });
    }

    const duration = Date.now() - startTime;

    dbLogger.info('database.query.success', 'Dynamic questions retrieved successfully', {
      blueprintId,
      userId: user.id,
      hasDynamicQuestions: !!blueprint.dynamic_questions,
      hasAnswers: !!blueprint.dynamic_answers,
      status: blueprint.status,
      requestId,
      duration,
    });

    // Extract sections from dynamic_questions
    const sections = Array.isArray(blueprint.dynamic_questions)
      ? blueprint.dynamic_questions
      : blueprint.dynamic_questions?.sections || [];

    // Calculate metadata
    const totalQuestions = sections.reduce(
      (sum: number, section: any) => sum + (section.questions?.length || 0),
      0
    );

    logger.info('api.response', 'Successfully retrieved dynamic questions', {
      blueprintId,
      userId: user.id,
      sectionCount: sections.length,
      totalQuestions,
      hasExistingAnswers:
        !!blueprint.dynamic_answers && Object.keys(blueprint.dynamic_answers).length > 0,
      currentSection: blueprint.current_section ?? 0,
      duration,
      requestId,
      statusCode: 200,
    });

    return NextResponse.json({
      success: true,
      blueprintId,
      sections,
      existingAnswers: blueprint.dynamic_answers || {},
      currentSection: blueprint.current_section ?? 0,
      metadata: {
        generatedAt: blueprint.dynamic_questions_raw?.metadata?.generatedAt || null,
        provider: blueprint.dynamic_questions_raw?.metadata?.provider || null,
        model: blueprint.dynamic_questions_raw?.metadata?.model || null,
        totalQuestions,
        sectionCount: sections.length,
      },
    });
  } catch (error) {
    const duration = Date.now() - startTime;

    logger.error('api.error', 'Unexpected error retrieving dynamic questions', {
      error: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined,
      requestId,
      duration,
    });

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
