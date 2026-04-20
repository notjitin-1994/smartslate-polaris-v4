/**
 * Dynamic Answers Save API Endpoint
 * POST /api/dynamic-answers/save
 * Auto-save endpoint for partial/incremental progress
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createServiceLogger } from '@/lib/logging';

const logger = createServiceLogger('api');
const dbLogger = createServiceLogger('database');

export const dynamic = 'force-dynamic';

// Request schema for auto-save (partial answers allowed)
const saveRequestSchema = z.object({
  blueprintId: z.string().uuid('Invalid blueprint ID'),
  answers: z.record(z.string(), z.unknown()),
  sectionId: z.string().optional(), // Track which section is being saved
  currentSection: z.number().int().min(0).optional(), // Track section index for resume
});

/**
 * POST /api/dynamic-answers/save
 * Auto-save partial answers (debounced from client)
 */
export async function POST(request: NextRequest): Promise<Response> {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const startTime = Date.now();

  logger.info('api.request', 'Received dynamic answers auto-save request', {
    requestId,
    method: 'POST',
    path: '/api/dynamic-answers/save',
  });

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
      logger.warn('api.auth.failure', 'Unauthorized auto-save attempt', {
        requestId,
        error: authError?.message,
      });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate request
    const body = await request.json();
    const parseResult = saveRequestSchema.safeParse(body);

    if (!parseResult.success) {
      logger.warn('api.error', 'Invalid auto-save request body', {
        requestId,
        userId: user.id,
        errors: parseResult.error.flatten(),
      });
      return NextResponse.json(
        { error: 'Invalid request', details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const { blueprintId, answers, sectionId, currentSection } = parseResult.data;

    // Verify blueprint ownership and fetch existing answers
    dbLogger.info('database.query.start', 'Fetching blueprint for auto-save', {
      blueprintId,
      userId: user.id,
      requestId,
    });

    const { data: blueprint, error: blueprintError } = await supabase
      .from('blueprint_generator')
      .select('id, user_id, dynamic_answers, status')
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

    // Merge new answers with existing answers
    const existingAnswers = blueprint.dynamic_answers || {};
    const mergedAnswers = {
      ...existingAnswers,
      ...answers,
    };

    // Save merged answers
    dbLogger.info('database.save.start', 'Auto-saving dynamic answers', {
      blueprintId,
      userId: user.id,
      newAnswerCount: Object.keys(answers).length,
      totalAnswerCount: Object.keys(mergedAnswers).length,
      sectionId,
      requestId,
    });

    const updateData: any = {
      dynamic_answers: mergedAnswers,
      status: 'draft', // Keep status as draft while user is answering
      updated_at: new Date().toISOString(),
    };

    // Save current section if provided
    if (currentSection !== undefined) {
      updateData.current_section = currentSection;
    }

    const { error: saveError } = await supabase
      .from('blueprint_generator')
      .update(updateData)
      .eq('id', blueprintId)
      .eq('user_id', user.id);

    if (saveError) {
      dbLogger.error('database.save.failure', 'Failed to auto-save dynamic answers', {
        blueprintId,
        userId: user.id,
        error: saveError.message,
        requestId,
      });
      return NextResponse.json({ error: 'Failed to save answers to database' }, { status: 500 });
    }

    const duration = Date.now() - startTime;

    dbLogger.info('database.save.success', 'Dynamic answers auto-saved successfully', {
      blueprintId,
      userId: user.id,
      totalAnswerCount: Object.keys(mergedAnswers).length,
      sectionId,
      currentSection,
      status: 'draft',
      requestId,
      duration,
    });

    logger.info('api.response', 'Successfully auto-saved dynamic answers', {
      blueprintId,
      userId: user.id,
      newAnswerCount: Object.keys(answers).length,
      totalAnswerCount: Object.keys(mergedAnswers).length,
      status: 'draft',
      duration,
      requestId,
      statusCode: 200,
    });

    return NextResponse.json({
      success: true,
      saved: true,
      blueprintId,
      answerCount: Object.keys(mergedAnswers).length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const duration = Date.now() - startTime;

    logger.error('api.error', 'Unexpected error during auto-save', {
      error: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined,
      requestId,
      duration,
    });

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
