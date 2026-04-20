/**
 * Dynamic Questions API Endpoint
 * Generates dynamic questions using Perplexity (primary) with OpenAI fallback
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { generateDynamicQuestionsV2 } from '@/src/lib/services/dynamicQuestionGenerationV2';
import { createServiceLogger } from '@/lib/logging';

const logger = createServiceLogger('api');

export const dynamic = 'force-dynamic';
// Allow up to ~5 minutes (300 seconds) for complex question generation
// Note: On Vercel, this requires Pro or Enterprise plan (max 300s for Pro plan)
export const maxDuration = 300;

// Request schema
const requestSchema = z.object({
  blueprintId: z.string().uuid('Invalid blueprint ID'),
  staticAnswers: z.record(z.string(), z.unknown()).optional(),
  userPrompts: z.array(z.string()).optional(),
});

/**
 * POST /api/dynamic-questions
 * Generate dynamic questions for a blueprint
 */
export async function POST(request: NextRequest): Promise<Response> {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const startTime = Date.now();

  console.log('\n========================================');
  console.log('🌐 API ENDPOINT: /api/dynamic-questions');
  console.log('========================================');
  console.log('Request ID:', requestId);
  console.log('Timestamp:', new Date().toISOString());
  console.log('Method: POST');

  logger.info('api.request', 'Received dynamic questions generation request', {
    requestId,
    method: 'POST',
    path: '/api/dynamic-questions',
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
        error: authError?.message,
      });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate request body
    const body = await request.json();
    const parseResult = requestSchema.safeParse(body);

    if (!parseResult.success) {
      logger.warn('api.error', 'Invalid request body', {
        requestId,
        userId: user.id,
        errors: parseResult.error.flatten(),
      });
      return NextResponse.json(
        { error: 'Invalid request', details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const { blueprintId, staticAnswers, userPrompts } = parseResult.data;

    // Verify blueprint ownership
    const dbLogger = createServiceLogger('database');

    dbLogger.info('database.query.start', 'Fetching blueprint for validation', {
      blueprintId,
      userId: user.id,
      requestId,
    });

    const { data: blueprint, error: blueprintError } = await supabase
      .from('blueprint_generator')
      .select('id, user_id, static_answers, status')
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

    dbLogger.info('database.query.success', 'Blueprint validated successfully', {
      blueprintId,
      userId: user.id,
      requestId,
    });

    // Use provided static answers or fetch from database
    const finalStaticAnswers = staticAnswers || blueprint.static_answers || {};

    // Validate that we have static answers
    if (Object.keys(finalStaticAnswers).length === 0) {
      logger.warn('api.error', 'No static answers available', {
        blueprintId,
        userId: user.id,
        requestId,
      });
      return NextResponse.json(
        { error: 'No static answers found. Please complete the static questionnaire first.' },
        { status: 400 }
      );
    }

    // Check if V2.0 schema (new 3-section format)
    console.log('\n🔍 Validating static answers format...');
    const isV20 =
      finalStaticAnswers.section_1_role_experience &&
      finalStaticAnswers.section_2_organization &&
      finalStaticAnswers.section_3_learning_gap &&
      typeof finalStaticAnswers.section_1_role_experience === 'object' &&
      typeof finalStaticAnswers.section_2_organization === 'object' &&
      typeof finalStaticAnswers.section_3_learning_gap === 'object';

    if (!isV20) {
      console.error('❌ Legacy format detected - V2.0 format required');
      logger.error('api.error', 'Legacy questionnaire format not supported by V2 generation', {
        blueprintId,
        userId: user.id,
        requestId,
      });
      return NextResponse.json(
        {
          error: 'Legacy questionnaire format not supported',
          details:
            'Please complete the new static questionnaire to use dynamic question generation.',
        },
        { status: 400 }
      );
    }
    console.log('✓ V2.0 format validated');

    console.log('\n📊 Static Answers Summary:');
    console.log('- Role:', finalStaticAnswers.section_1_role_experience?.current_role);
    console.log('- Organization:', finalStaticAnswers.section_2_organization?.organization_name);
    console.log('- Industry:', finalStaticAnswers.section_2_organization?.industry_sector);
    console.log('- Learners:', finalStaticAnswers.section_3_learning_gap?.total_learners_range);

    logger.info('api.generation.start', 'Starting V2.0 question generation', {
      blueprintId,
      userId: user.id,
      requestId,
    });

    // Mark as generating
    console.log('\n📝 Updating blueprint status to "generating"...');
    await supabase
      .from('blueprint_generator')
      .update({ status: 'generating' })
      .eq('id', blueprintId);
    console.log('✓ Status updated');

    console.log('\n🤖 Calling generateDynamicQuestionsV2...');
    console.log('→ Will attempt Perplexity first, then OpenAI fallback');
    console.log('→ Using personalized prompts from static answers');

    // Generate dynamic questions using V2 service (returns sections directly, not wrapped in success)
    let result;
    try {
      result = await generateDynamicQuestionsV2(blueprintId, finalStaticAnswers);
      console.log('\n✅ Generation completed successfully!');
    } catch (genError) {
      console.error(
        '\n❌ Generation failed:',
        genError instanceof Error ? genError.message : String(genError)
      );

      logger.error('api.error', 'Question generation failed', {
        blueprintId,
        userId: user.id,
        error: genError instanceof Error ? genError.message : String(genError),
        requestId,
        duration: Date.now() - startTime,
      });

      // Reset status so user can retry
      console.log('→ Resetting blueprint status to "draft" for retry...');
      await supabase.from('blueprint_generator').update({ status: 'draft' }).eq('id', blueprintId);

      console.log('========================================\n');

      return NextResponse.json(
        {
          error: 'Failed to generate questions',
          details: genError instanceof Error ? genError.message : String(genError),
        },
        { status: 500 }
      );
    }

    // Validate result structure
    const resultTyped = result as { sections: unknown[]; metadata: unknown };
    if (
      !resultTyped.sections ||
      !Array.isArray(resultTyped.sections) ||
      resultTyped.sections.length === 0
    ) {
      logger.error('api.error', 'Invalid result structure from V2 service', {
        blueprintId,
        userId: user.id,
        hasResult: !!result,
        hasSections: !!resultTyped?.sections,
        requestId,
      });

      await supabase.from('blueprint_generator').update({ status: 'draft' }).eq('id', blueprintId);

      return NextResponse.json(
        { error: 'Generated questions have invalid structure' },
        { status: 500 }
      );
    }

    // Save questions to database
    const questionCount = resultTyped.sections.reduce(
      (sum: number, s: any) => sum + s.questions.length,
      0
    );

    console.log('\n💾 Saving to database...');
    console.log('- Sections:', resultTyped.sections.length);
    console.log('- Total Questions:', questionCount);

    dbLogger.info('database.save.start', 'Saving dynamic questions to database', {
      blueprintId,
      userId: user.id,
      sectionCount: resultTyped.sections.length,
      questionCount,
      requestId,
    });

    const { error: saveError } = await supabase
      .from('blueprint_generator')
      .update({
        dynamic_questions: resultTyped.sections,
        dynamic_questions_raw: result,
        status: 'draft', // Set to draft so user can proceed to answer questions
        updated_at: new Date().toISOString(),
      })
      .eq('id', blueprintId)
      .eq('user_id', user.id);

    if (saveError) {
      console.error('❌ Database save failed:', saveError.message);
      dbLogger.error('database.save.failure', 'Failed to save dynamic questions', {
        blueprintId,
        userId: user.id,
        error: saveError.message,
        requestId,
      });
      return NextResponse.json({ error: 'Failed to save questions to database' }, { status: 500 });
    }
    console.log('✓ Saved to database successfully');

    dbLogger.info('database.save.success', 'Dynamic questions saved successfully', {
      blueprintId,
      userId: user.id,
      sectionCount: resultTyped.sections.length,
      requestId,
    });

    // ✅ INCREMENT CREATION COUNTER
    console.log('\n📊 Incrementing blueprint creation counter...');
    const { BlueprintUsageService } = await import('@/lib/services/blueprintUsageService');

    try {
      const incrementResult = await BlueprintUsageService.incrementCreationCountV2(
        supabase,
        user.id
      );

      if (!incrementResult.success) {
        console.error('[USAGE_LIMIT] Failed to increment creation counter', {
          userId: user.id,
          blueprintId,
          reason: incrementResult.reason,
          newCount: incrementResult.newCount,
        });
        dbLogger.warn('usage.counter.denied', 'Blueprint creation counter increment denied', {
          userId: user.id,
          blueprintId,
          reason: incrementResult.reason,
          requestId,
        });
        // Log but don't fail the request - questions already saved
      } else {
        console.log('✓ Creation counter incremented successfully');
        console.log('  New count:', incrementResult.newCount);
        dbLogger.info('usage.counter.success', 'Blueprint creation counter incremented', {
          userId: user.id,
          blueprintId,
          newCount: incrementResult.newCount,
          requestId,
        });
      }
    } catch (error) {
      console.error('[USAGE_LIMIT] Exception incrementing counter:', {
        error: error instanceof Error ? error.message : String(error),
      });
      dbLogger.error('usage.counter.error', 'Exception while incrementing creation counter', {
        userId: user.id,
        blueprintId,
        error: error instanceof Error ? error.message : String(error),
        requestId,
      });
      // Log but don't fail - questions already saved
    }

    const duration = Date.now() - startTime;

    console.log('\n✨ COMPLETE - Dynamic questions ready!');
    console.log('Duration:', duration + 'ms');
    console.log('Blueprint Status: draft (ready for user to answer)');
    console.log('========================================\n');

    logger.info('api.response', 'Successfully generated and saved dynamic questions', {
      blueprintId,
      userId: user.id,
      sectionCount: resultTyped.sections.length,
      questionCount,
      duration,
      requestId,
      statusCode: 200,
    });

    return NextResponse.json({
      success: true,
      sections: resultTyped.sections,
      metadata: {
        generatedAt: new Date().toISOString(),
        sectionCount: resultTyped.sections.length,
        questionCount,
        duration,
      },
    });
  } catch (error) {
    const duration = Date.now() - startTime;

    logger.error('api.error', 'Unexpected error in dynamic questions API', {
      error: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined,
      requestId,
      duration,
    });

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * GET /api/dynamic-questions/:blueprintId
 * Retrieve generated dynamic questions
 */
export async function GET(request: NextRequest): Promise<Response> {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get blueprint ID from URL
    const { searchParams } = new URL(request.url);
    const blueprintId = searchParams.get('blueprintId');

    if (!blueprintId) {
      return NextResponse.json({ error: 'Blueprint ID required' }, { status: 400 });
    }

    // Fetch dynamic questions
    const { data: blueprint, error: blueprintError } = await supabase
      .from('blueprint_generator')
      .select('dynamic_questions, dynamic_answers, status')
      .eq('id', blueprintId)
      .eq('user_id', user.id)
      .single();

    if (blueprintError || !blueprint) {
      return NextResponse.json({ error: 'Blueprint not found' }, { status: 404 });
    }

    return NextResponse.json({
      questions: blueprint.dynamic_questions || [],
      answers: blueprint.dynamic_answers || {},
      status: blueprint.status,
    });
  } catch (error) {
    logger.error('api.error', 'Error retrieving dynamic questions', {
      error: error instanceof Error ? error.message : String(error),
      requestId,
    });

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
