/**
 * Database Persistence Worker for System Logs
 * Periodically flushes in-memory logs to database for persistence
 */

import { insertSystemLogsBatch } from '@/lib/services/systemLogService';
import { LogStore } from './logStore';

// Interval handle for cleanup
let flushInterval: NodeJS.Timeout | null = null;

// Track if persistence is running
let isRunning = false;

// Flush configuration
const FLUSH_INTERVAL_MS = 10000; // 10 seconds
const BATCH_SIZE = 100; // Flush max 100 logs at a time

// Last flush timestamp for tracking
let lastFlushTimestamp: string | null = null;

// Logs pending flush (queue for failed flushes)
const pendingLogs: Set<string> = new Set(); // Store log IDs

/**
 * Start the database persistence worker
 * Flushes in-memory logs to database every 10 seconds
 *
 * @param logStore - LogStore instance to flush from
 */
export function startLogPersistence(logStore: LogStore): void {
  // Prevent multiple instances
  if (isRunning) {
    console.warn('[LogPersistence] Already running. Ignoring start request.');
    return;
  }

  console.log('[LogPersistence] Starting background worker...');
  isRunning = true;

  // Flush immediately on start
  flushLogsToDatabase(logStore);

  // Set up periodic flush
  flushInterval = setInterval(() => {
    flushLogsToDatabase(logStore);
  }, FLUSH_INTERVAL_MS);

  console.log(`[LogPersistence] Worker started. Flushing every ${FLUSH_INTERVAL_MS}ms`);
}

/**
 * Stop the database persistence worker
 */
export function stopLogPersistence(): void {
  if (!isRunning) {
    console.warn('[LogPersistence] Not running. Ignoring stop request.');
    return;
  }

  console.log('[LogPersistence] Stopping background worker...');

  if (flushInterval) {
    clearInterval(flushInterval);
    flushInterval = null;
  }

  isRunning = false;
  console.log('[LogPersistence] Worker stopped.');
}

/**
 * Check if log persistence is running
 */
export function isLogPersistenceRunning(): boolean {
  return isRunning;
}

/**
 * Get last flush timestamp
 */
export function getLastFlushTimestamp(): string | null {
  return lastFlushTimestamp;
}

/**
 * Flush logs to database
 * Internal function called by interval
 */
async function flushLogsToDatabase(logStore: LogStore): Promise<void> {
  try {
    // Get logs since last flush
    const logs = lastFlushTimestamp
      ? logStore.query({
          from: lastFlushTimestamp,
          limit: BATCH_SIZE,
        })
      : logStore.getRecent(BATCH_SIZE);

    // Skip if no logs to flush
    if (logs.length === 0) {
      return;
    }

    console.log(`[LogPersistence] Flushing ${logs.length} logs to database...`);

    // Attempt batch insert
    const insertedCount = await insertSystemLogsBatch(logs);

    if (insertedCount > 0) {
      // Update last flush timestamp to the newest log's timestamp
      lastFlushTimestamp = logs[0].timestamp; // Logs are sorted newest first

      // Clear pending logs for successful batch
      for (const log of logs) {
        pendingLogs.delete(log.id);
      }

      console.log(`[LogPersistence] Successfully flushed ${insertedCount} logs.`);
    } else {
      // Mark logs as pending retry on failure
      for (const log of logs) {
        pendingLogs.add(log.id);
      }

      console.error(`[LogPersistence] Failed to flush logs. ${logs.length} logs pending retry.`);
    }
  } catch (error) {
    // Log error to console (can't use logger to avoid infinite loop)
    console.error('[LogPersistence] Flush error:', error);
  }
}

/**
 * Manually trigger a flush (for testing or immediate flush)
 *
 * @param logStore - LogStore instance to flush from
 * @returns Number of logs flushed
 */
export async function manualFlush(logStore: LogStore): Promise<number> {
  console.log('[LogPersistence] Manual flush triggered...');

  const logs = logStore.getAll();

  if (logs.length === 0) {
    console.log('[LogPersistence] No logs to flush.');
    return 0;
  }

  const insertedCount = await insertSystemLogsBatch(logs);

  if (insertedCount > 0) {
    lastFlushTimestamp = logs[0].timestamp;
    console.log(`[LogPersistence] Manual flush completed: ${insertedCount} logs.`);
  } else {
    console.error('[LogPersistence] Manual flush failed.');
  }

  return insertedCount;
}

/**
 * Get pending log count (failed flushes)
 */
export function getPendingLogCount(): number {
  return pendingLogs.size;
}

/**
 * Clear pending logs (after manual intervention)
 */
export function clearPendingLogs(): void {
  pendingLogs.clear();
  console.log('[LogPersistence] Pending logs cleared.');
}

/**
 * Get persistence status for monitoring
 */
export function getPersistenceStatus(): {
  isRunning: boolean;
  lastFlush: string | null;
  pendingCount: number;
  flushInterval: number;
} {
  return {
    isRunning,
    lastFlush: lastFlushTimestamp,
    pendingCount: pendingLogs.size,
    flushInterval: FLUSH_INTERVAL_MS,
  };
}
