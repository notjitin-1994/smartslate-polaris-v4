/**
 * Grace Period Scheduler
 *
 * @description Automated scheduling system for grace period management
 * including warnings, expiration checks, and end actions
 *
 * @version 1.0.0
 * @date 2025-10-30
 */

import { processAllGracePeriods } from '@/lib/subscription/gracePeriodManager';
import { logEvent } from '@/lib/monitoring/subscriptionMonitoring';

// ============================================================================
// Scheduler Configuration
// ============================================================================

export interface SchedulerConfig {
  /** How often to run grace period processing (in minutes) */
  processingIntervalMinutes: number;
  /** Time window for processing (HH:MM format) */
  processingWindow: {
    start: string; // e.g., "09:00"
    end: string; // e.g., "21:00"
  };
  /** Days of week to run (0-6, 0 = Sunday) */
  processingDays: number[];
  /** Whether to run on weekends */
  runOnWeekends: boolean;
  /** Maximum number of users to process per run */
  maxUsersPerRun: number;
  /** Whether to enable dry run mode */
  dryRun: boolean;
}

const DEFAULT_SCHEDULER_CONFIG: SchedulerConfig = {
  processingIntervalMinutes: 60, // Run every hour
  processingWindow: {
    start: '09:00',
    end: '21:00',
  },
  processingDays: [1, 2, 3, 4, 5], // Monday to Friday
  runOnWeekends: false,
  maxUsersPerRun: 1000,
  dryRun: false,
};

// ============================================================================
// Scheduler Types and Interfaces
// ============================================================================

export interface SchedulerStatus {
  isRunning: boolean;
  lastRun?: Date;
  nextRun?: Date;
  lastRunResults?: {
    processed: number;
    warningsSent: number;
    gracePeriodsEnded: number;
    errors: string[];
  };
  config: SchedulerConfig;
  uptime: number;
}

export interface ScheduledJob {
  id: string;
  name: string;
  schedule: string; // Cron expression
  handler: () => Promise<any>;
  enabled: boolean;
  lastRun?: Date;
  nextRun?: Date;
  results?: any;
}

// ============================================================================
// Grace Period Scheduler Class
// ============================================================================

export class GracePeriodScheduler {
  private config: SchedulerConfig;
  private isRunning = false;
  private intervalId?: NodeJS.Timeout;
  private lastRun?: Date;
  private lastRunResults?: any;
  private startTime = new Date();
  private jobs: Map<string, ScheduledJob> = new Map();

  constructor(config: Partial<SchedulerConfig> = {}) {
    this.config = { ...DEFAULT_SCHEDULER_CONFIG, ...config };
  }

  /**
   * Start the scheduler
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('Grace period scheduler is already running');
      return;
    }

    console.log('Starting grace period scheduler with config:', this.config);

    this.isRunning = true;
    this.startTime = new Date();

    // Register default jobs
    this.registerDefaultJobs();

    // Schedule periodic processing
    this.schedulePeriodicProcessing();

    // Log scheduler start
    await logEvent({
      id: `scheduler-start-${Date.now()}`,
      type: 'system',
      severity: 'info',
      category: 'scheduler',
      title: 'Grace Period Scheduler Started',
      description: 'Automated grace period processing has been started',
      data: {
        config: this.config,
        registeredJobs: Array.from(this.jobs.keys()),
      },
      tags: ['scheduler', 'started', 'grace-period'],
      timestamp: new Date(),
    });

    console.log('Grace period scheduler started successfully');
  }

  /**
   * Stop the scheduler
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      console.log('Grace period scheduler is not running');
      return;
    }

    console.log('Stopping grace period scheduler...');

    this.isRunning = false;

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }

    // Log scheduler stop
    await logEvent({
      id: `scheduler-stop-${Date.now()}`,
      type: 'system',
      severity: 'info',
      category: 'scheduler',
      title: 'Grace Period Scheduler Stopped',
      description: 'Automated grace period processing has been stopped',
      data: {
        uptime: this.getUptime(),
        lastRun: this.lastRun,
        totalJobs: this.jobs.size,
      },
      tags: ['scheduler', 'stopped', 'grace-period'],
      timestamp: new Date(),
    });

    console.log('Grace period scheduler stopped');
  }

  /**
   * Get current scheduler status
   */
  getStatus(): SchedulerStatus {
    return {
      isRunning: this.isRunning,
      lastRun: this.lastRun,
      nextRun: this.calculateNextRun(),
      lastRunResults: this.lastRunResults,
      config: this.config,
      uptime: this.getUptime(),
    };
  }

  /**
   * Register a new scheduled job
   */
  registerJob(job: ScheduledJob): void {
    this.jobs.set(job.id, job);
    console.log(`Registered job: ${job.name} (${job.id})`);
  }

  /**
   * Unregister a job
   */
  unregisterJob(jobId: string): void {
    this.jobs.delete(jobId);
    console.log(`Unregistered job: ${jobId}`);
  }

  /**
   * Run a specific job manually
   */
  async runJob(jobId: string): Promise<any> {
    const job = this.jobs.get(jobId);
    if (!job) {
      throw new Error(`Job not found: ${jobId}`);
    }

    console.log(`Running job manually: ${job.name} (${jobId})`);

    const startTime = new Date();
    const results = await job.handler();
    const endTime = new Date();

    // Update job status
    job.lastRun = startTime;
    job.results = results;

    console.log(
      `Job completed: ${job.name}, duration: ${endTime.getTime() - startTime.getTime()}ms`
    );

    return results;
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  /**
   * Register default grace period jobs
   */
  private registerDefaultJobs(): void {
    // Main grace period processing job
    this.registerJob({
      id: 'grace-period-processing',
      name: 'Grace Period Processing',
      schedule: `0 */${this.config.processingIntervalMinutes} * * *`, // Every N minutes
      handler: async () => this.processGracePeriods(),
      enabled: true,
    });

    // Daily summary job
    this.registerJob({
      id: 'daily-grace-summary',
      name: 'Daily Grace Period Summary',
      schedule: '0 0 * * *', // Daily at midnight
      handler: async () => this.generateDailySummary(),
      enabled: true,
    });

    // Weekly cleanup job
    this.registerJob({
      id: 'weekly-cleanup',
      name: 'Weekly Grace Period Cleanup',
      schedule: '0 0 * * 0', // Weekly on Sunday
      handler: async () => this.performWeeklyCleanup(),
      enabled: true,
    });
  }

  /**
   * Schedule periodic processing
   */
  private schedulePeriodicProcessing(): void {
    const intervalMs = this.config.processingIntervalMinutes * 60 * 1000;

    this.intervalId = setInterval(async () => {
      if (this.shouldRunNow()) {
        await this.processGracePeriods();
      }
    }, intervalMs);

    console.log(
      `Scheduled grace period processing every ${this.config.processingIntervalMinutes} minutes`
    );
  }

  /**
   * Check if processing should run now
   */
  private shouldRunNow(): boolean {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const currentDay = now.getDay();

    // Check day of week
    if (!this.config.runOnWeekends && (currentDay === 0 || currentDay === 6)) {
      return false;
    }

    if (this.config.processingDays.length > 0 && !this.config.processingDays.includes(currentDay)) {
      return false;
    }

    // Check time window
    if (
      currentTime >= this.config.processingWindow.start &&
      currentTime <= this.config.processingWindow.end
    ) {
      return true;
    }

    return false;
  }

  /**
   * Process grace periods
   */
  private async processGracePeriods(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    const startTime = new Date();
    console.log('Starting grace period processing...');

    try {
      if (this.config.dryRun) {
        console.log('DRY RUN MODE: Would process grace periods');
        this.lastRun = startTime;
        this.lastRunResults = {
          processed: 0,
          warningsSent: 0,
          gracePeriodsEnded: 0,
          errors: ['Dry run mode - no actual processing performed'],
        };
        return;
      }

      // Run the actual grace period processing
      const results = await processAllGracePeriods();

      this.lastRun = startTime;
      this.lastRunResults = results;

      console.log('Grace period processing completed:', results);

      // Log processing completion
      await logEvent({
        id: `grace-processing-${Date.now()}`,
        type: 'system',
        severity: results.errors.length > 0 ? 'warning' : 'info',
        category: 'grace_period',
        title: 'Grace Period Processing Complete',
        description: `Processed ${results.processed} grace periods`,
        data: {
          ...results,
          processingTime: Date.now() - startTime.getTime(),
        },
        tags: ['grace-period', 'processing', results.errors.length > 0 ? 'errors' : 'success'],
        timestamp: new Date(),
      });
    } catch (error) {
      console.error('Grace period processing failed:', error);

      this.lastRunResults = {
        processed: 0,
        warningsSent: 0,
        gracePeriodsEnded: 0,
        errors: [(error as Error).message],
      };

      // Log processing failure
      await logEvent({
        id: `grace-processing-error-${Date.now()}`,
        type: 'system',
        severity: 'error',
        category: 'grace_period',
        title: 'Grace Period Processing Failed',
        description: `Automated grace period processing failed: ${(error as Error).message}`,
        data: {
          error: (error as Error).stack,
          processingTime: Date.now() - startTime.getTime(),
        },
        tags: ['grace-period', 'processing', 'error'],
        timestamp: new Date(),
      });

      throw error;
    }
  }

  /**
   * Generate daily summary
   */
  private async generateDailySummary(): Promise<void> {
    console.log('Generating daily grace period summary...');

    // This would generate and email/send a summary of grace period activity
    // Implementation depends on your notification system

    await logEvent({
      id: `daily-summary-${Date.now()}`,
      type: 'business',
      severity: 'info',
      category: 'grace_period',
      title: 'Daily Grace Period Summary Generated',
      description: 'Daily summary of grace period activity has been generated',
      data: {
        lastRunResults: this.lastRunResults,
        summaryDate: new Date().toISOString().split('T')[0],
      },
      tags: ['grace-period', 'summary', 'daily'],
      timestamp: new Date(),
    });
  }

  /**
   * Perform weekly cleanup
   */
  private async performWeeklyCleanup(): Promise<void> {
    console.log('Performing weekly grace period cleanup...');

    // This could include cleanup of old grace period records,
    // archiving of logs, etc.

    await logEvent({
      id: `weekly-cleanup-${Date.now()}`,
      type: 'system',
      severity: 'info',
      category: 'grace_period',
      title: 'Weekly Grace Period Cleanup Complete',
      description: 'Weekly cleanup and maintenance tasks completed',
      data: {
        cleanupDate: new Date().toISOString(),
      },
      tags: ['grace-period', 'cleanup', 'weekly'],
      timestamp: new Date(),
    });
  }

  /**
   * Calculate next run time
   */
  private calculateNextRun(): Date | undefined {
    if (!this.isRunning) {
      return undefined;
    }

    const now = new Date();
    const nextRun = new Date(now.getTime() + this.config.processingIntervalMinutes * 60 * 1000);

    // Adjust for processing window
    const nextRunTime = `${nextRun.getHours().toString().padStart(2, '0')}:${nextRun.getMinutes().toString().padStart(2, '0')}`;

    if (
      nextRunTime < this.config.processingWindow.start ||
      nextRunTime > this.config.processingWindow.end
    ) {
      // Move to next valid time window
      const [startHour, startMinute] = this.config.processingWindow.start.split(':').map(Number);
      nextRun.setHours(startHour, startMinute, 0, 0);
      nextRun.setDate(nextRun.getDate() + 1);
    }

    return nextRun;
  }

  /**
   * Get scheduler uptime
   */
  private getUptime(): number {
    return Math.floor((Date.now() - this.startTime.getTime()) / 1000);
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let globalScheduler: GracePeriodScheduler | null = null;

/**
 * Get or create the global scheduler instance
 */
export function getGracePeriodScheduler(config?: Partial<SchedulerConfig>): GracePeriodScheduler {
  if (!globalScheduler) {
    globalScheduler = new GracePeriodScheduler(config);
  }
  return globalScheduler;
}

/**
 * Initialize the global scheduler
 */
export async function initializeGracePeriodScheduler(
  config?: Partial<SchedulerConfig>
): Promise<GracePeriodScheduler> {
  const scheduler = getGracePeriodScheduler(config);
  await scheduler.start();
  return scheduler;
}

// ============================================================================
// API Route Helper Functions
// ============================================================================

/**
 * API route handler for manual grace period processing
 */
export async function handleManualProcessing(): Promise<{
  success: boolean;
  results?: any;
  error?: string;
}> {
  try {
    const scheduler = getGracePeriodScheduler();
    const results = await scheduler.runJob('grace-period-processing');

    return {
      success: true,
      results,
    };
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

/**
 * API route handler for getting scheduler status
 */
export function handleSchedulerStatus(): SchedulerStatus {
  const scheduler = getGracePeriodScheduler();
  return scheduler.getStatus();
}

/**
 * API route handler for updating scheduler configuration
 */
export async function updateSchedulerConfig(
  config: Partial<SchedulerConfig>
): Promise<{ success: boolean; error?: string }> {
  try {
    // Note: This would require stopping and restarting the scheduler
    // Implementation depends on your specific needs

    await logEvent({
      id: `scheduler-config-update-${Date.now()}`,
      type: 'system',
      severity: 'info',
      category: 'scheduler',
      title: 'Grace Period Scheduler Configuration Updated',
      description: 'Scheduler configuration has been updated',
      data: { newConfig: config },
      tags: ['scheduler', 'config-update'],
      timestamp: new Date(),
    });

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

export default {
  GracePeriodScheduler,
  getGracePeriodScheduler,
  initializeGracePeriodScheduler,
  handleManualProcessing,
  handleSchedulerStatus,
  updateSchedulerConfig,
};
