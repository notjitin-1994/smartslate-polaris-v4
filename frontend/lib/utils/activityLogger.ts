/**
 * Activity Logger Utility
 *
 * Provides helper functions for logging admin and user activities
 * to the activity_logs table for comprehensive audit trails.
 *
 * @see /supabase/migrations/0027_activity_logs.sql
 */

import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';

/**
 * Supported action types (must match database CHECK constraint)
 */
export type ActivityActionType =
  | 'user_created'
  | 'user_updated'
  | 'user_deleted'
  | 'user_role_changed'
  | 'user_tier_changed'
  | 'user_limits_updated'
  | 'bulk_role_update'
  | 'bulk_tier_update'
  | 'bulk_delete'
  | 'user_login'
  | 'user_logout'
  | 'user_password_reset'
  | 'user_email_changed'
  | 'data_export'
  | 'system_config_change'
  | 'blueprint_created'
  | 'blueprint_deleted'
  | 'blueprint_shared';

/**
 * Resource types
 */
export type ResourceType = 'user' | 'blueprint' | 'system' | 'export';

/**
 * Activity log entry structure
 */
export interface ActivityLogEntry {
  userId?: string | null;
  actorId?: string | null;
  actionType: ActivityActionType;
  resourceType?: ResourceType;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Extract IP address from Next.js Request object
 */
export function extractIpAddress(request: Request): string | undefined {
  // Try various headers that might contain the IP
  const headers = request.headers;

  // X-Forwarded-For is commonly used by proxies/load balancers
  const xForwardedFor = headers.get('x-forwarded-for');
  if (xForwardedFor) {
    // Can contain multiple IPs (client, proxy1, proxy2...)
    return xForwardedFor.split(',')[0].trim();
  }

  // X-Real-IP is sometimes used
  const xRealIp = headers.get('x-real-ip');
  if (xRealIp) {
    return xRealIp;
  }

  // CF-Connecting-IP (Cloudflare)
  const cfConnectingIp = headers.get('cf-connecting-ip');
  if (cfConnectingIp) {
    return cfConnectingIp;
  }

  return undefined;
}

/**
 * Extract user agent from Request object
 */
export function extractUserAgent(request: Request): string | undefined {
  return request.headers.get('user-agent') || undefined;
}

/**
 * Log an activity to the database
 *
 * @example
 * await logActivity({
 *   userId: '123',
 *   actorId: '456',
 *   actionType: 'user_updated',
 *   resourceType: 'user',
 *   resourceId: '123',
 *   metadata: {
 *     changes: {
 *       role: { before: 'user', after: 'admin' }
 *     }
 *   }
 * });
 */
export async function logActivity(entry: ActivityLogEntry): Promise<boolean> {
  try {
    const adminClient = getSupabaseAdminClient();

    const { error } = await adminClient.from('activity_logs').insert({
      user_id: entry.userId || null,
      actor_id: entry.actorId || null,
      action_type: entry.actionType,
      resource_type: entry.resourceType || null,
      resource_id: entry.resourceId || null,
      metadata: entry.metadata || {},
      ip_address: entry.ipAddress || null,
      user_agent: entry.userAgent || null,
    });

    if (error) {
      console.error('Failed to log activity:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Activity logging error:', error);
    return false;
  }
}

/**
 * Log activity from an API route with automatic context extraction
 *
 * @example
 * await logActivityFromRequest(request, {
 *   userId: targetUserId,
 *   actionType: 'user_updated',
 *   resourceType: 'user',
 *   resourceId: targetUserId,
 *   metadata: { changes }
 * });
 */
export async function logActivityFromRequest(
  request: Request,
  entry: Omit<ActivityLogEntry, 'ipAddress' | 'userAgent' | 'actorId'>
): Promise<boolean> {
  try {
    // Get the current authenticated user (actor)
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Extract context from request
    const ipAddress = extractIpAddress(request);
    const userAgent = extractUserAgent(request);

    return await logActivity({
      ...entry,
      actorId: user?.id || null,
      ipAddress,
      userAgent,
    });
  } catch (error) {
    console.error('Activity logging from request error:', error);
    return false;
  }
}

/**
 * Log user creation activity
 */
export async function logUserCreated(
  request: Request,
  userId: string,
  metadata?: Record<string, unknown>
): Promise<boolean> {
  return await logActivityFromRequest(request, {
    userId,
    actionType: 'user_created',
    resourceType: 'user',
    resourceId: userId,
    metadata,
  });
}

/**
 * Log user update activity
 */
export async function logUserUpdated(
  request: Request,
  userId: string,
  changes: Record<string, { before: unknown; after: unknown }>
): Promise<boolean> {
  return await logActivityFromRequest(request, {
    userId,
    actionType: 'user_updated',
    resourceType: 'user',
    resourceId: userId,
    metadata: { changes },
  });
}

/**
 * Log user deletion activity
 */
export async function logUserDeleted(
  request: Request,
  userId: string,
  metadata?: Record<string, unknown>
): Promise<boolean> {
  return await logActivityFromRequest(request, {
    userId,
    actionType: 'user_deleted',
    resourceType: 'user',
    resourceId: userId,
    metadata,
  });
}

/**
 * Log role change activity
 */
export async function logUserRoleChanged(
  request: Request,
  userId: string,
  beforeRole: string,
  afterRole: string
): Promise<boolean> {
  return await logActivityFromRequest(request, {
    userId,
    actionType: 'user_role_changed',
    resourceType: 'user',
    resourceId: userId,
    metadata: {
      change: {
        before: beforeRole,
        after: afterRole,
      },
    },
  });
}

/**
 * Log tier change activity
 */
export async function logUserTierChanged(
  request: Request,
  userId: string,
  beforeTier: string,
  afterTier: string
): Promise<boolean> {
  return await logActivityFromRequest(request, {
    userId,
    actionType: 'user_tier_changed',
    resourceType: 'user',
    resourceId: userId,
    metadata: {
      change: {
        before: beforeTier,
        after: afterTier,
      },
    },
  });
}

/**
 * Log bulk role update activity
 */
export async function logBulkRoleUpdate(
  request: Request,
  userIds: string[],
  newRole: string
): Promise<boolean> {
  return await logActivityFromRequest(request, {
    actionType: 'bulk_role_update',
    resourceType: 'user',
    metadata: {
      userIds,
      newRole,
      count: userIds.length,
    },
  });
}

/**
 * Log bulk tier update activity
 */
export async function logBulkTierUpdate(
  request: Request,
  userIds: string[],
  newTier: string
): Promise<boolean> {
  return await logActivityFromRequest(request, {
    actionType: 'bulk_tier_update',
    resourceType: 'user',
    metadata: {
      userIds,
      newTier,
      count: userIds.length,
    },
  });
}

/**
 * Log bulk deletion activity
 */
export async function logBulkDelete(request: Request, userIds: string[]): Promise<boolean> {
  return await logActivityFromRequest(request, {
    actionType: 'bulk_delete',
    resourceType: 'user',
    metadata: {
      userIds,
      count: userIds.length,
    },
  });
}

/**
 * Log data export activity
 */
export async function logDataExport(
  request: Request,
  exportFormat: string,
  filters: Record<string, unknown>
): Promise<boolean> {
  return await logActivityFromRequest(request, {
    actionType: 'data_export',
    resourceType: 'export',
    metadata: {
      format: exportFormat,
      filters,
    },
  });
}

/**
 * Retrieve activity logs for a specific user
 *
 * @example
 * const activities = await getUserActivities('user-id', { limit: 50 });
 */
export async function getUserActivities(
  userId: string,
  options?: {
    limit?: number;
    offset?: number;
    actionTypes?: ActivityActionType[];
  }
): Promise<{
  data: Array<{
    id: string;
    action_type: ActivityActionType;
    resource_type: ResourceType | null;
    resource_id: string | null;
    metadata: Record<string, unknown>;
    actor_id: string | null;
    ip_address: string | null;
    user_agent: string | null;
    created_at: string;
    actor?: {
      email: string;
      full_name: string | null;
    };
  }>;
  count: number;
} | null> {
  try {
    console.log('[ActivityLogger] getUserActivities called with:', { userId, options });

    const supabase = await createClient();
    console.log('[ActivityLogger] Supabase client created');

    let query = supabase
      .from('activity_logs')
      .select(
        `
        id,
        action_type,
        resource_type,
        resource_id,
        metadata,
        actor_id,
        ip_address,
        user_agent,
        created_at
      `,
        { count: 'exact' }
      )
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    console.log('[ActivityLogger] Query built');

    if (options?.actionTypes && options.actionTypes.length > 0) {
      query = query.in('action_type', options.actionTypes);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 50) - 1);
    }

    console.log('[ActivityLogger] Executing query');
    const { data, error, count } = await query;

    console.log('[ActivityLogger] Query result:', {
      hasData: !!data,
      dataLength: data?.length,
      hasError: !!error,
      count,
    });

    if (error) {
      console.error('[ActivityLogger] Failed to fetch user activities:', error);
      return null;
    }

    // Fetch actor information for activities that have an actor_id
    const actorIds = Array.from(
      new Set(data?.filter((a) => a.actor_id).map((a) => a.actor_id) || [])
    ) as string[];

    console.log('[ActivityLogger] Actor IDs to fetch:', actorIds);

    const actorMap: Map<string, { email: string; full_name: string | null }> = new Map();

    if (actorIds.length > 0) {
      console.log('[ActivityLogger] Fetching actor information');
      const adminClient = getSupabaseAdminClient();

      // Fetch actor info from auth.users using admin client
      const { data: actors } = await adminClient.auth.admin.listUsers();
      console.log('[ActivityLogger] Fetched actors:', actors?.users?.length || 0);

      if (actors?.users) {
        actorIds.forEach((actorId) => {
          const actor = actors.users.find((u) => u.id === actorId);
          if (actor) {
            actorMap.set(actorId, {
              email: actor.email || 'unknown',
              full_name: actor.user_metadata?.full_name || null,
            });
          }
        });
      }
    }

    console.log('[ActivityLogger] Actor map size:', actorMap.size);

    // Transform the data with actor information
    const transformedData = data?.map((activity) => ({
      ...activity,
      actor: activity.actor_id ? actorMap.get(activity.actor_id) : undefined,
    }));

    console.log('[ActivityLogger] Returning transformed data:', {
      count: transformedData?.length || 0,
      totalCount: count || 0,
    });

    return {
      data: transformedData || [],
      count: count || 0,
    };
  } catch (error) {
    console.error('[ActivityLogger] Error fetching user activities:', error);
    console.error('[ActivityLogger] Error type:', typeof error);
    console.error(
      '[ActivityLogger] Error stack:',
      error instanceof Error ? error.stack : 'No stack'
    );
    return null;
  }
}
