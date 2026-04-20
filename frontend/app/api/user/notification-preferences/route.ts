import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logUserUpdated } from '@/lib/utils/activityLogger';

/**
 * GET /api/user/notification-preferences
 * Fetches notification preferences for the authenticated user
 *
 * Response:
 * {
 *   email_notifications: boolean,
 *   push_notifications: boolean,
 *   blueprint_updates: boolean,
 *   activity_digest: boolean,
 *   marketing_emails: boolean,
 *   security_alerts: boolean
 * }
 */
export async function GET() {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch notification preferences
    const { data: preferences, error: preferencesError } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (preferencesError) {
      // If no preferences exist, return defaults
      if (preferencesError.code === 'PGRST116') {
        return NextResponse.json({
          email_notifications: true,
          push_notifications: false,
          blueprint_updates: true,
          activity_digest: true,
          marketing_emails: false,
          security_alerts: true,
        });
      }

      console.error('Error fetching notification preferences:', preferencesError);
      return NextResponse.json(
        {
          error: 'Failed to fetch notification preferences',
          details: preferencesError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      email_notifications: preferences.email_notifications,
      push_notifications: preferences.push_notifications,
      blueprint_updates: preferences.blueprint_updates,
      activity_digest: preferences.activity_digest,
      marketing_emails: preferences.marketing_emails,
      security_alerts: preferences.security_alerts,
    });
  } catch (error) {
    console.error('Notification preferences API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PATCH /api/user/notification-preferences
 * Updates notification preferences for the authenticated user
 *
 * Body:
 * {
 *   email_notifications?: boolean,
 *   push_notifications?: boolean,
 *   blueprint_updates?: boolean,
 *   activity_digest?: boolean,
 *   marketing_emails?: boolean,
 *   security_alerts?: boolean
 * }
 *
 * Response:
 * - 200: Preferences updated successfully
 * - 400: Invalid request body
 * - 401: Unauthorized
 * - 500: Internal server error
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const {
      email_notifications,
      push_notifications,
      blueprint_updates,
      activity_digest,
      marketing_emails,
      security_alerts,
    } = body;

    // Validate that at least one preference is being updated
    if (
      email_notifications === undefined &&
      push_notifications === undefined &&
      blueprint_updates === undefined &&
      activity_digest === undefined &&
      marketing_emails === undefined &&
      security_alerts === undefined
    ) {
      return NextResponse.json({ error: 'No preferences provided to update' }, { status: 400 });
    }

    // Build update object with only provided fields
    const updates: Record<string, boolean> = {};
    if (email_notifications !== undefined) updates.email_notifications = email_notifications;
    if (push_notifications !== undefined) updates.push_notifications = push_notifications;
    if (blueprint_updates !== undefined) updates.blueprint_updates = blueprint_updates;
    if (activity_digest !== undefined) updates.activity_digest = activity_digest;
    if (marketing_emails !== undefined) updates.marketing_emails = marketing_emails;
    if (security_alerts !== undefined) updates.security_alerts = security_alerts;

    // Check if preferences exist
    const { data: existingPreferences } = await supabase
      .from('notification_preferences')
      .select('id')
      .eq('user_id', user.id)
      .single();

    let result;

    if (existingPreferences) {
      // Update existing preferences
      result = await supabase
        .from('notification_preferences')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
        .select()
        .single();
    } else {
      // Create new preferences with defaults
      result = await supabase
        .from('notification_preferences')
        .insert({
          user_id: user.id,
          email_notifications: email_notifications ?? true,
          push_notifications: push_notifications ?? false,
          blueprint_updates: blueprint_updates ?? true,
          activity_digest: activity_digest ?? true,
          marketing_emails: marketing_emails ?? false,
          security_alerts: security_alerts ?? true,
        })
        .select()
        .single();
    }

    if (result.error) {
      console.error('Error updating notification preferences:', result.error);
      return NextResponse.json(
        {
          error: 'Failed to update notification preferences',
          details: result.error.message,
        },
        { status: 500 }
      );
    }

    // Log the preference update
    await logUserUpdated(request, user.id, {
      notification_preferences_updated: true,
      updated_preferences: Object.keys(updates),
    });

    return NextResponse.json({
      success: true,
      message: 'Notification preferences updated successfully',
      preferences: {
        email_notifications: result.data.email_notifications,
        push_notifications: result.data.push_notifications,
        blueprint_updates: result.data.blueprint_updates,
        activity_digest: result.data.activity_digest,
        marketing_emails: result.data.marketing_emails,
        security_alerts: result.data.security_alerts,
      },
    });
  } catch (error) {
    console.error('Notification preferences update API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
