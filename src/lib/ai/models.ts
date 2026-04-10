import { createProviderRegistry } from 'ai';
import { openai, createOpenAI } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';
import { moonshotai as moonshot } from '@ai-sdk/moonshotai';

/**
 * Custom Zhipu Provider using OpenAI compatibility layer.
 * This is the recommended way to use the GLM Coding Plan (Global).
 * The 'api.z.ai/v1' endpoint is specifically optimized for this plan.
 */
const zhipu = createOpenAI({
  apiKey: process.env.ZHIPU_API_KEY,
  baseURL: 'https://api.z.ai/v1',
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
export function getModel(modelId: string = process.env.NEXT_PUBLIC_DEFAULT_MODEL || 'anthropic:claude-sonnet-4.5') {
  // Type assertion needed because registry generates a union of known model IDs
  return modelRegistry.languageModel(modelId as Parameters<typeof modelRegistry.languageModel>[0]);
}
