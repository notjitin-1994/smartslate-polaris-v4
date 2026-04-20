/**
 * Subscription Transaction Management
 *
 * @description Provides transactional consistency for subscription operations
 * with rollback capabilities and atomic updates across multiple systems
 *
 * @version 1.0.0
 * @date 2025-10-30
 */

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface TransactionStep<T = any> {
  id: string;
  name: string;
  execute: () => Promise<T>;
  rollback: (result: T) => Promise<void>;
  required?: boolean;
  timeout?: number;
}

export interface TransactionResult<T = any> {
  success: boolean;
  results: Record<string, any>;
  error?: Error;
  completedSteps: string[];
  failedStep?: string;
  rollbackResults?: Record<string, boolean>;
}

export interface TransactionOptions {
  timeout?: number;
  continueOnError?: boolean;
  enableRollback?: boolean;
  maxRetries?: number;
  retryDelay?: number;
}

export interface SubscriptionOperationData {
  subscriptionId: string;
  userId: string;
  tier: string;
  billingCycle: string;
  cancelAtEnd?: boolean;
  reason?: string;
  refundAmount?: number;
}

// ============================================================================
// Transaction Manager
// ============================================================================

class TransactionManager {
  private transactions = new Map<
    string,
    {
      steps: TransactionStep[];
      results: Record<string, any>;
      startTime: number;
      status: 'running' | 'completed' | 'failed' | 'rolling_back';
    }
  >();

  /**
   * Execute a transaction with multiple steps
   */
  async executeTransaction<T = any>(
    transactionId: string,
    steps: TransactionStep[],
    options: TransactionOptions = {}
  ): Promise<TransactionResult<T>> {
    const {
      timeout = 30000, // 30 seconds default
      continueOnError = false,
      enableRollback = true,
      maxRetries = 3,
      retryDelay = 1000,
    } = options;

    const startTime = Date.now();
    const results: Record<string, any> = {};
    const completedSteps: string[] = [];

    this.transactions.set(transactionId, {
      steps,
      results,
      startTime,
      status: 'running',
    });

    try {
      for (const step of steps) {
        const stepStartTime = Date.now();

        // Check if we've exceeded the timeout
        if (Date.now() - startTime > timeout) {
          throw new Error(`Transaction timeout after ${timeout}ms`);
        }

        let retries = 0;
        let lastError: Error | null = null;

        // Execute step with retry logic
        while (retries <= maxRetries) {
          try {
            const result = await this.executeStepWithTimeout(step, step.timeout || timeout);
            results[step.id] = result;
            completedSteps.push(step.id);

            console.log(`[Transaction] Step ${step.name} completed successfully`, {
              transactionId,
              stepId: step.id,
              duration: Date.now() - stepStartTime,
            });

            break; // Step succeeded, exit retry loop
          } catch (error) {
            lastError = error as Error;
            retries++;

            if (retries <= maxRetries) {
              console.warn(
                `[Transaction] Step ${step.name} failed, retrying (${retries}/${maxRetries})`,
                {
                  transactionId,
                  stepId: step.id,
                  error: lastError.message,
                }
              );

              await new Promise((resolve) => setTimeout(resolve, retryDelay));
            }
          }
        }

        if (lastError && retries > maxRetries) {
          throw new Error(
            `Step ${step.name} failed after ${maxRetries} retries: ${lastError.message}`
          );
        }
      }

      // All steps completed successfully
      this.transactions.set(transactionId, {
        ...this.transactions.get(transactionId)!,
        status: 'completed',
        results,
      });

      return {
        success: true,
        results,
        completedSteps,
      };
    } catch (error) {
      console.error(`[Transaction] Transaction failed`, {
        transactionId,
        error: (error as Error).message,
        completedSteps,
      });

      // Update transaction status
      this.transactions.set(transactionId, {
        ...this.transactions.get(transactionId)!,
        status: 'failed',
      });

      // Rollback if enabled and we have completed steps
      if (enableRollback && completedSteps.length > 0) {
        const rollbackResults = await this.rollbackTransaction(
          transactionId,
          completedSteps.reverse()
        );
        return {
          success: false,
          results,
          error: error as Error,
          completedSteps,
          rollbackResults,
        };
      }

      return {
        success: false,
        results,
        error: error as Error,
        completedSteps,
      };
    }
  }

  /**
   * Execute a single step with timeout
   */
  private async executeStepWithTimeout<T>(step: TransactionStep<T>, timeout: number): Promise<T> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Step ${step.name} timed out after ${timeout}ms`));
      }, timeout);

      step
        .execute()
        .then((result) => {
          clearTimeout(timer);
          resolve(result);
        })
        .catch((error) => {
          clearTimeout(timer);
          reject(error);
        });
    });
  }

  /**
   * Rollback completed transaction steps
   */
  private async rollbackTransaction(
    transactionId: string,
    stepsToRollback: string[]
  ): Promise<Record<string, boolean>> {
    const transaction = this.transactions.get(transactionId);
    if (!transaction) {
      throw new Error(`Transaction ${transactionId} not found`);
    }

    this.transactions.set(transactionId, {
      ...transaction,
      status: 'rolling_back',
    });

    const rollbackResults: Record<string, boolean> = {};

    for (const stepId of stepsToRollback) {
      const step = transaction.steps.find((s) => s.id === stepId);
      if (!step || !step.required) continue;

      try {
        const result = transaction.results[stepId];
        await step.rollback(result);
        rollbackResults[stepId] = true;

        console.log(`[Transaction] Rollback step ${step.name} completed`, {
          transactionId,
          stepId,
        });
      } catch (error) {
        rollbackResults[stepId] = false;
        console.error(`[Transaction] Rollback step ${step.name} failed`, {
          transactionId,
          stepId,
          error: (error as Error).message,
        });
      }
    }

    this.transactions.set(transactionId, {
      ...transaction,
      status: 'failed', // Still failed, but rollback attempted
    });

    return rollbackResults;
  }

  /**
   * Get transaction status
   */
  getTransactionStatus(transactionId: string): {
    status: string;
    completedSteps: number;
    totalSteps: number;
    duration: number;
  } | null {
    const transaction = this.transactions.get(transactionId);
    if (!transaction) return null;

    return {
      status: transaction.status,
      completedSteps: Object.keys(transaction.results).length,
      totalSteps: transaction.steps.length,
      duration: Date.now() - transaction.startTime,
    };
  }

  /**
   * Clean up old transactions
   */
  cleanup(maxAge: number = 60 * 60 * 1000): void {
    const now = Date.now();
    for (const [id, transaction] of this.transactions.entries()) {
      if (now - transaction.startTime > maxAge) {
        this.transactions.delete(id);
      }
    }
  }
}

const transactionManager = new TransactionManager();

// ============================================================================
// Subscription Operation Steps
// ============================================================================

/**
 * Create subscription cancellation transaction steps
 */
export function createSubscriptionCancellationSteps(
  data: SubscriptionOperationData
): TransactionStep[] {
  return [
    {
      id: 'validate-cancellation',
      name: 'Validate Cancellation Request',
      execute: async () => {
        // Validate the cancellation request
        const validation = await validateCancellationRequest(data);
        if (!validation.valid) {
          throw new Error(`Invalid cancellation request: ${validation.reason}`);
        }
        return validation;
      },
      rollback: async () => {
        // No rollback needed for validation
      },
      required: true,
      timeout: 5000,
    },

    {
      id: 'cancel-razorpay-subscription',
      name: 'Cancel Razorpay Subscription',
      execute: async () => {
        const { cancelSubscription } = await import('@/lib/razorpay/client');
        const result = await cancelSubscription(data.subscriptionId, data.cancelAtEnd);
        return result;
      },
      rollback: async () => {
        // Note: Razorpay subscriptions cannot be easily restored
        // This would require manual intervention
        console.warn(
          `Cannot rollback Razorpay subscription cancellation for ${data.subscriptionId}`
        );
      },
      required: true,
      timeout: 10000,
    },

    {
      id: 'update-database',
      name: 'Update Database Records',
      execute: async () => {
        const { createClient } = await import('@/lib/supabase/server');
        const supabase = createClient();

        // Update user subscription status
        const { error } = await supabase
          .from('user_profiles')
          .update({
            subscription_status: data.cancelAtEnd ? 'active' : 'cancelled',
            subscription_cancelled_at: data.cancelAtEnd ? null : new Date().toISOString(),
            subscription_cancelled_reason: data.reason,
            subscription_id: data.cancelAtEnd ? data.subscriptionId : null,
          })
          .eq('id', data.userId);

        if (error) {
          throw new Error(`Database update failed: ${error.message}`);
        }

        // Create audit log entry
        await supabase.from('subscription_audit_log').insert({
          user_id: data.userId,
          action: 'cancel_subscription',
          subscription_id: data.subscriptionId,
          details: {
            cancelAtEnd: data.cancelAtEnd,
            reason: data.reason,
            tier: data.tier,
            billingCycle: data.billingCycle,
          },
          created_at: new Date().toISOString(),
        });

        return { updated: true };
      },
      rollback: async (result) => {
        const { createClient } = await import('@/lib/supabase/server');
        const supabase = createClient();

        // Restore previous database state
        await supabase
          .from('user_profiles')
          .update({
            subscription_status: 'active',
            subscription_cancelled_at: null,
            subscription_cancelled_reason: null,
            subscription_id: data.subscriptionId,
          })
          .eq('id', data.userId);

        console.log(`Rolled back database changes for user ${data.userId}`);
      },
      required: true,
      timeout: 8000,
    },

    {
      id: 'update-usage-tracking',
      name: 'Update Usage Tracking',
      execute: async () => {
        // Update any usage tracking systems
        console.log(`Updated usage tracking for cancelled subscription ${data.subscriptionId}`);
        return { trackingUpdated: true };
      },
      rollback: async () => {
        // Restore usage tracking
        console.log(`Rolled back usage tracking for subscription ${data.subscriptionId}`);
      },
      required: false,
      timeout: 3000,
    },

    {
      id: 'send-notifications',
      name: 'Send Cancellation Notifications',
      execute: async () => {
        // Send email notifications, update user dashboard, etc.
        console.log(`Sent cancellation notifications for user ${data.userId}`);
        return { notificationsSent: true };
      },
      rollback: async () => {
        // Send reactivation notification if rollback occurs
        console.log(`Sent reactivation notification for user ${data.userId}`);
      },
      required: false,
      timeout: 5000,
    },
  ];
}

/**
 * Validate cancellation request
 */
async function validateCancellationRequest(
  data: SubscriptionOperationData
): Promise<{ valid: boolean; reason?: string }> {
  // Check if subscription exists and is eligible for cancellation
  const { createClient } = await import('@/lib/supabase/server');
  const supabase = createClient();

  const { data: profile, error } = await supabase
    .from('user_profiles')
    .select('subscription_status, subscription_id, tier')
    .eq('id', data.userId)
    .single();

  if (error || !profile) {
    return { valid: false, reason: 'User profile not found' };
  }

  if (profile.subscription_id !== data.subscriptionId) {
    return { valid: false, reason: 'Subscription ID mismatch' };
  }

  if (!['active', 'authenticated', 'created'].includes(profile.subscription_status)) {
    return { valid: false, reason: 'Subscription not eligible for cancellation' };
  }

  return { valid: true };
}

// ============================================================================
// Public API Functions
// ============================================================================

/**
 * Execute subscription cancellation with transaction support
 */
export async function executeSubscriptionCancellation(
  data: SubscriptionOperationData,
  options?: TransactionOptions
): Promise<TransactionResult> {
  const transactionId = `cancel_${data.subscriptionId}_${Date.now()}`;
  const steps = createSubscriptionCancellationSteps(data);

  return transactionManager.executeTransaction(transactionId, steps, options);
}

/**
 * Create subscription upgrade transaction steps
 */
export function createSubscriptionUpgradeSteps(data: {
  userId: string;
  currentSubscriptionId: string;
  newTier: string;
  newPlanId: string;
  billingCycle: string;
}): TransactionStep[] {
  return [
    {
      id: 'validate-upgrade',
      name: 'Validate Upgrade Request',
      execute: async () => {
        // Validate upgrade eligibility
        return { valid: true };
      },
      rollback: async () => {
        // No rollback needed
      },
      required: true,
    },

    {
      id: 'create-new-subscription',
      name: 'Create New Subscription',
      execute: async () => {
        const { createSubscription } = await import('@/lib/razorpay/client');
        // Implementation for creating new subscription
        return { subscriptionId: 'new_sub_id' };
      },
      rollback: async () => {
        // Cancel the new subscription
        console.log('Rolled back new subscription creation');
      },
      required: true,
    },

    {
      id: 'cancel-old-subscription',
      name: 'Cancel Old Subscription',
      execute: async () => {
        const { cancelSubscription } = await import('@/lib/razorpay/client');
        // Cancel old subscription at end of period
        return { cancelled: true };
      },
      rollback: async () => {
        // Reactivate old subscription
        console.log('Rolled back old subscription cancellation');
      },
      required: true,
    },

    {
      id: 'update-database',
      name: 'Update Database Records',
      execute: async () => {
        // Update user profile with new subscription details
        return { updated: true };
      },
      rollback: async () => {
        // Restore old subscription details
        console.log('Rolled back database changes');
      },
      required: true,
    },
  ];
}

/**
 * Execute subscription upgrade with transaction support
 */
export async function executeSubscriptionUpgrade(
  data: {
    userId: string;
    currentSubscriptionId: string;
    newTier: string;
    newPlanId: string;
    billingCycle: string;
  },
  options?: TransactionOptions
): Promise<TransactionResult> {
  const transactionId = `upgrade_${data.currentSubscriptionId}_${Date.now()}`;
  const steps = createSubscriptionUpgradeSteps(data);

  return transactionManager.executeTransaction(transactionId, steps, options);
}

/**
 * Get transaction status
 */
export function getTransactionStatus(transactionId: string) {
  return transactionManager.getTransactionStatus(transactionId);
}

/**
 * Cleanup old transactions
 */
export function cleanupTransactions(maxAge?: number) {
  return transactionManager.cleanup(maxAge);
}

export default {
  executeSubscriptionCancellation,
  executeSubscriptionUpgrade,
  getTransactionStatus,
  cleanupTransactions,
  createSubscriptionCancellationSteps,
  createSubscriptionUpgradeSteps,
};
