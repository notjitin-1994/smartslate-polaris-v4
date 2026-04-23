/**
 * Blueprint Section Update API Endpoint
 * Handles updating individual sections of a blueprint's JSON data
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/supabase/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { createServiceLogger } from '@/lib/logging';

const logger = createServiceLogger('api');

export const dynamic = 'force-dynamic';

/**
 * PATCH /api/starmaps/update-section
 * Update a specific section of a blueprint
 */
export async function PATCH(req: NextRequest): Promise<NextResponse> {
  try {
    console.log('[PATCH /api/starmaps/update-section] Request received');

    // Authenticate user
    const { session } = await getServerSession();
    if (!session?.user?.id) {
      console.error('[PATCH /api/starmaps/update-section] Unauthorized - no session');
      logger.warn('blueprints.update_section.unauthorized', 'Unauthorized update attempt', {
        timestamp: new Date().toISOString(),
      });

      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Parse request body
    const body = await req.json();
    const { blueprintId, sectionId, data: sectionData } = body;

    // Validate required fields
    if (!blueprintId || !sectionId || sectionData === undefined) {
      logger.warn('blueprints.update_section.invalid_request', 'Missing required fields', {
        userId,
        blueprintId,
        sectionId,
        hasSectionData: sectionData !== undefined,
      });

      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: blueprintId, sectionId, and data are required',
        },
        { status: 400 }
      );
    }

    console.log('[PATCH /api/starmaps/update-section] Request params:', {
      userId,
      blueprintId,
      sectionId,
    });

    logger.info('blueprints.update_section.request', 'Section update request received', {
      userId,
      blueprintId,
      sectionId,
    });

    const supabase = await getSupabaseServerClient();

    // First, verify the blueprint exists and belongs to the user
    const { data: blueprint, error: fetchError } = await supabase
      .from('blueprint_generator')
      .select('id, user_id, blueprint_json, status')
      .eq('id', blueprintId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !blueprint) {
      logger.warn('blueprints.update_section.not_found', 'Blueprint not found or unauthorized', {
        userId,
        blueprintId,
        error: fetchError?.message,
      });

      return NextResponse.json(
        {
          success: false,
          error: 'Blueprint not found or you do not have permission to edit it',
        },
        { status: 404 }
      );
    }

    // Validate section data is not null/undefined
    if (sectionData === null || sectionData === undefined) {
      logger.warn('blueprints.update_section.invalid_data', 'Section data is null or undefined', {
        userId,
        blueprintId,
        sectionId,
      });

      return NextResponse.json(
        {
          success: false,
          error: 'Section data cannot be null or undefined',
        },
        { status: 400 }
      );
    }

    // Create deep clone of current blueprint to avoid mutation
    const currentBlueprintJson = JSON.parse(JSON.stringify(blueprint.blueprint_json)) as Record<
      string,
      unknown
    >;

    // Backup current section data before overwriting
    const backupSectionData = currentBlueprintJson[sectionId];

    // Update the specific section in the blueprint_json
    const updatedBlueprintJson = {
      ...currentBlueprintJson,
      [sectionId]: sectionData,
    };

    // Validate the updated blueprint structure
    if (!updatedBlueprintJson || typeof updatedBlueprintJson !== 'object') {
      logger.error('blueprints.update_section.invalid_structure', 'Invalid blueprint structure', {
        userId,
        blueprintId,
        sectionId,
      });

      return NextResponse.json(
        {
          success: false,
          error: 'Invalid blueprint structure after update',
        },
        { status: 400 }
      );
    }

    // Update the blueprint with the new section data
    // IMPORTANT: Preserve the existing status to avoid resetting completed blueprints to draft
    // NOTE: Version increment happens automatically via database trigger (trg_blueprint_version_on_blueprint_edit)
    // The trigger increments version when blueprint_json changes on a completed blueprint
    const { data: updateResult, error: updateError } = await supabase
      .from('blueprint_generator')
      .update({
        blueprint_json: updatedBlueprintJson,
        updated_at: new Date().toISOString(),
        // Preserve existing status - don't reset completed blueprints to draft
        status: blueprint.status,
      })
      .eq('id', blueprintId)
      .eq('user_id', userId)
      .select('blueprint_json')
      .single();

    if (updateError) {
      console.error('[PATCH /api/starmaps/update-section] Update error:', updateError);
      logger.error('blueprints.update_section.update_error', 'Database update error', {
        userId,
        blueprintId,
        sectionId,
        error: updateError.message,
        errorCode: updateError.code,
      });

      return NextResponse.json(
        {
          success: false,
          error: `Failed to update blueprint section: ${updateError.message}`,
        },
        { status: 500 }
      );
    }

    // Verify the update was successful by checking the returned data
    if (!updateResult || !updateResult.blueprint_json) {
      logger.error('blueprints.update_section.verification_failed', 'Update verification failed', {
        userId,
        blueprintId,
        sectionId,
      });

      return NextResponse.json(
        {
          success: false,
          error: 'Failed to verify blueprint update',
        },
        { status: 500 }
      );
    }

    // Verify the section was actually updated
    const verifiedBlueprint = updateResult.blueprint_json as Record<string, unknown>;
    if (!verifiedBlueprint[sectionId]) {
      logger.error('blueprints.update_section.data_loss', 'Section data lost after update', {
        userId,
        blueprintId,
        sectionId,
      });

      // Attempt to rollback
      await supabase
        .from('blueprint_generator')
        .update({
          blueprint_json: {
            ...currentBlueprintJson,
            [sectionId]: backupSectionData,
          },
          updated_at: new Date().toISOString(),
        })
        .eq('id', blueprintId)
        .eq('user_id', userId);

      return NextResponse.json(
        {
          success: false,
          error: 'Section data was lost during update. Changes have been rolled back.',
        },
        { status: 500 }
      );
    }

    logger.info('blueprints.update_section.success', 'Section updated successfully', {
      userId,
      blueprintId,
      sectionId,
    });

    return NextResponse.json({
      success: true,
      message: 'Section updated successfully',
      blueprintId,
      sectionId,
    });
  } catch (error) {
    console.error('[PATCH /api/starmaps/update-section] Unexpected error:', error);
    logger.error('blueprints.update_section.unexpected_error', 'Unexpected error during update', {
      error: (error as Error).message,
    });

    return NextResponse.json(
      {
        success: false,
        error: 'An unexpected error occurred while updating the blueprint section',
      },
      { status: 500 }
    );
  }
}
