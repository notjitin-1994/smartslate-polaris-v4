/**
 * Session Tracking Middleware
 * Tracks user sessions for security monitoring
 */

import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { DeviceInfo } from '@/types/settings';

interface SessionTrackingOptions {
  updateOnEveryRequest?: boolean;
  trackLocation?: boolean;
  trackDeviceInfo?: boolean;
}

/**
 * Extract device information from request
 */
function extractDeviceInfo(request: NextRequest): DeviceInfo {
  const userAgent = request.headers.get('user-agent') || '';

  // Basic device type detection
  const isMobile = /mobile|android|iphone|ipad|phone/i.test(userAgent);
  const isTablet = /ipad|tablet/i.test(userAgent);
  const isDesktop = !isMobile && !isTablet;

  // Browser detection
  let browser = 'Unknown';
  if (userAgent.includes('Chrome')) browser = 'Chrome';
  else if (userAgent.includes('Safari')) browser = 'Safari';
  else if (userAgent.includes('Firefox')) browser = 'Firefox';
  else if (userAgent.includes('Edge')) browser = 'Edge';

  // OS detection
  let os = 'Unknown';
  if (userAgent.includes('Windows')) os = 'Windows';
  else if (userAgent.includes('Mac')) os = 'macOS';
  else if (userAgent.includes('Linux')) os = 'Linux';
  else if (userAgent.includes('Android')) os = 'Android';
  else if (userAgent.includes('iOS')) os = 'iOS';

  return {
    device_type: isDesktop ? 'desktop' : isMobile ? 'mobile' : 'tablet',
    browser,
    browser_version: extractBrowserVersion(userAgent, browser),
    os,
    os_version: null,
  };
}

/**
 * Extract browser version from user agent
 */
function extractBrowserVersion(userAgent: string, browser: string): string | null {
  try {
    const match = userAgent.match(new RegExp(`${browser}\\/([\\d.]+)`));
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

/**
 * Get IP address from request
 */
function getIpAddress(request: NextRequest): string | null {
  // Check various headers in order of preference
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return forwarded.split(',')[0].trim();
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp;

  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  if (cfConnectingIp) return cfConnectingIp;

  return null;
}

/**
 * Track or update user session
 */
export async function trackSession(
  request: NextRequest,
  options: SessionTrackingOptions = {}
): Promise<{ success: boolean; sessionId?: string; error?: string }> {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Not authenticated' };
    }

    // Get session token from auth
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return { success: false, error: 'No active session' };
    }

    // Extract session information
    const deviceInfo = options.trackDeviceInfo !== false ? extractDeviceInfo(request) : null;
    const ipAddress = getIpAddress(request);
    const userAgent = request.headers.get('user-agent');

    // Check if session already exists
    const { data: existingSessions } = await supabase
      .from('session_tracking')
      .select('id, last_activity_at')
      .eq('user_id', user.id)
      .eq('session_token', session.access_token)
      .eq('is_active', true)
      .limit(1);

    if (existingSessions && existingSessions.length > 0) {
      // Update existing session
      const sessionId = existingSessions[0].id;
      const lastActivity = new Date(existingSessions[0].last_activity_at);
      const now = new Date();

      // Only update if updateOnEveryRequest is true or if last activity was more than 5 minutes ago
      const shouldUpdate =
        options.updateOnEveryRequest || now.getTime() - lastActivity.getTime() > 5 * 60 * 1000;

      if (shouldUpdate) {
        await supabase
          .from('session_tracking')
          .update({
            last_activity_at: now.toISOString(),
            ip_address: ipAddress,
          })
          .eq('id', sessionId);
      }

      return { success: true, sessionId };
    } else {
      // Create new session record
      const { data: newSession, error: insertError } = await supabase
        .from('session_tracking')
        .insert({
          user_id: user.id,
          session_token: session.access_token,
          device_info: deviceInfo,
          ip_address: ipAddress,
          user_agent: userAgent,
          is_active: true,
          created_at: new Date().toISOString(),
          last_activity_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (insertError) {
        console.error('Failed to create session tracking:', insertError);
        return { success: false, error: insertError.message };
      }

      return { success: true, sessionId: newSession.id };
    }
  } catch (error) {
    console.error('Session tracking error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Mark session as inactive
 */
export async function deactivateSession(sessionId: string): Promise<{ success: boolean }> {
  try {
    const supabase = await createClient();

    await supabase
      .from('session_tracking')
      .update({
        is_active: false,
        ended_at: new Date().toISOString(),
      })
      .eq('id', sessionId);

    return { success: true };
  } catch (error) {
    console.error('Failed to deactivate session:', error);
    return { success: false };
  }
}

/**
 * Mark current session as suspicious
 */
export async function flagSuspiciousSession(
  sessionId: string,
  reason: string
): Promise<{ success: boolean }> {
  try {
    const supabase = await createClient();

    await supabase
      .from('session_tracking')
      .update({
        is_suspicious: true,
      })
      .eq('id', sessionId);

    // Could also send security alert email here
    console.warn(`Suspicious session flagged: ${sessionId} - ${reason}`);

    return { success: true };
  } catch (error) {
    console.error('Failed to flag suspicious session:', error);
    return { success: false };
  }
}
