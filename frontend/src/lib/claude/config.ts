/**
 * Gemini API Configuration
 * Secure server-side configuration for Gemini 3.1 Pro and Sonnet 4
 */

export interface LLMConfig {
  primaryModel: string;
  fallbackModel: string;
  openrouterModel: string;
  apiKey: string;
  openrouterApiKey: string;
  baseUrl: string;
  version: string;
  maxTokens: number;
  temperature: number;
  timeout: number;
  retries: number;
}

/**
 * Get LLM configuration from environment variables
 * CRITICAL: This function must ONLY be called server-side
 * Never expose API keys to the client
 */
export function getLLMConfig(): LLMConfig {
  // Load API keys from environment
  const apiKey = (
    process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
    process.env.NEXT_PUBLIC_GOOGLE_GENERATIVE_AI_API_KEY ||
    ''
  ).trim();

  const openrouterApiKey = (
    process.env.OPENROUTER_API_KEY ||
    ''
  ).trim();

  // During build time or when API key is not available, return a safe default config
  if (!apiKey && !openrouterApiKey) {
    return {
      primaryModel: 'gemini-2.5-pro',
      fallbackModel: 'gemini-2.5-pro',
      openrouterModel: 'google/gemma-4-31b-it:free',
      apiKey: '',
      openrouterApiKey: '',
      baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
      version: '2023-06-01',
      maxTokens: 32000,
      temperature: 0.2,
      timeout: 840000,
      retries: 2,
    };
  }

  const baseUrl = (process.env.ANTHROPIC_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta/openai')
    .trim()
    .replace(/\/$/, '');

  const version = (process.env.ANTHROPIC_VERSION || '2023-06-01').trim();

  return {
    primaryModel: 'gemini-2.5-pro',
    fallbackModel: 'gemini-2.5-pro',
    openrouterModel: 'google/gemma-4-31b-it:free',
    apiKey,
    openrouterApiKey,
    baseUrl,
    version,
    maxTokens: 32000,
    temperature: 0.2,
    timeout: 840000, // 14 minutes
    retries: 2,
  };
}

// Keep aliases for backward compatibility
export type GeminiConfig = LLMConfig;
export const getGeminiConfig = getLLMConfig;

/**
 * Validate that Gemini configuration is available
 * Safe to call from client-side (doesn't expose keys)
 */
export function isGeminiConfigured(): boolean {
  try {
    // Only check for presence, don't expose actual value
    return !!(process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_GENERATIVE_AI_API_KEY);
  } catch {
    return false;
  }
}
