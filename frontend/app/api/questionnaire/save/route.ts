/**
 * Questionnaire Save API Endpoint
 * Saves questionnaire data to blueprint_generator table in realtime
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerSession } from '@/lib/supabase/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { createServiceLogger } from '@/lib/logging';
import { BlueprintUsageService } from '@/lib/services/blueprintUsageService';

// Add basic health check endpoint for testing
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Questionnaire save API is running',
    timestamp: new Date().toISOString(),
  });
}

const logger = createServiceLogger('api');

// Define the schema outside the function to avoid any potential issues
const SaveQuestionnaireSchema = z.object({
  staticAnswers: z.record(z.any()),
  blueprintId: z.string().uuid().optional(),
});

/**
 * POST /api/questionnaire/save
 * Save questionnaire data to blueprint_generator table
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // Authenticate user
    const { session } = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Parse request body
    const body = await req.json();

    if (!body || !body.staticAnswers) {
      return NextResponse.json(
        { success: false, error: 'staticAnswers is required' },
        { status: 400 }
      );
    }

    const { staticAnswers, blueprintId: providedBlueprintId } = body;

    const supabase = await getSupabaseServerClient();
    let blueprintId = providedBlueprintId;

    logger.info('questionnaire.save.start', 'Processing save request', {
      userId,
      providedBlueprintId: providedBlueprintId || 'none',
      hasStaticAnswers: !!staticAnswers,
      staticAnswersSize: JSON.stringify(staticAnswers).length,
    });

    if (!blueprintId) {
      // Check blueprint creation limits before creating a new blueprint
      try {
        const canCreate = await BlueprintUsageService.canCreateBlueprint(supabase, userId);

        if (!canCreate.canCreate) {
          logger.warn('questionnaire.save.limit_exceeded', 'Blueprint creation limit exceeded', {
            userId,
            reason: canCreate.reason,
          });

          return NextResponse.json(
            {
              success: false,
              error: canCreate.reason || 'You cannot create more blueprints at this time.',
              limitExceeded: true,
            },
            { status: 429 }
          );
        }
      } catch (error) {
        logger.error(
          'questionnaire.save.limit_check_error',
          'Error checking blueprint creation limits',
          {
            userId,
            error: (error as Error).message,
          }
        );
        // Continue with creation if we can't check limits (fallback behavior)
      }

      // Create new blueprint record
      logger.info('questionnaire.save.creating', 'Creating new blueprint (no ID provided)', {
        userId,
      });

      const { data: newBlueprint, error: createError } = await supabase
        .from('blueprint_generator')
        .insert({
          user_id: userId,
          static_answers: staticAnswers,
          status: 'draft',
        })
        .select('id')
        .single();

      if (createError || !newBlueprint) {
        logger.error('questionnaire.save.create_failed', 'Failed to create new blueprint', {
          userId,
          error: createError?.message,
        });
        return NextResponse.json(
          { success: false, error: 'Failed to create questionnaire record' },
          { status: 500 }
        );
      }

      blueprintId = newBlueprint.id;
      logger.info('questionnaire.save.created', 'Successfully created new blueprint', {
        userId,
        blueprintId,
      });
    } else {
      // Update existing blueprint record
      logger.info('questionnaire.save.updating', 'Attempting to update existing blueprint', {
        userId,
        blueprintId,
      });

      const { error: updateError, count } = await supabase
        .from('blueprint_generator')
        .update({
          static_answers: staticAnswers,
          updated_at: new Date().toISOString(),
        })
        .eq('id', blueprintId)
        .eq('user_id', userId)
        .select('*', { count: 'exact', head: true });

      if (updateError) {
        logger.error('questionnaire.save.update_error', 'Database error during update', {
          userId,
          blueprintId,
          error: updateError.message,
        });
        return NextResponse.json(
          { success: false, error: 'Failed to update questionnaire record' },
          { status: 500 }
        );
      }

      logger.info('questionnaire.save.update_result', 'Update query completed', {
        userId,
        blueprintId,
        rowsAffected: count,
      });

      // If no rows were affected, the blueprint doesn't exist - create a new one instead
      if (count === 0) {
        logger.warn(
          'questionnaire.save.blueprint_not_found',
          'Blueprint not found or access denied, creating new one',
          {
            providedBlueprintId: blueprintId,
            userId,
          }
        );

        // Check blueprint creation limits before creating a new blueprint
        try {
          const canCreate = await BlueprintUsageService.canCreateBlueprint(supabase, userId);

          if (!canCreate.canCreate) {
            logger.warn(
              'questionnaire.save.fallback_limit_exceeded',
              'Blueprint creation limit exceeded during fallback',
              {
                userId,
                originalBlueprintId: blueprintId,
                reason: canCreate.reason,
              }
            );

            return NextResponse.json(
              {
                success: false,
                error: canCreate.reason || 'You cannot create more blueprints at this time.',
                limitExceeded: true,
              },
              { status: 429 }
            );
          }
        } catch (error) {
          logger.error(
            'questionnaire.save.fallback_limit_check_error',
            'Error checking blueprint creation limits during fallback',
            {
              userId,
              originalBlueprintId: blueprintId,
              error: (error as Error).message,
            }
          );
          // Continue with creation if we can't check limits (fallback behavior)
        }

        const { data: newBlueprint, error: createError } = await supabase
          .from('blueprint_generator')
          .insert({
            user_id: userId,
            static_answers: staticAnswers,
            status: 'draft',
          })
          .select('id')
          .single();

        if (createError || !newBlueprint) {
          logger.error(
            'questionnaire.save.fallback_create_failed',
            'Failed to create blueprint after not found',
            {
              userId,
              originalBlueprintId: blueprintId,
              error: createError?.message,
            }
          );
          return NextResponse.json(
            {
              success: false,
              error: 'Failed to create questionnaire record after blueprint not found',
            },
            { status: 500 }
          );
        }

        blueprintId = newBlueprint.id;
        logger.info(
          'questionnaire.save.fallback_created',
          'Created new blueprint after not found',
          {
            userId,
            oldBlueprintId: providedBlueprintId,
            newBlueprintId: blueprintId,
          }
        );
      } else {
        logger.info('questionnaire.save.updated', 'Successfully updated existing blueprint', {
          userId,
          blueprintId,
        });
      }
    }

    const wasUpdate = blueprintId === providedBlueprintId;
    const message = wasUpdate ? 'Questionnaire updated' : 'Questionnaire saved';

    logger.info('questionnaire.save.success', message, {
      blueprintId,
      wasUpdate,
      providedBlueprintId,
    });

    return NextResponse.json({
      success: true,
      blueprintId,
      message,
    });
  } catch (error) {
    logger.error('questionnaire.save.unexpected_error', 'Unexpected error during save', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
