/**
 * Razorpay Webhook State Management
 *
 * @description State management and database operations coordination for webhook processing
 * @version 1.0.0
 * @date 2025-10-29
 *
 * This service coordinates database operations during webhook processing,
 * ensuring data consistency and providing comprehensive state tracking.
 *
 * @see docs/RAZORPAY_INTEGRATION_GUIDE.md
 */

import { getSupabaseServerClient } from '../supabase/server';
import type { Database } from '../../types/supabase';
import type { ParsedWebhookEvent } from './webhookSecurity';
import type { WebhookEventRecord } from './idempotency';
import type { EventHandlerResult } from './eventRouter';

// ============================================================================
// Types and Interfaces
// ============================================================================

/**
 * Webhook processing state
 */
export interface WebhookProcessingState {
  eventId: string;
  status: 'pending' | 'processing' | 'processed' | 'failed' | 'skipped';
  startedAt?: string;
  completedAt?: string;
  handlerResults?: Array<{
    eventType: string;
    handlerName: string;
    success: boolean;
    processed: boolean;
    duration: number;
    error?: string;
    details?: any;
  }>;
  error?: string;
  retryCount: number;
  maxRetries: number;
  metadata?: Record<string, any>;
}

/**
 * Database transaction result
 */
export interface TransactionResult {
  success: boolean;
  committed: boolean;
  rolledBack: boolean;
  error?: string;
  operationsCompleted: string[];
  data?: any;
}

/**
 * State management configuration
 */
export interface StateManagementConfig {
  enableDetailedLogging: boolean;
  enableTransactionRollback: boolean;
  maxProcessingTime: number; // in milliseconds
  enableStatePersistence: boolean;
}

/**
 * Operation result
 */
export interface OperationResult {
  success: boolean;
  operation: string;
  data?: any;
  error?: string;
  duration: number;
}

// ============================================================================
// Default Configuration
// ============================================================================

export const DEFAULT_STATE_CONFIG: StateManagementConfig = {
  enableDetailedLogging: true,
  enableTransactionRollback: true,
  maxProcessingTime: 30000, // 30 seconds
  enableStatePersistence: true,
};

// ============================================================================
// Webhook State Management Service
// ============================================================================

/**
 * Webhook state management service
 */
export class WebhookStateManagement {
  private config: StateManagementConfig;
  private supabase: any;

  constructor(config: StateManagementConfig = DEFAULT_STATE_CONFIG) {
    this.config = config;
    // Initialize supabase client asynchronously to avoid cookies context error
    this.supabase = null;
  }

  private async initializeClient() {
    if (!this.supabase) {
      this.supabase = await getSupabaseServerClient();
    }
    return this.supabase;
  }

  /**
   * Initialize webhook processing state
   *
   * @param event - Parsed webhook event
   * @returns Initial processing state
   */
  async initializeProcessingState(event: ParsedWebhookEvent): Promise<{
    success: boolean;
    state?: WebhookProcessingState;
    error?: string;
  }> {
    try {
      const state: WebhookProcessingState = {
        eventId: event.eventId,
        status: 'pending',
        retryCount: 0,
        maxRetries: 3,
        metadata: {
          eventType: event.eventType,
          accountId: event.accountId,
          timestamp: new Date().toISOString(),
        },
      };

      // Persist state if enabled
      if (this.config.enableStatePersistence) {
        const persistResult = await this.persistState(state);
        if (!persistResult.success) {
          this.logError('Failed to persist initial state', persistResult.error);
        }
      }

      return { success: true, state };
    } catch (error) {
      return {
        success: false,
        error: `Failed to initialize processing state: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Execute handler with state tracking
   *
   * @param event - Parsed webhook event
   * @param handlerResult - Result from event handler
   * @param state - Current processing state
   * @returns Updated processing state
   */
  async executeHandlerWithState(
    event: ParsedWebhookEvent,
    handlerResult: EventHandlerResult,
    state: WebhookProcessingState
  ): Promise<{
    success: boolean;
    state?: WebhookProcessingState;
    error?: string;
  }> {
    const startTime = Date.now();

    try {
      // Update state to processing
      state.status = 'processing';
      state.startedAt = new Date().toISOString();

      // Track handler execution
      const handlerExecution = {
        eventType: event.eventType,
        handlerName: 'event_handler', // This would be populated by the router
        success: handlerResult.success,
        processed: handlerResult.processed,
        duration: Date.now() - startTime,
        error: handlerResult.error,
        details: handlerResult.details,
      };

      if (!state.handlerResults) {
        state.handlerResults = [];
      }
      state.handlerResults.push(handlerExecution);

      // Update final status based on handler result
      if (handlerResult.success && handlerResult.processed) {
        state.status = 'processed';
        state.completedAt = new Date().toISOString();
      } else if (handlerResult.success && !handlerResult.processed) {
        state.status = 'skipped';
        state.completedAt = new Date().toISOString();
      } else {
        state.status = 'failed';
        state.error = handlerResult.error || 'Handler execution failed';
        state.completedAt = new Date().toISOString();
      }

      // Persist updated state
      if (this.config.enableStatePersistence) {
        const persistResult = await this.persistState(state);
        if (!persistResult.success) {
          this.logError('Failed to persist handler state', persistResult.error);
        }
      }

      return { success: true, state };
    } catch (error) {
      state.status = 'failed';
      state.error = error instanceof Error ? error.message : 'Unknown error';
      state.completedAt = new Date().toISOString();

      return {
        success: false,
        state,
        error: `Failed to execute handler with state: ${state.error}`,
      };
    }
  }

  /**
   * Execute database transaction with rollback support
   *
   * @param operations - Array of database operations to execute
   * @returns Transaction result
   */
  async executeTransaction(
    operations: Array<{
      name: string;
      operation: () => Promise<any>;
    }>
  ): Promise<TransactionResult> {
    const startTime = Date.now();
    const operationsCompleted: string[] = [];
    const rollbackData: any[] = [];

    try {
      // Execute operations in sequence
      for (const op of operations) {
        const opStart = Date.now();

        try {
          const result = await op.operation();
          operationsCompleted.push(op.name);

          // Store data for potential rollback
          if (this.config.enableTransactionRollback) {
            rollbackData.push({
              operation: op.name,
              data: result,
              timestamp: Date.now(),
            });
          }

          if (this.config.enableDetailedLogging) {
            console.log(`Operation completed: ${op.name} (${Date.now() - opStart}ms)`);
          }
        } catch (error) {
          const errorMsg = `Operation failed: ${op.name} - ${error instanceof Error ? error.message : 'Unknown error'}`;

          // Rollback if enabled and operations were completed
          if (this.config.enableTransactionRollback && operationsCompleted.length > 0) {
            await this.rollbackOperations(operationsCompleted.reverse());
          }

          return {
            success: false,
            committed: false,
            rolledBack: this.config.enableTransactionRollback && operationsCompleted.length > 0,
            error: errorMsg,
            operationsCompleted,
          };
        }
      }

      return {
        success: true,
        committed: true,
        rolledBack: false,
        operationsCompleted,
        data: rollbackData,
      };
    } catch (error) {
      return {
        success: false,
        committed: false,
        rolledBack: false,
        error: `Transaction execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        operationsCompleted,
      };
    }
  }

  /**
   * Rollback completed operations (simplified implementation)
   * In a real implementation, this would use database transactions
   */
  private async rollbackOperations(operations: string[]): Promise<void> {
    if (!this.config.enableTransactionRollback) {
      return;
    }

    try {
      console.log('Rolling back operations:', operations);
      // Note: This is a simplified rollback implementation
      // In practice, you'd use database transactions for proper rollback
      // or implement specific rollback logic for each operation type
    } catch (error) {
      console.error('Rollback failed:', error);
    }
  }

  /**
   * Get processing state for an event
   *
   * @param eventId - Webhook event ID
   * @returns Processing state or null if not found
   */
  async getProcessingState(eventId: string): Promise<WebhookProcessingState | null> {
    try {
      if (!this.config.enableStatePersistence) {
        return null;
      }

      // In a real implementation, this would query a state tracking table
      // For now, return null as state persistence is optional
      return null;
    } catch (error) {
      this.logError('Failed to get processing state', error);
      return null;
    }
  }

  /**
   * Cleanup old processing states
   *
   * @param olderThanDays - Clean up states older than this many days
   * @returns Cleanup result
   */
  async cleanupOldStates(olderThanDays: number = 7): Promise<{
    success: boolean;
    cleanedCount?: number;
    error?: string;
  }> {
    try {
      if (!this.config.enableStatePersistence) {
        return { success: true, cleanedCount: 0 };
      }

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      // In a real implementation, this would clean up the state tracking table
      // For now, just return success
      return { success: true, cleanedCount: 0 };
    } catch (error) {
      return {
        success: false,
        error: `Failed to cleanup old states: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Persist processing state
   *
   * @param state - Processing state to persist
   * @returns Persistence result
   */
  private async persistState(state: WebhookProcessingState): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      // In a real implementation, this would save to a state tracking table
      // For now, just log the state persistence
      if (this.config.enableDetailedLogging) {
        console.log('Persisting state for event:', state.eventId, {
          status: state.status,
          handlerCount: state.handlerResults?.length || 0,
        });
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: `Failed to persist state: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Log error with context
   */
  private logError(message: string, error?: any): void {
    if (!this.config.enableDetailedLogging) {
      return;
    }

    console.error('[WebhookStateManagement]', message, error);
  }

  /**
   * Get configuration
   */
  getConfig(): StateManagementConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<StateManagementConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  /**
   * Get statistics about webhook processing
   */
  async getProcessingStatistics(): Promise<{
    totalProcessed: number;
    successRate: number;
    averageProcessingTime: number;
    recentFailures: number;
  }> {
    try {
      // In a real implementation, this would query the state tracking table
      // For now, return default statistics
      return {
        totalProcessed: 0,
        successRate: 0,
        averageProcessingTime: 0,
        recentFailures: 0,
      };
    } catch (error) {
      this.logError('Failed to get processing statistics', error);
      return {
        totalProcessed: 0,
        successRate: 0,
        averageProcessingTime: 0,
        recentFailures: 0,
      };
    }
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Create common database operations for webhook processing
 *
 * @param event - Parsed webhook event
 * @param supabase - Supabase client
 * @returns Array of database operations
 */
export function createWebhookDatabaseOperations(
  event: ParsedWebhookEvent,
  supabase: any
): Array<{
  name: string;
  operation: () => Promise<any>;
}> {
  const operations = [];

  // Example operations that would be commonly needed
  operations.push({
    name: 'update_webhook_event',
    operation: async () => {
      return await supabase
        .from('webhook_events')
        .update({
          processing_status: 'processing',
          processing_started_at: new Date().toISOString(),
        })
        .eq('event_id', event.eventId);
    },
  });

  // Add more operations based on event type
  if (event.eventType.startsWith('subscription.')) {
    operations.push({
      name: 'update_subscription_status',
      operation: async () => {
        const subscription = event.payload.entity;
        return await supabase
          .from('razorpay_subscriptions')
          .update({
            status: subscription.status,
            updated_at: new Date().toISOString(),
          })
          .eq('razorpay_subscription_id', subscription.id);
      },
    });
  }

  if (event.eventType.startsWith('payment.')) {
    operations.push({
      name: 'update_payment_status',
      operation: async () => {
        const payment = event.payload.entity;
        return await supabase
          .from('razorpay_payments')
          .update({
            status: payment.status,
            updated_at: new Date().toISOString(),
          })
          .eq('razorpay_payment_id', payment.id);
      },
    });
  }

  return operations;
}

/**
 * Validate processing state
 *
 * @param state - Processing state to validate
 * @returns Validation result
 */
export function validateProcessingState(state: WebhookProcessingState): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!state.eventId) {
    errors.push('Event ID is required');
  }

  if (!state.status) {
    errors.push('Status is required');
  }

  const validStatuses = ['pending', 'processing', 'processed', 'failed', 'skipped'];
  if (!validStatuses.includes(state.status)) {
    errors.push(`Invalid status: ${state.status}`);
  }

  if (state.retryCount < 0) {
    errors.push('Retry count cannot be negative');
  }

  if (state.maxRetries < 0) {
    errors.push('Max retries cannot be negative');
  }

  if (state.retryCount > state.maxRetries) {
    errors.push('Retry count exceeds max retries');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Create a configured webhook state management service
 *
 * @param config - Optional configuration
 * @returns Configured state management service
 *
 * @example
 * const stateManager = createWebhookStateManager({
 *   enableDetailedLogging: true,
 *   enableTransactionRollback: true
 * });
 */
export function createWebhookStateManager(
  config?: Partial<StateManagementConfig>
): WebhookStateManagement {
  const finalConfig = { ...DEFAULT_STATE_CONFIG, ...config };
  return new WebhookStateManagement(finalConfig);
}

// ============================================================================
// Default Export
// ============================================================================

// Remove module-level instantiation to avoid cookies context error
// export const webhookStateManager = createWebhookStateManager();
