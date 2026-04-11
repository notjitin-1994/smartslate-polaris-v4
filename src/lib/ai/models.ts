import { createProviderRegistry } from 'ai';
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';
import { moonshotai as moonshot } from '@ai-sdk/moonshotai';
import { createZhipu } from 'zhipu-ai-provider';

/**
 * Custom Zhipu Provider using official community provider.
 * For the GLM Coding Plan (Global), the dedicated coding endpoint is required.
 */
const zhipu = createZhipu({
  apiKey: (process.env.ZHIPU_API_KEY || '').trim(),
  baseURL: 'https://api.z.ai/api/coding/paas/v4',
});

/**
 * Unified Provider Registry for Polaris v4
 * 
 * Maps provider IDs to their SDK instances. Use `provider:model` format
 * when selecting models (e.g. "anthropic:claude-sonnet-4.5").
 *
 * Supported providers:
 * - openai: GPT models
 * - anthropic: Claude models
 * - google: Gemini models
 * - moonshot: Kimi models (Moonshot AI)
 * - zhipu: GLM models (via Global Z.ai OpenAI-compatible endpoint)
 */
export const modelRegistry = createProviderRegistry({
  openai,
  anthropic,
  google,
  moonshot,
  zhipu,
});

/**
 * Get a language model by ID.
 *
 * @example
 * getModel('anthropic:claude-sonnet-4.5')
 * getModel('zhipu:glm-4')
 */
export function getModel(modelId?: string) {
  const defaultModel = (process.env.NEXT_PUBLIC_DEFAULT_MODEL || 'anthropic:claude-sonnet-4.5').trim();
  const selectedModel = (modelId || defaultModel).trim();
  
  // Type assertion needed because registry generates a union of known model IDs
  return modelRegistry.languageModel(selectedModel as Parameters<typeof modelRegistry.languageModel>[0]);
}
