/**
 * Gemini API Configuration
 * Secure server-side configuration for Gemini 3.1 Pro and Sonnet 4
 */

export interface GeminiConfig {
  primaryModel: string;
  fallbackModel: string;
  apiKey: string;
  baseUrl: string;
  version: string;
  maxTokens: number;
  temperature: number;
  timeout: number;
  retries: number;
}

/**
 * Get Gemini configuration from environment variables
 * CRITICAL: This function must ONLY be called server-side
 * Never expose API keys to the client
 */
export function getGeminiConfig(): GeminiConfig {
  // Load API key from environment - try multiple sources for compatibility
  const apiKey = (
    process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
    process.env.NEXT_PUBLIC_GOOGLE_GENERATIVE_AI_API_KEY ||
    ''
  ).trim();

  // During build time or when API key is not available, return a safe default config
  // The blueprint generation service will handle missing API keys gracefully
  if (!apiKey) {
    return {
      primaryModel: 'gemini-3.1-pro-preview',
      fallbackModel: 'gemini-3.1-pro-preview',
      apiKey: '',
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
    primaryModel: 'gemini-3.1-pro-preview',
    fallbackModel: 'gemini-3.1-pro-preview',
    apiKey,
    baseUrl,
    version,
    maxTokens: 32000,
    temperature: 0.2,
    timeout: 840000, // 14 minutes - avg generation time is ~13 minutes (779.7s)
    retries: 2,
  };
}

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
