/**
 * System Log Service
 * Database operations for system_logs table
 * Uses service role client for background operations outside HTTP request context
 */

import { getSupabaseAdminClient } from '@/lib/supabase/server';
import type { LogEntry, LogQuery, LogStats, LogLevel, LogService } from '@/lib/logging/types';

/**
 * Insert a single log entry into the database
 * Uses admin client since this can run outside request context
 */
export async function insertSystemLog(entry: LogEntry): Promise<boolean> {
  try {
    const supabase = getSupabaseAdminClient();

    const { error } = await supabase.from('system_logs').insert({
      timestamp: entry.timestamp,
      level: entry.level,
      service: entry.service,
      event: entry.event,
      message: entry.message,
      metadata: entry.metadata || {},
      user_id: entry.metadata.userId || null,
      blueprint_id: entry.metadata.blueprintId || null,
      session_id: entry.metadata.sessionId || null,
      request_id: entry.metadata.requestId || null,
      duration_ms: entry.metadata.duration || null,
      error_stack: entry.metadata.errorStack || null,
    });

    if (error) {
      console.error('[SystemLogService] Failed to insert log:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[SystemLogService] Insert error:', error);
    return false;
  }
}

/**
 * Batch insert multiple log entries for performance
 * Uses admin client since this can run outside request context
 */
export async function insertSystemLogsBatch(entries: LogEntry[]): Promise<number> {
  if (entries.length === 0) {
    return 0;
  }

  try {
    const supabase = getSupabaseAdminClient();

    // Transform entries to database format
    const dbLogs = entries.map((entry) => ({
      timestamp: entry.timestamp,
      level: entry.level,
      service: entry.service,
      event: entry.event,
      message: entry.message,
      metadata: entry.metadata || {},
      user_id: entry.metadata?.userId || null,
      blueprint_id: entry.metadata?.blueprintId || null,
      session_id: entry.metadata?.sessionId || null,
      request_id: entry.metadata?.requestId || null,
      duration_ms: entry.metadata?.duration || null,
      error_stack: entry.metadata?.errorStack || null,
    }));

    // Use the bulk insert function for better performance
    const { data, error } = await supabase.rpc('insert_system_logs_batch', {
      p_logs: dbLogs,
    });

    if (error) {
      console.error('[SystemLogService] Batch insert error:', error);
      // Fallback to individual inserts if batch fails
      let successCount = 0;
      for (const entry of entries) {
        if (await insertSystemLog(entry)) {
          successCount++;
        }
      }
      return successCount;
    }

    return data || entries.length;
  } catch (error) {
    console.error('[SystemLogService] Batch insert exception:', error);
    return 0;
  }
}

/**
 * Query system logs from database with filtering
 * Uses admin client to query all logs without RLS restrictions
 */
export async function querySystemLogs(query: LogQuery = {}): Promise<LogEntry[]> {
  try {
    const supabase = getSupabaseAdminClient();

    let queryBuilder = supabase
      .from('system_logs')
      .select('*')
      .order('timestamp', { ascending: false });

    // Apply filters
    if (query.level) {
      const levels = Array.isArray(query.level) ? query.level : [query.level];
      queryBuilder = queryBuilder.in('level', levels);
    }

    if (query.service) {
      const services = Array.isArray(query.service) ? query.service : [query.service];
      queryBuilder = queryBuilder.in('service', services);
    }

    if (query.event) {
      const events = Array.isArray(query.event) ? query.event : [query.event];
      queryBuilder = queryBuilder.in('event', events);
    }

    if (query.userId) {
      queryBuilder = queryBuilder.eq('user_id', query.userId);
    }

    if (query.blueprintId) {
      queryBuilder = queryBuilder.eq('blueprint_id', query.blueprintId);
    }

    if (query.from) {
      queryBuilder = queryBuilder.gte('timestamp', query.from);
    }

    if (query.to) {
      queryBuilder = queryBuilder.lte('timestamp', query.to);
    }

    // Apply search (searches in message and metadata)
    if (query.search) {
      // Note: This is a simple implementation. For production, consider full-text search
      queryBuilder = queryBuilder.or(
        `message.ilike.%${query.search}%,metadata->text.ilike.%${query.search}%`
      );
    }

    // Apply pagination
    const limit = query.limit || 100;
    const offset = query.offset || 0;
    queryBuilder = queryBuilder.range(offset, offset + limit - 1);

    const { data, error } = await queryBuilder;

    if (error) {
      console.error('[SystemLogService] Query error:', error);
      return [];
    }

    // Transform database records to LogEntry format
    return (data || []).map((row) => ({
      id: row.id,
      timestamp: row.timestamp,
      level: row.level as LogLevel,
      service: row.service as LogService,
      event: row.event,
      message: row.message,
      metadata: {
        ...row.metadata,
        userId: row.user_id || undefined,
        blueprintId: row.blueprint_id || undefined,
        sessionId: row.session_id || undefined,
        requestId: row.request_id || undefined,
        duration: row.duration_ms || undefined,
        errorStack: row.error_stack || undefined,
      },
    }));
  } catch (error) {
    console.error('[SystemLogService] Query exception:', error);
    return [];
  }
}

/**
 * Get total count of logs matching query
 */
export async function getSystemLogsCount(query: LogQuery = {}): Promise<number> {
  try {
    const supabase = getSupabaseAdminClient();

    let queryBuilder = supabase.from('system_logs').select('*', { count: 'exact', head: true });

    // Apply same filters as querySystemLogs
    if (query.level) {
      const levels = Array.isArray(query.level) ? query.level : [query.level];
      queryBuilder = queryBuilder.in('level', levels);
    }

    if (query.service) {
      const services = Array.isArray(query.service) ? query.service : [query.service];
      queryBuilder = queryBuilder.in('service', services);
    }

    if (query.event) {
      const events = Array.isArray(query.event) ? query.event : [query.event];
      queryBuilder = queryBuilder.in('event', events);
    }

    if (query.userId) {
      queryBuilder = queryBuilder.eq('user_id', query.userId);
    }

    if (query.blueprintId) {
      queryBuilder = queryBuilder.eq('blueprint_id', query.blueprintId);
    }

    if (query.from) {
      queryBuilder = queryBuilder.gte('timestamp', query.from);
    }

    if (query.to) {
      queryBuilder = queryBuilder.lte('timestamp', query.to);
    }

    if (query.search) {
      queryBuilder = queryBuilder.or(
        `message.ilike.%${query.search}%,metadata->text.ilike.%${query.search}%`
      );
    }

    const { count, error } = await queryBuilder;

    if (error) {
      console.error('[SystemLogService] Count error:', error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error('[SystemLogService] Count exception:', error);
    return 0;
  }
}

/**
 * Get statistics for logs matching query
 */
export async function getSystemLogsStats(query: LogQuery = {}): Promise<LogStats> {
  try {
    const logs = await querySystemLogs({ ...query, limit: 10000 }); // Limit for stats calculation

    const stats: LogStats = {
      total: logs.length,
      byLevel: {
        debug: 0,
        info: 0,
        warn: 0,
        error: 0,
      },
      byService: {} as Record<LogService, number>,
      errorRate: 0,
      avgDuration: 0,
    };

    let totalDuration = 0;
    let durationCount = 0;

    for (const log of logs) {
      // Count by level
      stats.byLevel[log.level]++;

      // Count by service
      if (!stats.byService[log.service]) {
        stats.byService[log.service] = 0;
      }
      stats.byService[log.service]++;

      // Calculate average duration
      if (log.metadata.duration) {
        totalDuration += log.metadata.duration;
        durationCount++;
      }
    }

    // Calculate error rate
    stats.errorRate = logs.length > 0 ? (stats.byLevel.error / logs.length) * 100 : 0;

    // Calculate average duration
    stats.avgDuration = durationCount > 0 ? totalDuration / durationCount : 0;

    return stats;
  } catch (error) {
    console.error('[SystemLogService] Stats exception:', error);
    return {
      total: 0,
      byLevel: { debug: 0, info: 0, warn: 0, error: 0 },
      byService: {} as Record<LogService, number>,
      errorRate: 0,
      avgDuration: 0,
    };
  }
}

/**
 * Delete old system logs (cleanup)
 */
export async function deleteOldSystemLogs(daysToKeep: number = 30): Promise<number> {
  try {
    const supabase = getSupabaseAdminClient();

    const { data, error } = await supabase.rpc('cleanup_old_system_logs', {
      p_days_to_keep: daysToKeep,
    });

    if (error) {
      console.error('[SystemLogService] Cleanup error:', error);
      return 0;
    }

    return data || 0;
  } catch (error) {
    console.error('[SystemLogService] Cleanup exception:', error);
    return 0;
  }
}

/**
 * Clear all system logs (admin only - use with caution)
 */
export async function clearAllSystemLogs(): Promise<boolean> {
  try {
    const supabase = getSupabaseAdminClient();

    const { error } = await supabase
      .from('system_logs')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (error) {
      console.error('[SystemLogService] Clear all error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[SystemLogService] Clear all exception:', error);
    return false;
  }
}
