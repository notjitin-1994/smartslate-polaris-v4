/**
 * Notification Preferences API Route
 * Handles user notification preference retrieval and updates
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Validation schema for notification preferences
const NotificationPreferencesSchema = z.object({
  email_blueprint_updates: z.boolean().optional(),
  email_security_alerts: z.boolean().optional(),
  email_account_activity: z.boolean().optional(),
  email_marketing: z.boolean().optional(),
  email_product_updates: z.boolean().optional(),
  email_tips_tutorials: z.boolean().optional(),
  push_blueprint_updates: z.boolean().optional(),
  push_security_alerts: z.boolean().optional(),
  push_account_activity: z.boolean().optional(),
  in_app_blueprint_updates: z.boolean().optional(),
  in_app_security_alerts: z.boolean().optional(),
  in_app_account_activity: z.boolean().optional(),
  in_app_system_notifications: z.boolean().optional(),
  notification_frequency: z.enum(['realtime', 'daily', 'weekly', 'never']).optional(),
  quiet_hours: z
    .object({
      enabled: z.boolean(),
      start_time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/), // HH:MM format
      end_time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
      timezone: z.string(),
    })
    .optional(),
});

/**
 * GET /api/notifications/preferences
 * Retrieve notification preferences for the current user
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

    // Get notification preferences
    const { data: preferences, error: prefError } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (prefError && prefError.code !== 'PGRST116') {
      // PGRST116 = no rows returned, which is OK
      console.error('Failed to fetch notification preferences:', prefError);
      return NextResponse.json(
        { error: 'Failed to fetch preferences', code: 'FETCH_FAILED' },
        { status: 500 }
      );
    }

    // If no preferences exist, return defaults
    if (!preferences) {
      return NextResponse.json({
        preferences: {
          email_blueprint_updates: true,
          email_security_alerts: true,
          email_account_activity: true,
          email_marketing: false,
          email_product_updates: true,
          email_tips_tutorials: false,
          push_blueprint_updates: true,
          push_security_alerts: true,
          push_account_activity: false,
          in_app_blueprint_updates: true,
          in_app_security_alerts: true,
          in_app_account_activity: true,
          in_app_system_notifications: true,
          notification_frequency: 'realtime',
          quiet_hours: {
            enabled: false,
            start_time: '22:00',
            end_time: '08:00',
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          },
        },
      });
    }

    return NextResponse.json({
      preferences,
    });
  } catch (error) {
    console.error('Notification preferences GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/notifications/preferences
 * Update notification preferences (partial update)
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
    const validationResult = NotificationPreferencesSchema.safeParse(body);
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

    // Check if preferences exist
    const { data: existing } = await supabase
      .from('notification_preferences')
      .select('user_id')
      .eq('user_id', user.id)
      .single();

    let updatedPreferences;

    if (existing) {
      // Update existing preferences
      const { data, error: updateError } = await supabase
        .from('notification_preferences')
        .update({
          ...validationResult.data,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
        .select()
        .single();

      if (updateError) {
        console.error('Failed to update notification preferences:', updateError);
        return NextResponse.json(
          { error: 'Failed to update preferences', code: 'UPDATE_FAILED' },
          { status: 500 }
        );
      }

      updatedPreferences = data;
    } else {
      // Create new preferences
      const { data, error: insertError } = await supabase
        .from('notification_preferences')
        .insert({
          user_id: user.id,
          ...validationResult.data,
        })
        .select()
        .single();

      if (insertError) {
        console.error('Failed to create notification preferences:', insertError);
        return NextResponse.json(
          { error: 'Failed to create preferences', code: 'CREATE_FAILED' },
          { status: 500 }
        );
      }

      updatedPreferences = data;
    }

    return NextResponse.json({
      success: true,
      preferences: updatedPreferences,
    });
  } catch (error) {
    console.error('Notification preferences PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/notifications/preferences
 * Reset notification preferences to defaults
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

    // Delete preferences (will use defaults on next GET)
    const { error: deleteError } = await supabase
      .from('notification_preferences')
      .delete()
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('Failed to reset notification preferences:', deleteError);
      return NextResponse.json(
        { error: 'Failed to reset preferences', code: 'RESET_FAILED' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Notification preferences reset to defaults',
    });
  } catch (error) {
    console.error('Notification preferences DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
