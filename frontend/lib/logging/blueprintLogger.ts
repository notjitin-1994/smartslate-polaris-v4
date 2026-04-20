/**
 * Enhanced Blueprint Generation Logger
 * Provides comprehensive logging for debugging data loss issues
 */

import { createServiceLogger } from '@/lib/logging';

const logger = createServiceLogger('blueprint-debug');

export interface LogContext {
  blueprintId?: string;
  userId?: string;
  model?: string;
  phase?: string;
  [key: string]: any;
}

/**
 * Log the complete data flow for debugging
 */
export function logDataFlow(stage: string, data: any, context: LogContext = {}) {
  const dataSize = JSON.stringify(data).length;
  const preview = JSON.stringify(data).substring(0, 500);

  logger.info(`data-flow.${stage}`, `Data at stage: ${stage}`, {
    ...context,
    dataSize,
    dataPreview: preview,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Log LLM request details
 */
export function logLLMRequest(
  provider: string,
  model: string,
  promptSize: number,
  maxTokens: number,
  context: LogContext = {}
) {
  logger.info('llm.request', 'Sending request to LLM', {
    ...context,
    provider,
    model,
    promptSize,
    maxTokens,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Log LLM response details
 */
export function logLLMResponse(
  provider: string,
  model: string,
  responseSize: number,
  stopReason: string,
  tokens: { input: number; output: number },
  context: LogContext = {}
) {
  logger.info('llm.response', 'Received response from LLM', {
    ...context,
    provider,
    model,
    responseSize,
    stopReason,
    inputTokens: tokens.input,
    outputTokens: tokens.output,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Log validation results
 */
export function logValidation(
  stage: string,
  isValid: boolean,
  errors: string[],
  warnings: string[],
  context: LogContext = {}
) {
  const level = isValid ? 'info' : 'error';

  logger[level](`validation.${stage}`, `Validation at ${stage}`, {
    ...context,
    isValid,
    errorCount: errors.length,
    warningCount: warnings.length,
    errors: errors.slice(0, 5), // Limit to first 5 errors
    warnings: warnings.slice(0, 5), // Limit to first 5 warnings
    timestamp: new Date().toISOString(),
  });
}

/**
 * Log data transformation
 */
export function logTransformation(
  operation: string,
  beforeSize: number,
  afterSize: number,
  context: LogContext = {}
) {
  const reduction = (((beforeSize - afterSize) / beforeSize) * 100).toFixed(1);

  logger.info(`transform.${operation}`, `Data transformation: ${operation}`, {
    ...context,
    beforeSize,
    afterSize,
    reduction: `${reduction}%`,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Log error with full context
 */
export function logError(operation: string, error: Error, context: LogContext = {}) {
  logger.error(`error.${operation}`, error.message, {
    ...context,
    errorName: error.name,
    errorStack: error.stack,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Log performance metrics
 */
export function logPerformance(
  operation: string,
  duration: number,
  success: boolean,
  context: LogContext = {}
) {
  logger.info(`performance.${operation}`, `Operation ${operation} completed`, {
    ...context,
    duration,
    success,
    durationSeconds: (duration / 1000).toFixed(2),
    timestamp: new Date().toISOString(),
  });
}

/**
 * Log cache operations
 */
export function logCache(
  operation: 'hit' | 'miss' | 'save',
  key: string,
  context: LogContext = {}
) {
  logger.info(`cache.${operation}`, `Cache ${operation} for key`, {
    ...context,
    operation,
    cacheKey: key.substring(0, 50), // Truncate long keys
    timestamp: new Date().toISOString(),
  });
}

/**
 * Log data integrity check
 */
export function logIntegrityCheck(dataType: string, issues: string[], context: LogContext = {}) {
  const level = issues.length > 0 ? 'warn' : 'info';

  logger[level]('integrity.check', `Data integrity check for ${dataType}`, {
    ...context,
    dataType,
    issueCount: issues.length,
    issues: issues.slice(0, 10), // Limit to first 10 issues
    timestamp: new Date().toISOString(),
  });
}

/**
 * Create a workflow tracer for the entire blueprint generation
 */
export class WorkflowTracer {
  private steps: Array<{
    step: string;
    timestamp: string;
    duration?: number;
    data?: any;
    error?: string;
  }> = [];
  private startTime: number;
  private context: LogContext;

  constructor(context: LogContext) {
    this.context = context;
    this.startTime = Date.now();
  }

  addStep(step: string, data?: any, error?: string) {
    const timestamp = new Date().toISOString();
    const duration = Date.now() - this.startTime;

    this.steps.push({
      step,
      timestamp,
      duration,
      data: data ? JSON.stringify(data).substring(0, 200) : undefined,
      error,
    });

    logger.info('workflow.step', `Workflow step: ${step}`, {
      ...this.context,
      step,
      stepNumber: this.steps.length,
      duration,
      hasError: !!error,
    });
  }

  complete(success: boolean, result?: any) {
    const totalDuration = Date.now() - this.startTime;

    logger.info('workflow.complete', 'Workflow completed', {
      ...this.context,
      success,
      totalDuration,
      totalSteps: this.steps.length,
      steps: this.steps.map((s) => ({
        step: s.step,
        duration: s.duration,
        hasError: !!s.error,
      })),
      result: result ? JSON.stringify(result).substring(0, 500) : undefined,
    });

    return {
      success,
      duration: totalDuration,
      steps: this.steps,
      result,
    };
  }

  getSteps() {
    return this.steps;
  }
}
