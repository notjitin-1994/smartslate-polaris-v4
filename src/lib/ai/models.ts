import { createProviderRegistry } from 'ai';
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';
import { moonshotai as moonshot } from '@ai-sdk/moonshotai';
import { createZhipu } from 'zhipu-ai-provider';
import { createGatewayProvider } from '@ai-sdk/gateway';

/**
 * Vercel AI Gateway Configuration
 * Routes requests through Vercel's edge network for lower latency and proximity-based caching.
 */
const gateway = createGatewayProvider({
  apiKey: process.env.VERCEL_AI_GATEWAY_API_KEY,
});

/**
 * Custom Zhipu Provider using official community provider.
 * For the GLM Coding Plan (Global), the dedicated coding endpoint is required.
 */
const zhipuDirect = createZhipu({
  apiKey: (process.env.ZHIPU_API_KEY || '').trim(),
  baseURL: 'https://api.z.ai/api/coding/paas/v4',
});

/**
 * Unified Provider Registry for Polaris v4
 */
export const modelRegistry = createProviderRegistry({
  // Native providers
  openai,
  anthropic,
  google,
  moonshot,
  zhipu: zhipuDirect,
  
  // Vercel AI Gateway (used via 'gateway:provider/model')
  gateway,
});

/**
 * Get a language model by ID.
 *
 * @example
 * getModel('anthropic:claude-sonnet-4.5')
 * getModel('gateway:anthropic/claude-sonnet-4.5')
 */
export function getModel(modelId?: string) {
  // Use gateway:zhipu/glm-4-air as default for lightning speed
  const defaultModel = (process.env.NEXT_PUBLIC_DEFAULT_MODEL || 'gateway:zhipu/glm-4-air').trim();
  const selectedModel = (modelId || defaultModel).trim();
  
  return modelRegistry.languageModel(selectedModel as Parameters<typeof modelRegistry.languageModel>[0]);
}
