import { experimental_createProviderRegistry as createProviderRegistry } from 'ai';
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';
import { moonshot } from '@ai-sdk/moonshotai';
import { zhipu } from 'zhipu-ai-provider';
import { minimax } from 'vercel-minimax-ai-provider';

/**
 * Unified Provider Registry for Polaris v4
 * Supports hot-swapping models via environment variables or user settings.
 */
export const modelRegistry = createProviderRegistry({
  openai,
  anthropic,
  google,
  moonshot,
  zhipu,
  minimax,
});

/**
 * Helper to get a model with proper caching and configuration.
 */
export function getModel(modelId: string = process.env.NEXT_PUBLIC_DEFAULT_MODEL || 'anthropic:claude-3-5-sonnet-latest') {
  return modelRegistry.languageModel(modelId);
}

/**
 * Model specific options for prompt caching where supported.
 */
export const providerOptions = {
  anthropic: {
    cacheControl: { type: 'ephemeral' as const },
  },
};
