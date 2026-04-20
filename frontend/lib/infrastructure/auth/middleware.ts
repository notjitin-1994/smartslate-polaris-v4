/**
 * Authentication Middleware
 *
 * Provides reusable authentication and authorization middleware functions
 * for API routes and server-side operations.
 *
 * @version 1.0.0
 * @date 2025-10-30
 */

import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { User } from '@supabase/supabase-js';

// ============================================================================
// Types
// ============================================================================

export interface AuthResult {
  success: boolean;
  user?: User;
  error?: string;
}

export interface RoleResult {
  success: boolean;
  user?: User;
  error?: string;
}

// ============================================================================
// Authentication Middleware
// ============================================================================

/**
 * Require authenticated user
 * Validates that a user is authenticated and returns their user data
 */
export async function requireAuth(request: NextRequest): Promise<AuthResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      return {
        success: false,
        error: 'Authentication failed: ' + error.message,
      };
    }

    if (!user) {
      return {
        success: false,
        error: 'Authentication required: No user found',
      };
    }

    return {
      success: true,
      user,
    };
  } catch (error) {
    return {
      success: false,
      error: 'Authentication error: ' + (error as Error).message,
    };
  }
}

/**
 * Require specific user role
 * Validates that the authenticated user has one of the required roles
 */
export async function requireRole(
  request: NextRequest,
  requiredRoles: string[]
): Promise<RoleResult> {
  try {
    // First authenticate the user
    const authResult = await requireAuth(request);
    if (!authResult.success) {
      return {
        success: false,
        error: authResult.error,
      };
    }

    const user = authResult.user!;

    // Get user profile to check role
    const supabase = await createClient();
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('user_role, subscription_tier')
      .eq('id', user.id)
      .single();

    if (profileError) {
      return {
        success: false,
        error: 'Failed to fetch user profile: ' + profileError.message,
      };
    }

    if (!profile) {
      return {
        success: false,
        error: 'User profile not found',
      };
    }

    const userRole = profile.user_role;

    // Check if user has required role
    if (!requiredRoles.includes(userRole)) {
      return {
        success: false,
        error: `Insufficient permissions. Required roles: ${requiredRoles.join(', ')}, Current role: ${userRole}`,
      };
    }

    return {
      success: true,
      user,
    };
  } catch (error) {
    return {
      success: false,
      error: 'Role validation error: ' + (error as Error).message,
    };
  }
}

/**
 * Require specific subscription tier
 * Validates that the authenticated user has the required subscription tier or higher
 */
export async function requireTier(request: NextRequest, requiredTier: string): Promise<RoleResult> {
  try {
    // First authenticate the user
    const authResult = await requireAuth(request);
    if (!authResult.success) {
      return {
        success: false,
        error: authResult.error,
      };
    }

    const user = authResult.user!;

    // Get user profile to check subscription tier
    const supabase = await createClient();
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('user_role, subscription_tier')
      .eq('id', user.id)
      .single();

    if (profileError) {
      return {
        success: false,
        error: 'Failed to fetch user profile: ' + profileError.message,
      };
    }

    if (!profile) {
      return {
        success: false,
        error: 'User profile not found',
      };
    }

    const userTier = profile.subscription_tier;

    // Define tier hierarchy (lower index = lower tier)
    const tierHierarchy = [
      'explorer',
      'navigator',
      'voyager',
      'crew',
      'fleet',
      'armada',
      'enterprise',
    ];

    const requiredTierIndex = tierHierarchy.indexOf(requiredTier);
    const userTierIndex = tierHierarchy.indexOf(userTier);

    if (requiredTierIndex === -1 || userTierIndex === -1) {
      return {
        success: false,
        error: `Invalid tier specified. Required: ${requiredTier}, User: ${userTier}`,
      };
    }

    if (userTierIndex < requiredTierIndex) {
      return {
        success: false,
        error: `Insufficient subscription tier. Required: ${requiredTier} or higher, Current: ${userTier}`,
      };
    }

    return {
      success: true,
      user,
    };
  } catch (error) {
    return {
      success: false,
      error: 'Tier validation error: ' + (error as Error).message,
    };
  }
}

/**
 * Optional authentication - returns user if authenticated, null otherwise
 * Used for routes that work with or without authentication
 */
export async function optionalAuth(
  request: NextRequest
): Promise<{ user: User | null; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      return {
        user: null,
        error: 'Authentication error: ' + error.message,
      };
    }

    return {
      user: user || null,
    };
  } catch (error) {
    return {
      user: null,
      error: 'Authentication error: ' + (error as Error).message,
    };
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get user IP address from request
 */
export function getUserIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const real = request.headers.get('x-real-ip');
  const ip = forwarded?.split(',')[0] || real || 'unknown';
  return ip;
}

/**
 * Get user agent from request
 */
export function getUserAgent(request: NextRequest): string {
  return request.headers.get('user-agent') || 'unknown';
}

/**
 * Create auth context for logging and monitoring
 */
export async function createAuthContext(request: NextRequest): Promise<{
  user?: User;
  userId?: string;
  ip: string;
  userAgent: string;
  timestamp: string;
}> {
  const authResult = await optionalAuth(request);
  const timestamp = new Date().toISOString();

  return {
    user: authResult.user || undefined,
    userId: authResult.user?.id,
    ip: getUserIP(request),
    userAgent: getUserAgent(request),
    timestamp,
  };
}

// ============================================================================
// Rate Limiting Context
// ============================================================================

/**
 * Create rate limit key for authenticated user
 */
export function createUserRateLimitKey(
  request: NextRequest,
  prefix: string,
  identifier?: string
): string {
  const ip = getUserIP(request);
  const userId = identifier || 'anonymous';
  return `${prefix}:${userId}:${ip}`;
}
