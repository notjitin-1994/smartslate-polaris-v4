/**
 * Razorpay Webhook Idempotency Service
 *
 * @description Idempotency checking and management for Razorpay webhook events
 * @version 1.0.0
 * @date 2025-10-29
 *
 * This service leverages the built-in database functions for robust
 * idempotency handling and prevents duplicate event processing.
 *
 * @see supabase/migrations/20251029080000_create_razorpay_webhook_events_table.sql
 * @see docs/RAZORPAY_INTEGRATION_GUIDE.md
 */

import { getSupabaseServerClient } from '../supabase/server';

// ============================================================================
// Types and Interfaces
// ============================================================================

/**
 * Webhook event record for database storage
 */
export interface WebhookEventRecord {
  id: string;
  eventId: string;
  eventType: string;
  accountId?: string;
  payload: any;
  processingStatus: 'pending' | 'processing' | 'processed' | 'failed' | 'skipped';
  processingAttempts: number;
  processingError?: string;
  processingStartedAt?: string;
  processedAt?: string;
  signatureVerified: boolean;
  signature?: string;
  relatedSubscriptionId?: string;
  relatedPaymentId?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Idempotency check result
 */
export interface IdempotencyCheckResult {
  exists: boolean;
  webhookId?: string;
  status?: string;
  shouldProcess: boolean;
  details?: {
    existingRecord?: WebhookEventRecord;
    reason?: string;
  };
}

/**
 * Event recording result
 */
export interface RecordEventResult {
  success: boolean;
  webhookId?: string;
  wasDuplicate?: boolean;
  error?: string;
}

/**
 * Event status update result
 */
export interface UpdateEventStatusResult {
  success: boolean;
  webhookId?: string;
  wasUpdated?: boolean;
  error?: string;
}

/**
 * Webhook event processing statistics
 */
export interface WebhookEventStats {
  totalEvents: number;
  processedEvents: number;
  pendingEvents: number;
  failedEvents: number;
  duplicateEvents: number;
  averageProcessingTime?: number;
  eventsByType: Record<string, number>;
}

// ============================================================================
// Idempotency Service
// ============================================================================

/**
 * Webhook idempotency service for preventing duplicate event processing
 *
 * This service provides a high-level API for webhook idempotency management,
 * leveraging the built-in database functions for atomic operations.
 */
export class WebhookIdempotencyService {
  private supabase: any;

  constructor() {
    // Initialize supabase client asynchronously - fix for build error
    this.supabase = null;
  }

  private async initializeClient() {
    if (!this.supabase) {
      this.supabase = await getSupabaseServerClient();
    }
    return this.supabase;
  }

  /**
   * Check if a webhook event has already been processed
   *
   * @param eventId - Razorpay event ID
   * @returns Idempotency check result
   *
   * @example
   const idempotency = new WebhookIdempotencyService();
   const check = await idempotency.checkEventProcessed('evt_test123456');
   if (check.exists) {
   *   console.log('Event already processed, skipping');
   *   return;
   * }
   */
  async checkEventProcessed(eventId: string): Promise<IdempotencyCheckResult> {
    try {
      if (!eventId || typeof eventId !== 'string') {
        return {
          exists: false,
          shouldProcess: false,
          details: {
            reason: 'Invalid event ID provided',
          },
        };
      }

      // Initialize client and use the database function for atomic check
      const { data, error } = await (
        await this.initializeClient()
      ).rpc('is_webhook_event_processed', {
        p_event_id: eventId,
      });

      if (error) {
        console.error('Idempotency check failed:', error);
        return {
          exists: false,
          shouldProcess: false,
          details: {
            reason: `Database error: ${error.message}`,
          },
        };
      }

      // If the function returns true, the event has been processed
      const exists = Boolean(data);

      return {
        exists,
        shouldProcess: !exists,
        details: {
          reason: exists ? 'Event already processed' : 'New event, safe to process',
        },
      };
    } catch (error) {
      console.error('Idempotency check error:', error);
      return {
        exists: false,
        shouldProcess: false,
        details: {
          reason: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      };
    }
  }

  /**
   * Record a new webhook event for idempotency and audit trail
   *
   * @param eventId - Razorpay event ID
   * @param eventType - Event type (e.g., 'subscription.activated')
   * @param accountId - Razorpay account ID
   * @param payload - Full webhook payload
   * @param signature - Webhook signature for verification
   * @returns Recording result
   *
   * @example
   const result = await idempotency.recordEvent(
   *   'evt_test123456',
   *   'subscription.activated',
   *   'acc_test789',
   *   webhookPayload,
   *   webhookSignature
   * );
   */
  async recordEvent(
    eventId: string,
    eventType: string,
    accountId?: string,
    payload?: any,
    signature?: string
  ): Promise<RecordEventResult> {
    try {
      if (!eventId || !eventType) {
        return {
          success: false,
          error: 'Event ID and event type are required',
        };
      }

      // Use the database function for atomic recording
      const { data, error } = await this.supababse.rpc('record_webhook_event', {
        p_event_id: eventId,
        p_event_type: eventType,
        p_account_id: accountId || null,
        p_payload: payload || {},
        p_signature: signature || null,
      });

      if (error) {
        // Check if this is a duplicate key error (event already exists)
        if (error.code === '23505' || error.message?.includes('duplicate')) {
          return {
            success: true,
            wasDuplicate: true,
            error: 'Event already exists (duplicate)',
          };
        }

        console.error('Failed to record webhook event:', error);
        return {
          success: false,
          error: `Database error: ${error.message}`,
        };
      }

      return {
        success: true,
        webhookId: data,
      };
    } catch (error) {
      console.error('Event recording error:', error);
      return {
        success: false,
        error: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Mark a webhook event as successfully processed
   *
   * @param eventId - Razorpay event ID
   * @param relatedSubscriptionId - Related subscription ID (optional)
   * @param relatedPaymentId - Related payment ID (optional)
   * @returns Update result
   *
   * @example
   * const result = await idempotency.markEventProcessed(
   *   'evt_test123456',
   *   'sub_abc789',
   *   'pay_def456'
   * );
   */
  async markEventProcessed(
    eventId: string,
    relatedSubscriptionId?: string,
    relatedPaymentId?: string
  ): Promise<UpdateEventStatusResult> {
    try {
      if (!eventId) {
        return {
          success: false,
          error: 'Event ID is required',
        };
      }

      // Use the database function for atomic update
      const { data, error } = await this.supababse.rpc('mark_webhook_processed', {
        p_event_id: eventId,
        p_related_subscription_id: relatedSubscriptionId || null,
        p_related_payment_id: relatedPaymentId || null,
      });

      if (error) {
        console.error('Failed to mark event as processed:', error);
        return {
          success: false,
          error: `Database error: ${error.message}`,
        };
      }

      const wasUpdated = Boolean(data);

      return {
        success: true,
        webhookId: eventId,
        wasUpdated,
      };
    } catch (error) {
      console.error('Event status update error:', error);
      return {
        success: false,
        error: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Mark a webhook event as failed with error details
   *
   * @param eventId - Razorpay event ID
   * @param errorMessage - Error message for debugging
   * @returns Update result
   *
   * @example
   * const result = await idempotency.markEventFailed(
   *   'evt_test123456',
   *   'Payment verification failed: Invalid signature'
   * );
   */
  async markEventFailed(eventId: string, errorMessage: string): Promise<UpdateEventStatusResult> {
    try {
      if (!eventId || !errorMessage) {
        return {
          success: false,
          error: 'Event ID and error message are required',
        };
      }

      // Use the database function for atomic update
      const { data, error } = await this.supababse.rpc('mark_webhook_failed', {
        p_event_id: eventId,
        p_error_message: errorMessage,
      });

      if (error) {
        console.error('Failed to mark event as failed:', error);
        return {
          success: false,
          error: `Database error: ${error.message}`,
        };
      }

      const wasUpdated = Boolean(data);

      return {
        success: true,
        webhookId: eventId,
        wasUpdated,
      };
    } catch (error) {
      console.error('Event failure marking error:', error);
      return {
        success: false,
        error: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Get webhook event by event ID
   *
   * @param eventId - Razorpay event ID
   * @returns Webhook event record or null if not found
   *
   * @example
   * const event = await idempotency.getWebhookEvent('evt_test123456');
   * if (event) {
   *   console.log('Event status:', event.processingStatus);
   * }
   */
  async getWebhookEvent(eventId: string): Promise<WebhookEventRecord | null> {
    try {
      if (!eventId) {
        return null;
      }

      const { data, error } = await (await this.initializeClient())
        .from('webhook_events')
        .select('*')
        .eq('event_id', eventId)
        .single();

      if (error) {
        console.error('Failed to get webhook event:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Webhook event retrieval error:', error);
      return null;
    }
  }

  /**
   * Get webhook events by processing status
   *
   * @param status - Processing status to filter by
   * @param limit - Maximum number of events to return
   * @returns Array of webhook events
   *
   * @example
   * const pendingEvents = await idempotency.getEventsByStatus('pending', 50);
   * console.log(`Found ${pendingEvents.length} pending events`);
   */
  async getEventsByStatus(status: string, limit: number = 100): Promise<WebhookEventRecord[]> {
    try {
      const { data, error } = await (await this.initializeClient())
        .from('webhook_events')
        .select('*')
        .eq('processing_status', status)
        .order('created_at', 'desc')
        .limit(limit);

      if (error) {
        console.error('Failed to get events by status:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Events by status retrieval error:', error);
      return [];
    }
  }

  /**
   * Get webhook events by event type
   *
   * @param eventType - Event type to filter by
   * @param limit - Maximum number of events to return
   * @returns Array of webhook events
   *
   * @example
   * const subscriptionEvents = await idempotency.getEventsByType('subscription.activated', 50);
   */
  async getEventsByType(eventType: string, limit: number = 100): Promise<WebhookEventRecord[]> {
    try {
      const { data, error } = await (await this.initializeClient())
        .from('webhook_events')
        .select('*')
        .eq('event_type', eventType)
        .order('created_at', 'desc')
        .limit(limit);

      if (error) {
        console.error('Failed to get events by type:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Events by type retrieval error:', error);
      return [];
    }
  }

  /**
   * Get webhook statistics for monitoring
   *
   * @returns Webhook event statistics
   *
   * @example
   * const stats = await idempotency.getWebhookStatistics();
   * console.log(`Success rate: ${(stats.processedEvents / stats.totalEvents * 100).toFixed(2)}%`);
   */
  async getWebhookStatistics(): Promise<WebhookEventStats> {
    try {
      // Use the database function for statistics
      const { data, error } = await (await this.initializeClient()).rpc('get_webhook_statistics');

      if (error) {
        console.error('Failed to get webhook statistics:', error);
        return this.getFallbackStatistics();
      }

      const stats = data?.[0] || {};

      return {
        totalEvents: stats.total_events || 0,
        processedEvents: stats.processed_events || 0,
        pendingEvents: stats.pending_events || 0,
        failedEvents: stats.failed_events || 0,
        duplicateEvents: 0, // Not directly tracked in the DB function
        averageProcessingTime: stats.average_processing_time_seconds
          ? Number(stats.average_processing_time_seconds)
          : undefined,
        eventsByType: stats.events_by_type || {},
      };
    } catch (error) {
      console.error('Webhook statistics retrieval error:', error);
      return this.getFallbackStatistics();
    }
  }

  /**
   * Get unprocessed webhooks for retry processing
   *
   * @param limit - Maximum number of events to return
   * @returns Array of unprocessed webhook events
   *
   * @example
   * const unprocessed = await idempotency.getUnprocessedWebhooks(10);
   * for (const event of unprocessed) {
   *   // Retry processing the event
   * }
   */
  async getUnprocessedWebhooks(limit: number = 10): Promise<WebhookEventRecord[]> {
    try {
      // Use the database function for unprocessed webhooks
      const { data, error } = await this.supababse.rpc('get_unprocessed_webhooks', {
        p_limit: limit,
      });

      if (error) {
        console.error('Failed to get unprocessed webhooks:', error);
        return [];
      }

      // Map the database result to our interface
      return (data || []).map((row: any) => ({
        id: row.id,
        eventId: row.event_id,
        eventType: row.event_type,
        accountId: row.account_id,
        payload: row.payload,
        processingStatus: 'failed', // From the WHERE clause
        processingAttempts: row.processing_attempts,
        processingError: row.processing_error,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        // Add default values for missing fields
        processingStartedAt: null,
        processedAt: null,
        signatureVerified: false,
        signature: null,
        relatedSubscriptionId: null,
        relatedPaymentId: null,
      }));
    } catch (error) {
      console.error('Unprocessed webhooks retrieval error:', error);
      return [];
    }
  }

  /**
   * Clean up old webhook events (maintenance function)
   *
   * @param daysToKeep - Number of days to keep events
   * @returns Cleanup result
   *
   * @example
   * const result = await idempotency.cleanupOldEvents(30);
   * console.log(`Cleaned up ${result.deletedCount} old events`);
   */
  async cleanupOldEvents(daysToKeep: number = 30): Promise<{
    success: boolean;
    deletedCount?: number;
    error?: string;
  }> {
    try {
      if (daysToKeep < 1) {
        return {
          success: false,
          error: 'Days to keep must be at least 1',
        };
      }

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const { error } = await (await this.initializeClient())
        .from('webhook_events')
        .delete()
        .lt('created_at', cutoffDate.toISOString());

      if (error) {
        console.error('Failed to cleanup old webhook events:', error);
        return {
          success: false,
          error: `Database error: ${error.message}`,
        };
      }

      // Note: Supabase doesn't return the count of deleted records in the response
      // We would need to count before deletion if we need this information

      return {
        success: true,
      };
    } catch (error) {
      console.error('Event cleanup error:', error);
      return {
        success: false,
        error: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Fallback statistics calculation (when database function fails)
   */
  private async getFallbackStatistics(): Promise<WebhookEventStats> {
    try {
      const { data, error } = await (await this.initializeClient())
        .from('webhook_events')
        .select('processing_status')
        .order('created_at', 'desc');

      if (error || !data) {
        return {
          totalEvents: 0,
          processedEvents: 0,
          pendingEvents: 0,
          failedEvents: 0,
          duplicateEvents: 0,
          eventsByType: {},
        };
      }

      const stats = data.reduce(
        (acc, event) => {
          acc.totalEvents++;
          switch (event.processing_status) {
            case 'processed':
              acc.processedEvents++;
              break;
            case 'pending':
              acc.pendingEvents++;
              break;
            case 'failed':
              acc.failedEvents++;
              break;
          }
          return acc;
        },
        {
          totalEvents: 0,
          processedEvents: 0,
          pendingEvents: 0,
          failedEvents: 0,
          duplicateEvents: 0,
          eventsByType: {},
        }
      );

      return stats;
    } catch (error) {
      console.error('Fallback statistics calculation error:', error);
      return {
        totalEvents: 0,
        processedEvents: 0,
        pendingEvents: 0,
        failedEvents: 0,
        duplicateEvents: 0,
        eventsByType: {},
      };
    }
  }
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Create a webhook idempotency service instance
 *
 * @returns Configured idempotency service
 *
 * @example
 * const idempotency = createWebhookIdempotencyService();
 * const check = await idempotency.checkEventProcessed('evt_test123456');
 */
export function createWebhookIdempotencyService(): WebhookIdempotencyService {
  return new WebhookIdempotencyService();
}

// ============================================================================
// Default Export
// ============================================================================

// Remove module-level instantiation to avoid cookies context error
// export const idempotencyService = createWebhookIdempotencyService();
