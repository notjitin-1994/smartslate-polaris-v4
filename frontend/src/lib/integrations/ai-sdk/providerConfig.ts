/**
 * Provider Configuration Module
 *
 * Centralized configuration for AI providers with triple-fallback support:
 * 1. Gemini 3.1 Pro Primary (Primary) - Cost-effective, fast
 * 2. Gemini 3.1 Pro Fallback (Fallback) - More capable, handles complex scenarios
 * 3. Ollama Qwen3 (Emergency) - Local fallback, offline support
 *
 * @module lib/ai-sdk/providerConfig
 */

import { google } from '@ai-sdk/google';
import { ollama } from 'ollama-ai-provider';
import { getValidatedEnv } from '../utils/environmentValidation';

/**
 * Supported AI provider types
 */
export enum ProviderType {
  CLAUDE_SONNET_4 = 'gemini-3.1-pro-preview',
  CLAUDE_OPUS_4 = 'gemini-3.1-pro-preview-fallback',
  OLLAMA_QWEN3 = 'ollama-qwen3',
}

/**
 * Model configuration interface
 * Defines all parameters needed to configure an AI model provider
 */
export interface ModelConfig {
  /** Unique identifier for this provider */
  id: ProviderType;

  /** Human-readable name */
  name: string;

  /** Model identifier for the provider */
  model: string;

  /** Maximum tokens for generation */
  maxTokens: number;

  /** Temperature for generation (0.0 - 1.0) */
  temperature: number;

  /** Request timeout in milliseconds */
  timeout: number;

  /** Priority order (1 = primary, 2 = fallback, 3 = emergency) */
  priority: 1 | 2 | 3;

  /** Whether this provider is enabled */
  enabled: boolean;

  /** Provider-specific configuration */
  provider: ReturnType<typeof google> | ReturnType<typeof ollama>;
}

/**
 * Fallback strategy configuration
 * Defines how the system handles provider failures
 */
export interface FallbackStrategy {
  /** Maximum retry attempts per provider */
  maxRetries: number;

  /** Backoff multiplier for exponential backoff (e.g., 1.5 = 50% increase each retry) */
  backoffMultiplier: number;

  /** Initial backoff delay in milliseconds */
  initialBackoffMs: number;

  /** Circuit breaker configuration */
  circuitBreaker: {
    /** Number of consecutive failures before opening circuit */
    threshold: number;

    /** Time to wait before attempting to close circuit (milliseconds) */
    resetTimeout: number;
  };
}

/**
 * Default fallback strategy aligned with PRD specifications
 */
export const DEFAULT_FALLBACK_STRATEGY: FallbackStrategy = {
  maxRetries: 3,
  backoffMultiplier: 1.5,
  initialBackoffMs: 1000,
  circuitBreaker: {
    threshold: 5,
    resetTimeout: 300000, // 5 minutes
  },
};

/**
 * Creates provider configurations based on environment variables
 * @returns Array of model configurations in priority order
 */
export function createProviderConfigs(): ModelConfig[] {
  const env = getValidatedEnv();

  // Use placeholder values if running client-side
  const googleKey = env?.GOOGLE_GENERATIVE_AI_API_KEY || 'placeholder';
  const ollamaUrl = env?.OLLAMA_BASE_URL || 'http://localhost:11434';

  return [
    // Primary: Gemini 3.1 Pro Primary - Cost-effective, fast responses
    {
      id: ProviderType.CLAUDE_SONNET_4,
      name: 'Gemini 3.1 Pro Primary',
      model: 'gemini-3.1-pro-preview',
      maxTokens: 12000,
      temperature: 0.2,
      timeout: 60000, // 60 seconds
      priority: 1,
      enabled: true,
      provider: google({
        apiKey: googleKey,
      }),
    },

    // Fallback: Gemini 3.1 Pro Fallback - More capable, handles complex scenarios
    {
      id: ProviderType.CLAUDE_OPUS_4,
      name: 'Gemini 3.1 Pro Fallback',
      model: 'gemini-3.1-pro-preview',
      maxTokens: 16000,
      temperature: 0.2,
      timeout: 90000, // 90 seconds
      priority: 2,
      enabled: true,
      provider: google({
        apiKey: googleKey,
      }),
    },

    // Emergency: Ollama Qwen3 - Local fallback, offline support
    {
      id: ProviderType.OLLAMA_QWEN3,
      name: 'Ollama Qwen3',
      model: 'qwen3:32b',
      maxTokens: 12000,
      temperature: 0.2,
      timeout: 120000, // 120 seconds
      priority: 3,
      enabled: true,
      provider: ollama({
        baseURL: ollamaUrl,
      }),
    },
  ];
}

/**
 * Gets a specific provider configuration by type
 * @param type - Provider type to retrieve
 * @returns Model configuration for the specified provider
 */
export function getProviderConfig(type: ProviderType): ModelConfig | undefined {
  const configs = createProviderConfigs();
  return configs.find((config) => config.id === type);
}

/**
 * Gets all enabled providers in priority order
 * @returns Array of enabled model configurations sorted by priority
 */
export function getEnabledProviders(): ModelConfig[] {
  return createProviderConfigs()
    .filter((config) => config.enabled)
    .sort((a, b) => a.priority - b.priority);
}

/**
 * Gets the primary (highest priority) provider
 * @returns Primary model configuration
 */
export function getPrimaryProvider(): ModelConfig {
  const enabled = getEnabledProviders();
  if (enabled.length === 0) {
    throw new Error('No enabled providers found');
  }
  return enabled[0];
}

/**
 * Gets fallback providers (excluding primary)
 * @returns Array of fallback model configurations in priority order
 */
export function getFallbackProviders(): ModelConfig[] {
  const enabled = getEnabledProviders();
  return enabled.slice(1);
}

/**
 * Provider configuration summary for logging and debugging
 */
export interface ProviderConfigSummary {
  totalProviders: number;
  enabledProviders: number;
  primary: {
    id: ProviderType;
    name: string;
    model: string;
  };
  fallbacks: Array<{
    id: ProviderType;
    name: string;
    model: string;
    priority: number;
  }>;
  strategy: FallbackStrategy;
}

/**
 * Gets a summary of the current provider configuration
 * @returns Configuration summary object
 */
export function getConfigSummary(): ProviderConfigSummary {
  const allConfigs = createProviderConfigs();
  const enabled = getEnabledProviders();
  const primary = getPrimaryProvider();
  const fallbacks = getFallbackProviders();

  return {
    totalProviders: allConfigs.length,
    enabledProviders: enabled.length,
    primary: {
      id: primary.id,
      name: primary.name,
      model: primary.model,
    },
    fallbacks: fallbacks.map((config) => ({
      id: config.id,
      name: config.name,
      model: config.model,
      priority: config.priority,
    })),
    strategy: DEFAULT_FALLBACK_STRATEGY,
  };
}

/**
 * Logs provider configuration for debugging
 */
export function logProviderConfig(): void {
  if (typeof window !== 'undefined') {
    return; // Only log server-side
  }

  const summary = getConfigSummary();

  console.log('\n🤖 AI Provider Configuration:');
  console.log(`  Total Providers: ${summary.totalProviders}`);
  console.log(`  Enabled Providers: ${summary.enabledProviders}`);
  console.log(`\n  Primary Provider:`);
  console.log(`    - ${summary.primary.name} (${summary.primary.model})`);
  console.log(`\n  Fallback Providers:`);
  summary.fallbacks.forEach((fallback, index) => {
    console.log(
      `    ${index + 1}. ${fallback.name} (${fallback.model}) - Priority ${fallback.priority}`
    );
  });
  console.log(`\n  Fallback Strategy:`);
  console.log(`    - Max Retries: ${summary.strategy.maxRetries}`);
  console.log(`    - Backoff Multiplier: ${summary.strategy.backoffMultiplier}x`);
  console.log(
    `    - Circuit Breaker Threshold: ${summary.strategy.circuitBreaker.threshold} failures`
  );
  console.log(
    `    - Circuit Reset Timeout: ${summary.strategy.circuitBreaker.resetTimeout / 1000}s`
  );
  console.log('');
}
