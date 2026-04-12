import { createZhipu } from 'zhipu-ai-provider';
import { createProviderRegistry } from 'ai';
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';

/**
 * Zhipu Coding API Provider (Direct)
 * Hits the global high-speed backbone directly from Vercel Edge.
 * Bypasses all intermediate gateways to minimize RTT.
 */
export const zhipu = createZhipu({
  apiKey: (process.env.ZHIPU_API_KEY || '').trim(),
  baseURL: 'https://api.z.ai/api/coding/paas/v4', // Direct Global Coding Endpoint
});

export const modelRegistry = createProviderRegistry({
  zhipu,
  openai,
  anthropic,
});

/**
 * Get the lightning-fast GLM 4.7 Flash model.
 * Optimized for high-throughput coding and tool-calling.
 */
export function getModel(modelId?: string) {
  const defaultModel = 'zhipu:glm-4.7-flash';
  const selectedModel = (modelId || defaultModel).trim();
  
  return modelRegistry.languageModel(selectedModel as Parameters<typeof modelRegistry.languageModel>[0]);
}
