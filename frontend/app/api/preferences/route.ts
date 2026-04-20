/**
 * User Preferences API Route
 * Handles user preference retrieval and updates
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Validation schema for user preferences
const UserPreferencesSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']).optional(),
  language: z.enum(['en', 'es', 'fr', 'de', 'ja']).optional(),
  reduced_motion: z.boolean().optional(),
  compact_mode: z.boolean().optional(),
  auto_save: z.boolean().optional(),
  default_blueprint_visibility: z.enum(['private', 'public', 'unlisted']).optional(),
  show_welcome_guide: z.boolean().optional(),
  enable_keyboard_shortcuts: z.boolean().optional(),
  enable_tooltips: z.boolean().optional(),
  sidebar_collapsed: z.boolean().optional(),
});

/**
 * GET /api/preferences
 * Retrieve user preferences
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user profile with preferences
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('preferences')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Failed to fetch preferences:', profileError);
      return NextResponse.json(
        { error: 'Failed to fetch preferences', code: 'FETCH_FAILED' },
        { status: 500 }
      );
    }

    // Return preferences (empty object if none set)
    return NextResponse.json({
      preferences: profile?.preferences || {},
    });
  } catch (error) {
    console.error('Preferences GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/preferences
 * Update user preferences (partial update)
 */
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();

    // Validate preferences
    const validationResult = UserPreferencesSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid preferences data',
          code: 'VALIDATION_ERROR',
          details: validationResult.error.format(),
        },
        { status: 400 }
      );
    }

    // Get current preferences
    const { data: currentProfile } = await supabase
      .from('user_profiles')
      .select('preferences')
      .eq('id', user.id)
      .single();

    // Merge with existing preferences
    const updatedPreferences = {
      ...(currentProfile?.preferences || {}),
      ...validationResult.data,
    };

    // Update preferences in database
    const { data: updatedProfile, error: updateError } = await supabase
      .from('user_profiles')
      .update({
        preferences: updatedPreferences,
      })
      .eq('id', user.id)
      .select('preferences')
      .single();

    if (updateError) {
      console.error('Failed to update preferences:', updateError);
      return NextResponse.json(
        { error: 'Failed to update preferences', code: 'UPDATE_FAILED' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      preferences: updatedProfile.preferences,
    });
  } catch (error) {
    console.error('Preferences PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/preferences
 * Reset preferences to defaults
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Reset preferences to empty object
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({
        preferences: {},
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Failed to reset preferences:', updateError);
      return NextResponse.json(
        { error: 'Failed to reset preferences', code: 'RESET_FAILED' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Preferences reset to defaults',
    });
  } catch (error) {
    console.error('Preferences DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
