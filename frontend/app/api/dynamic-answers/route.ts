/**
 * Dynamic Answers API Endpoint
 * Saves user responses to dynamic questionnaire
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createServiceLogger } from '@/lib/logging';

const logger = createServiceLogger('api');
const dbLogger = createServiceLogger('database');

export const dynamic = 'force-dynamic';

// Request schema
const requestSchema = z.object({
  blueprintId: z.string().uuid('Invalid blueprint ID'),
  answers: z.record(z.string(), z.unknown()),
  completed: z.boolean().default(false),
});

/**
 * POST /api/dynamic-answers
 * Save user answers to dynamic questionnaire
 */
export async function POST(request: NextRequest): Promise<Response> {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const startTime = Date.now();

  logger.info('api.request', 'Received dynamic answers save request', {
    requestId,
    method: 'POST',
    path: '/api/dynamic-answers',
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
      logger.warn('api.auth.failure', 'Unauthorized access attempt', {
        requestId,
      });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate request
    const body = await request.json();
    const parseResult = requestSchema.safeParse(body);

    if (!parseResult.success) {
      logger.warn('api.error', 'Invalid request body for dynamic answers', {
        requestId,
        userId: user.id,
        errors: parseResult.error.flatten(),
      });
      return NextResponse.json(
        { error: 'Invalid request', details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const { blueprintId, answers, completed } = parseResult.data;

    // Verify blueprint ownership
    dbLogger.info('database.query.start', 'Validating blueprint ownership', {
      blueprintId,
      userId: user.id,
      requestId,
    });

    const { data: blueprint, error: blueprintError } = await supabase
      .from('blueprint_generator')
      .select('id, user_id')
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

    // Save answers
    dbLogger.info('database.save.start', 'Saving dynamic answers', {
      blueprintId,
      userId: user.id,
      answerCount: Object.keys(answers).length,
      completed,
      requestId,
    });

    const updateData: any = {
      dynamic_answers: answers,
      updated_at: new Date().toISOString(),
    };

    // Update status if questionnaire is completed
    if (completed) {
      updateData.status = 'completed';
    }

    const { error: saveError } = await supabase
      .from('blueprint_generator')
      .update(updateData)
      .eq('id', blueprintId)
      .eq('user_id', user.id);

    if (saveError) {
      dbLogger.error('database.save.failure', 'Failed to save dynamic answers', {
        blueprintId,
        userId: user.id,
        error: saveError.message,
        requestId,
      });
      return NextResponse.json({ error: 'Failed to save answers to database' }, { status: 500 });
    }

    const duration = Date.now() - startTime;

    dbLogger.info('database.save.success', 'Dynamic answers saved successfully', {
      blueprintId,
      userId: user.id,
      answerCount: Object.keys(answers).length,
      completed,
      requestId,
      duration,
    });

    logger.info('api.response', 'Successfully saved dynamic answers', {
      blueprintId,
      userId: user.id,
      answerCount: Object.keys(answers).length,
      completed,
      duration,
      requestId,
      statusCode: 200,
    });

    return NextResponse.json({
      success: true,
      saved: true,
      blueprintId,
      answerCount: Object.keys(answers).length,
    });
  } catch (error) {
    const duration = Date.now() - startTime;

    logger.error('api.error', 'Unexpected error saving dynamic answers', {
      error: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined,
      requestId,
      duration,
    });

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
