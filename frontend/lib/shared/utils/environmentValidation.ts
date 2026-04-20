/**
 * Environment Validation Module
 *
 * Validates required environment variables at application startup with fail-fast behavior.
 * Uses Zod for schema validation and provides detailed error messages.
 *
 * @module lib/utils/environmentValidation
 */

import { z } from 'zod';

/**
 * Custom error class for environment validation failures
 */
export class EnvironmentValidationError extends Error {
  constructor(
    message: string,
    public readonly missingVars: string[] = [],
    public readonly invalidVars: string[] = []
  ) {
    super(message);
    this.name = 'EnvironmentValidationError';
  }
}

/**
 * Environment variable schema for Gemini AI SDK
 * Defines required and optional environment variables with validation rules
 */
const envSchema = z.object({
  // Required: Anthropic API Key for Gemini models
  GOOGLE_GENERATIVE_AI_API_KEY: z
    .string()
    .min(1, 'GOOGLE_GENERATIVE_AI_API_KEY is required')
    .refine((val) => val.startsWith('sk-ant-'), 'GOOGLE_GENERATIVE_AI_API_KEY must start with "sk-ant-"')
    .optional(),

  // Optional: Enable AI SDK (default: false)
  NEXT_PUBLIC_USE_AI_SDK: z
    .string()
    .optional()
    .default('false')
    .transform((val) => val === 'true'),

  // Optional: AI SDK Log Level
  AI_SDK_LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).optional().default('info'),

  // Optional: AI SDK Timeout
  AI_SDK_TIMEOUT_MS: z
    .string()
    .optional()
    .default('60000')
    .transform((val) => parseInt(val, 10))
    .refine((val) => val > 0 && val <= 600000, 'Timeout must be between 1 and 600000ms'),

  // Optional: AI SDK Max Retries
  AI_SDK_MAX_RETRIES: z
    .string()
    .optional()
    .default('3')
    .transform((val) => parseInt(val, 10))
    .refine((val) => val >= 0 && val <= 10, 'Max retries must be between 0 and 10'),
});

/**
 * Type representing validated environment variables
 */
export type ValidatedEnv = z.infer<typeof envSchema>;

/**
 * Validates environment variables against the schema
 *
 * @throws {EnvironmentValidationError} If validation fails
 * @returns {ValidatedEnv} Validated and typed environment variables
 *
 * @example
 * ```typescript
 * try {
 *   const env = validateEnvironment();
 *   console.log('✓ Environment validation successful');
 * } catch (error) {
 *   if (error instanceof EnvironmentValidationError) {
 *     console.error('✗ Environment validation failed:', error.message);
 *     process.exit(1);
 *   }
 * }
 * ```
 */
export function validateEnvironment(): ValidatedEnv {
  const env = {
    GOOGLE_GENERATIVE_AI_API_KEY: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    NEXT_PUBLIC_USE_AI_SDK: process.env.NEXT_PUBLIC_USE_AI_SDK,
    AI_SDK_LOG_LEVEL: process.env.AI_SDK_LOG_LEVEL,
    AI_SDK_TIMEOUT_MS: process.env.AI_SDK_TIMEOUT_MS,
    AI_SDK_MAX_RETRIES: process.env.AI_SDK_MAX_RETRIES,
  };

  try {
    const validatedEnv = envSchema.parse(env);

    // Log successful validation (server-side only)
    const isServer = typeof window === 'undefined';
    if (isServer) {
      console.log('✓ Environment validation successful');
      console.log('  - GOOGLE_GENERATIVE_AI_API_KEY: configured');
      console.log(`  - AI SDK enabled: ${validatedEnv.NEXT_PUBLIC_USE_AI_SDK}`);
      console.log(`  - Log level: ${validatedEnv.AI_SDK_LOG_LEVEL}`);
      console.log(`  - Timeout: ${validatedEnv.AI_SDK_TIMEOUT_MS}ms`);
      console.log(`  - Max retries: ${validatedEnv.AI_SDK_MAX_RETRIES}`);
    }

    return validatedEnv;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars: string[] = [];
      const invalidVars: string[] = [];
      const errorMessages: string[] = [];

      error.errors.forEach((err) => {
        const field = err.path[0] as string;
        if (err.code === 'invalid_type' && err.received === 'undefined') {
          missingVars.push(field);
          errorMessages.push(`  ✗ ${field}: missing`);
        } else {
          invalidVars.push(field);
          errorMessages.push(`  ✗ ${field}: ${err.message}`);
        }
      });

      const errorMessage = [
        '❌ Environment validation failed:',
        '',
        ...errorMessages,
        '',
        'Please check your .env.local file and ensure all required variables are set.',
        'See .env.example for reference.',
      ].join('\n');

      throw new EnvironmentValidationError(errorMessage, missingVars, invalidVars);
    }

    throw error;
  }
}

/**
 * Validates environment variables and exits process if validation fails (server-side only)
 * This is the fail-fast implementation for application startup
 *
 * @example
 * ```typescript
 * // In your application entry point (e.g., instrumentation.ts or layout.tsx)
 * validateEnvironmentOrExit();
 * ```
 */
export function validateEnvironmentOrExit(): ValidatedEnv | null {
  // Only validate server-side
  if (typeof window !== 'undefined') {
    return null;
  }

  try {
    return validateEnvironment();
  } catch (error) {
    if (error instanceof EnvironmentValidationError) {
      console.error('\n' + error.message + '\n');
      process.exit(1);
    }
    throw error;
  }
}

/**
 * Gets a validated environment variable value
 * Useful for accessing validated config throughout the application
 *
 * @returns {ValidatedEnv | null} Validated environment or null if client-side
 */
export function getValidatedEnv(): ValidatedEnv | null {
  if (typeof window !== 'undefined') {
    return null;
  }

  try {
    return validateEnvironment();
  } catch {
    return null;
  }
}
