import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClientWithLogging, getServerSession } from '@/lib/supabase/server';
import { generateDynamicQuestionsV2 } from '@/src/lib/services/dynamicQuestionGenerationV2';
import { z } from 'zod';
import { getClientForUser } from '@/lib/auth/adminUtils';

export const dynamic = 'force-dynamic';
// Allow up to ~13.3 minutes (800 seconds) for complex question generation
// Note: On Vercel, this requires Pro or Enterprise plan (max 800s for Pro plan)
export const maxDuration = 800;

// Schema for the request body
const generateDynamicQuestionsSchema = z.object({
  blueprintId: z.string().uuid(),
});

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const body = await request.json();
    const { blueprintId } = generateDynamicQuestionsSchema.parse(body);

    // Authenticate user
    const { session } = await getServerSession();
    if (!session?.user?.id) {
      console.error('[GenerateDynamicQuestions] Unauthorized request');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Get appropriate Supabase client with logging based on user's admin status
    const authenticatedClient = await getSupabaseServerClientWithLogging();
    const { client: supabase, isAdmin } = await getClientForUser(authenticatedClient, userId);

    console.log('[GenerateDynamicQuestions] Client selected:', { userId, isAdmin });

    // Get the blueprint with static answers
    // Admins can access any blueprint, regular users only their own
    const blueprintQuery = supabase
      .from('blueprint_generator')
      .select('id, static_answers, dynamic_questions, dynamic_questions_metadata, user_id, status')
      .eq('id', blueprintId);

    if (!isAdmin) {
      blueprintQuery.eq('user_id', userId);
    }

    const { data: blueprint, error: blueprintError } = await blueprintQuery.single();

    if (blueprintError || !blueprint) {
      console.error('[GenerateDynamicQuestions] Blueprint not found:', blueprintError);
      return NextResponse.json({ error: 'Blueprint not found' }, { status: 404 });
    }

    // Check if static_answers exists and has data
    if (!blueprint.static_answers || typeof blueprint.static_answers !== 'object') {
      console.error('[GenerateDynamicQuestions] No static answers found in blueprint:', {
        blueprintId,
        static_answers: blueprint.static_answers,
      });
      return NextResponse.json(
        {
          error: 'No static answers found. Please complete the static questionnaire first.',
          details: 'The blueprint exists but has no static answers data.',
        },
        { status: 400 }
      );
    }

    // Check if static_answers is empty object
    const staticAnswersKeys = Object.keys(blueprint.static_answers);
    if (staticAnswersKeys.length === 0) {
      console.error('[GenerateDynamicQuestions] Static answers is empty object');
      return NextResponse.json(
        {
          error: 'Static answers are empty. Please fill out the questionnaire first.',
          details: 'The static_answers object exists but has no fields.',
        },
        { status: 400 }
      );
    }

    console.log('[GenerateDynamicQuestions] Blueprint loaded:', {
      id: blueprint.id,
      status: blueprint.status,
      static_answers_keys: staticAnswersKeys,
    });

    // If already generating or questions exist, short-circuit
    if (blueprint.status === 'generating') {
      return NextResponse.json({ success: true, message: 'Already generating' });
    }

    // Check if dynamic questions already exist
    if (
      blueprint.dynamic_questions &&
      Array.isArray(blueprint.dynamic_questions) &&
      blueprint.dynamic_questions.length > 0
    ) {
      return NextResponse.json({
        success: true,
        dynamicQuestions: blueprint.dynamic_questions,
        message: 'Dynamic questions already exist',
      });
    }

    // Extract static answers - only support V2.0 format (3-section structure)
    const sa = (blueprint.static_answers || {}) as Record<string, unknown>;

    console.log('[GenerateDynamicQuestions] Static answers:', JSON.stringify(sa, null, 2));

    // Validate V2.0 schema (new 3-section format from PRD)
    const isV20 =
      sa.section_1_role_experience &&
      sa.section_2_organization &&
      sa.section_3_learning_gap &&
      typeof sa.section_1_role_experience === 'object' &&
      typeof sa.section_2_organization === 'object' &&
      typeof sa.section_3_learning_gap === 'object';

    if (!isV20) {
      console.error('[GenerateDynamicQuestions] Invalid static answers format - V2.0 required');
      return NextResponse.json(
        {
          error:
            'Invalid static answers format. Please complete the static questionnaire using the V2.0 format.',
          details:
            'Expected 3-section structure: section_1_role_experience, section_2_organization, section_3_learning_gap',
          receivedFormat: Object.keys(sa),
        },
        { status: 400 }
      );
    }

    // Use V2.0 generation service with V3 template-based prompts (no personalization)
    console.log('[GenerateDynamicQuestions] Using V2.0 schema with V3 template-based prompts');

    // Track retry attempts in metadata
    const retryAttempt = (blueprint.dynamic_questions_metadata?.retryAttempt as number) || 0;
    const maxRetries = 3;

    if (retryAttempt >= maxRetries) {
      console.error('[GenerateDynamicQuestions] Max retry attempts reached:', {
        blueprintId,
        attempts: retryAttempt,
      });
      return NextResponse.json(
        {
          error: `Maximum retry attempts (${maxRetries}) reached. Please contact support if the issue persists.`,
          details: 'The system has attempted to generate questions multiple times without success.',
          canRetry: false,
        },
        { status: 429 } // Too Many Requests
      );
    }

    console.log('[GenerateDynamicQuestions] Attempt:', retryAttempt + 1, 'of', maxRetries);

    try {
      const result = await generateDynamicQuestionsV2(blueprintId, sa, userId, supabase);

      // Industry standard: Store AI output WITHOUT transformation
      // No normalization - preserve exact AI-generated structure
      const resultTyped = result as { sections: unknown[]; metadata: unknown };
      const aiGeneratedSections = resultTyped.sections || [];

      console.log('[GenerateDynamicQuestions V2.0] Storing raw AI output:', {
        sectionsCount: aiGeneratedSections.length,
        sampleQuestion: aiGeneratedSections[0]?.questions?.[0],
      });

      // Update the blueprint with generated dynamic questions - NO TRANSFORMATION
      const updateQuery = supabase
        .from('blueprint_generator')
        .update({
          dynamic_questions: aiGeneratedSections, // Store EXACTLY what AI generated
          dynamic_questions_raw: aiGeneratedSections, // Same as above - no transformation
          status: 'draft',
          dynamic_questions_metadata: {
            retryAttempt: 0, // Reset on success
            lastGeneratedAt: new Date().toISOString(),
            sectionsGenerated: aiGeneratedSections.length,
            truncationRepaired: (resultTyped.metadata as any)?.truncationRepaired || false,
            preservedOriginal: true, // Flag to indicate no transformation applied
          },
        })
        .eq('id', blueprintId);

      if (!isAdmin) {
        updateQuery.eq('user_id', userId);
      }

      const { error: updateError } = await updateQuery.select().single();

      if (updateError) {
        console.error('Error updating blueprint with dynamic questions:', updateError);
        return NextResponse.json({ error: 'Failed to save dynamic questions' }, { status: 500 });
      }

      // ✅ Increment ONLY creation count when dynamic questions are generated
      // Saving count will be incremented when final blueprint is generated
      console.log(
        '[BLUEPRINT_COUNTING] Incrementing creation count for dynamic questions generation'
      );

      // Import the usage service
      const { BlueprintUsageService } = await import('@/lib/services/blueprintUsageService');

      // Check if user can create before incrementing
      const canCreate = await BlueprintUsageService.canCreateBlueprint(supabase, blueprint.user_id);

      if (!canCreate.canCreate && !isAdmin) {
        // Admins can bypass limits
        console.error('[USAGE_LIMIT] Blueprint creation limit exceeded', {
          userId: blueprint.user_id,
          reason: canCreate.reason,
        });

        // Roll back the blueprint update (fail-closed approach)
        const rollbackQuery = supabase
          .from('blueprint_generator')
          .update({
            dynamic_questions: null,
            dynamic_questions_raw: null,
            status: 'draft',
            dynamic_questions_metadata: {
              rollback: true,
              rollback_reason: 'Usage limit exceeded',
              rollback_at: new Date().toISOString(),
            },
          })
          .eq('id', blueprintId);

        if (!isAdmin) {
          rollbackQuery.eq('user_id', userId);
        }

        await rollbackQuery;

        return NextResponse.json(
          {
            error: 'Blueprint creation limit exceeded',
            details: canCreate.reason,
            upgradeUrl: '/pricing',
          },
          { status: 429 }
        );
      }

      // NOTE: Counter increment REMOVED to prevent double-counting
      // This endpoint (/api/generate-dynamic-questions) is a legacy endpoint.
      // The main user flow uses /api/dynamic-questions which handles counter increment.
      // Having both endpoints increment the counter causes double-counting issues.
      // Counter increment is now ONLY done in /api/dynamic-questions

      console.log(
        '[BLUEPRINT_COUNTING] Skipping counter increment (handled by /api/dynamic-questions)',
        {
          blueprintId,
          userId: blueprint.user_id,
          reason: 'Legacy endpoint - counter increment handled elsewhere',
        }
      );

      return NextResponse.json({
        success: true,
        dynamicQuestions: aiGeneratedSections,
        message:
          'Dynamic questions generated successfully (V3.0 template-based) - preserved original AI output',
        metadata: {
          ...(typeof resultTyped.metadata === 'object' && resultTyped.metadata !== null
            ? resultTyped.metadata
            : {}),
          preservedOriginal: true,
          templateBased: true,
          version: 'v3.0',
        },
      });
    } catch (error) {
      console.error('Error generating dynamic questions with V2.0 service:', error);

      // Increment retry counter and reset status so the user can retry generation
      const resetQuery = supabase
        .from('blueprint_generator')
        .update({
          status: 'draft',
          dynamic_questions: null, // Clear incomplete questions
          dynamic_questions_raw: null, // Clear raw incomplete data
          dynamic_questions_metadata: {
            retryAttempt: retryAttempt + 1,
            lastAttemptAt: new Date().toISOString(),
            lastError: error instanceof Error ? error.message : String(error),
          },
        })
        .eq('id', blueprintId);

      if (!isAdmin) {
        resetQuery.eq('user_id', userId);
      }

      const { error: resetError } = await resetQuery;

      if (resetError) {
        console.error('Error resetting blueprint status:', resetError);
      }

      return NextResponse.json(
        {
          error: 'Failed to generate dynamic questions. Please try again.',
          details: error instanceof Error ? error.message : String(error),
          canRetry: retryAttempt + 1 < maxRetries,
          attemptsRemaining: maxRetries - (retryAttempt + 1),
        },
        { status: 502 }
      );
    }
  } catch (error) {
    console.error('Error generating dynamic questions:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.flatten() },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
