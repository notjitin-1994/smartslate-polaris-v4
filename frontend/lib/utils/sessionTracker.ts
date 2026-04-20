/**
 * Session Tracking Utility
 *
 * Manages user session tracking, including creation, updates, and lifecycle management
 */

import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import type { UserSession, SessionCreateInput, SessionActivity, DeviceType } from '@/types/session';

/**
 * Parse user agent to extract device information
 */
export function parseUserAgent(userAgent: string): {
  device_type: DeviceType;
  browser: string;
  os: string;
} {
  const ua = userAgent.toLowerCase();

  // Detect device type
  let device_type: DeviceType = 'desktop';
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(userAgent)) {
    device_type = 'tablet';
  } else if (
    /Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(
      userAgent
    )
  ) {
    device_type = 'mobile';
  }

  // Detect browser (check more specific browsers first)
  let browser = 'Unknown';
  if (ua.includes('firefox')) browser = 'Firefox';
  else if (ua.includes('edg/')) browser = 'Edge';
  else if (ua.includes('opera') || ua.includes('opr')) browser = 'Opera';
  else if (ua.includes('chrome')) browser = 'Chrome';
  else if (ua.includes('safari') && !ua.includes('chrome')) browser = 'Safari';

  // Detect OS (check more specific OS first)
  let os = 'Unknown';
  if (ua.includes('win')) os = 'Windows';
  else if (ua.includes('iphone') || ua.includes('ipad')) os = 'iOS';
  else if (ua.includes('android')) os = 'Android';
  else if (ua.includes('mac')) os = 'macOS';
  else if (ua.includes('linux')) os = 'Linux';

  return { device_type, browser, os };
}

/**
 * Create a new session
 */
export async function createSession(input: SessionCreateInput): Promise<UserSession | null> {
  try {
    const supabase = getSupabaseAdminClient();

    // Parse user agent if provided
    let deviceInfo = {
      device_type: input.device_type || ('unknown' as DeviceType),
      browser: input.browser || 'Unknown',
      os: input.os || 'Unknown',
    };

    if (input.user_agent) {
      deviceInfo = parseUserAgent(input.user_agent);
    }

    const { data, error } = await supabase
      .from('user_sessions')
      .insert({
        user_id: input.user_id,
        ip_address: input.ip_address,
        user_agent: input.user_agent,
        device_type: deviceInfo.device_type,
        browser: deviceInfo.browser,
        os: deviceInfo.os,
        session_token: input.session_token,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create session:', error);
      return null;
    }

    return data as UserSession;
  } catch (error) {
    console.error('Error creating session:', error);
    return null;
  }
}

/**
 * Get active session for a user
 */
export async function getActiveSession(userId: string): Promise<UserSession | null> {
  try {
    const supabase = getSupabaseAdminClient();

    const { data, error } = await supabase.rpc('get_active_session', {
      p_user_id: userId,
    });

    if (error || !data) {
      return null;
    }

    // Get the full session details
    const { data: session } = await supabase
      .from('user_sessions')
      .select('*')
      .eq('id', data)
      .single();

    return session as UserSession;
  } catch (error) {
    console.error('Error getting active session:', error);
    return null;
  }
}

/**
 * Update session activity
 */
export async function updateSessionActivity(
  sessionId: string,
  activity: SessionActivity
): Promise<boolean> {
  try {
    const supabase = getSupabaseAdminClient();

    const { error } = await supabase.rpc('update_session_activity', {
      p_session_id: sessionId,
      p_page_view: activity.page_view || false,
      p_action: activity.action || false,
      p_blueprint_created: activity.blueprint_created || false,
      p_blueprint_viewed: activity.blueprint_viewed || false,
    });

    if (error) {
      console.error('Failed to update session activity:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error updating session activity:', error);
    return false;
  }
}

/**
 * End a session
 */
export async function endSession(sessionId: string): Promise<boolean> {
  try {
    const supabase = getSupabaseAdminClient();

    const { error } = await supabase
      .from('user_sessions')
      .update({
        is_active: false,
        ended_at: new Date().toISOString(),
      })
      .eq('id', sessionId);

    if (error) {
      console.error('Failed to end session:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error ending session:', error);
    return false;
  }
}

/**
 * End all active sessions for a user
 */
export async function endUserSessions(userId: string): Promise<boolean> {
  try {
    const supabase = getSupabaseAdminClient();

    const { error } = await supabase
      .from('user_sessions')
      .update({
        is_active: false,
        ended_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('is_active', true);

    if (error) {
      console.error('Failed to end user sessions:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error ending user sessions:', error);
    return false;
  }
}

/**
 * Get or create active session for a user
 *
 * Checks for existing active session, creates new one if none exists
 */
export async function getOrCreateSession(
  userId: string,
  userAgent?: string,
  ipAddress?: string
): Promise<UserSession | null> {
  try {
    // Check for existing active session
    let session = await getActiveSession(userId);

    if (session) {
      return session;
    }

    // Create new session
    session = await createSession({
      user_id: userId,
      user_agent: userAgent,
      ip_address: ipAddress,
      session_token: crypto.randomUUID(),
    });

    return session;
  } catch (error) {
    console.error('Error getting or creating session:', error);
    return null;
  }
}

/**
 * Track page view in current session
 */
export async function trackPageView(userId: string): Promise<void> {
  try {
    const session = await getActiveSession(userId);
    if (session) {
      await updateSessionActivity(session.id, { page_view: true });
    }
  } catch (error) {
    console.error('Error tracking page view:', error);
  }
}

/**
 * Track user action in current session
 */
export async function trackAction(userId: string): Promise<void> {
  try {
    const session = await getActiveSession(userId);
    if (session) {
      await updateSessionActivity(session.id, { action: true });
    }
  } catch (error) {
    console.error('Error tracking action:', error);
  }
}

/**
 * Track blueprint creation in current session
 */
export async function trackBlueprintCreation(userId: string): Promise<void> {
  try {
    const session = await getActiveSession(userId);
    if (session) {
      await updateSessionActivity(session.id, { blueprint_created: true });
    }
  } catch (error) {
    console.error('Error tracking blueprint creation:', error);
  }
}

/**
 * Track blueprint view in current session
 */
export async function trackBlueprintView(userId: string): Promise<void> {
  try {
    const session = await getActiveSession(userId);
    if (session) {
      await updateSessionActivity(session.id, { blueprint_viewed: true });
    }
  } catch (error) {
    console.error('Error tracking blueprint view:', error);
  }
}
