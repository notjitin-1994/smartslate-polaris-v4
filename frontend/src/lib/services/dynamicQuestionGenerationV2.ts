/**
 * Dynamic Question Generation Service V2
 * Uses the new PRD-aligned 3-section static questionnaire and enhanced prompts
 */

import { createServiceLogger } from '@/lib/logging';
import { readFileSync } from 'fs';
import { join } from 'path';
import { GeminiClient } from '@/lib/claude/client';
import { TrackedGeminiClient } from '@/lib/claude/clientWithCostTracking';

const logger = createServiceLogger('dynamic-questions');

// LLM Configuration - Gemini primary with OpenRouter fallback
const LLM_CONFIG = {
  claude: {
    apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_GENERATIVE_AI_API_KEY || '',
    model: 'gemini-3-flash-latest',
    maxTokens: 32000,
    temperature: 0.3,
  },
  openrouter: {
    apiKey: process.env.OPENROUTER_API_KEY || '',
    model: 'google/gemma-4-31b-it:free',
    baseUrl: 'https://openrouter.ai/api/v1',
    maxTokens: 32000,
    temperature: 0.3,
  },
  timeout: 840000, // 14 minutes
  retries: 2,
} as const;

// Load system prompt V3 from file (Template-based - no personalization)
function loadSystemPromptV3(): string {
  try {
    const systemPromptPath = join(
      process.cwd(),
      'src',
      'lib',
      'ai',
      'prompts',
      'dynamic-questions-system-v3.txt'
    );
    // Use Buffer for large string loading to optimize Webpack caching
    const buffer = readFileSync(systemPromptPath);
    return buffer.toString('utf8');
  } catch (error) {
    logger.error('system_prompt.load.failure', 'Failed to load dynamic-questions-system-v3.txt', {
      error: error instanceof Error ? error.message : String(error),
    });
    throw new Error('Failed to load system prompt v3 file');
  }
}

// Load user prompt template V3 from file (Template-based - no personalization)
function loadUserPromptTemplateV3(): string {
  try {
    const userPromptPath = join(
      process.cwd(),
      'src',
      'lib',
      'ai',
      'prompts',
      'dynamic-questions-user-v3.txt'
    );
    // Use Buffer for large string loading to optimize Webpack caching
    const buffer = readFileSync(userPromptPath);
    return buffer.toString('utf8');
  } catch (error) {
    logger.error('user_prompt.load.failure', 'Failed to load dynamic-questions-user-v3.txt', {
      error: error instanceof Error ? error.message : String(error),
    });
    throw new Error('Failed to load user prompt template v3 file');
  }
}

// Dummy functions for template parsing - normally these come from common utils
function loadUserPromptTemplate(): string { return loadUserPromptTemplateV3(); }

/**
 * Build user prompt using the new V2 template with 3-section static data
 */
export function buildUserPromptV2(staticAnswers: Record<string, unknown>): string {
  const template = loadUserPromptTemplate();

  // Extract 3-section data
  const section1 = (staticAnswers.section_1_role_experience as Record<string, unknown>) || {};
  const section2 = (staticAnswers.section_2_organization as Record<string, unknown>) || {};
  const section3 = (staticAnswers.section_3_learning_gap as Record<string, unknown>) || {};

  // Helper to format arrays
  const formatArray = (arr: unknown) => {
    if (Array.isArray(arr) && arr.length > 0) {
      return arr.join(', ');
    }
    return 'Not specified';
  };

  // Replace all template variables
  let prompt = template;

  // Section 1: Role & Experience
  prompt = prompt.replace(
    /\{current_role\}/g,
    String(section1.current_role || section1.custom_role || 'Not specified')
  );
  prompt = prompt.replace(/\{years_in_role\}/g, String(section1.years_in_role || 0));
  prompt = prompt.replace(
    /\{previous_roles\}/g,
    String(section1.previous_roles || 'Not specified')
  );
  prompt = prompt.replace(/\{industry_experience\}/g, formatArray(section1.industry_experience));
  prompt = prompt.replace(/\{team_size\}/g, String(section1.team_size || 'Not specified'));
  prompt = prompt.replace(/\{technical_skills\}/g, formatArray(section1.technical_skills));

  // Section 2: Organization
  prompt = prompt.replace(
    /\{organization_name\}/g,
    String(section2.organization_name || 'Not specified')
  );
  prompt = prompt.replace(
    /\{industry_sector\}/g,
    String(section2.industry_sector || 'Not specified')
  );
  prompt = prompt.replace(
    /\{organization_size\}/g,
    String(section2.organization_size || 'Not specified')
  );
  prompt = prompt.replace(/\{geographic_regions\}/g, formatArray(section2.geographic_regions));
  prompt = prompt.replace(
    /\{compliance_requirements\}/g,
    formatArray(section2.compliance_requirements)
  );
  prompt = prompt.replace(
    /\{data_sharing_policies\}/g,
    String(section2.data_sharing_policies || 'Not specified')
  );
  prompt = prompt.replace(/\{security_clearance\}/g, String(section2.security_clearance || 'None'));
  prompt = prompt.replace(
    /\{legal_restrictions\}/g,
    String(section2.legal_restrictions || 'None specified')
  );

  // Section 3: Learning Gap & Audience
  prompt = prompt.replace(
    /\{learning_gap_description\}/g,
    String(section3.learning_gap_description || 'Not specified')
  );
  prompt = prompt.replace(
    /\{total_learners_range\}/g,
    String(section3.total_learners_range || 'Not specified')
  );
  prompt = prompt.replace(
    /\{current_knowledge_level\}/g,
    String(section3.current_knowledge_level || 3)
  );
  prompt = prompt.replace(/\{motivation_factors\}/g, formatArray(section3.motivation_factors));
  prompt = prompt.replace(/\{learning_location\}/g, formatArray(section3.learning_location));
  prompt = prompt.replace(/\{devices_used\}/g, formatArray(section3.devices_used));
  prompt = prompt.replace(
    /\{hours_per_week\}/g,
    String(section3.hours_per_week || 'Not specified')
  );
  prompt = prompt.replace(
    /\{learning_deadline\}/g,
    String(section3.learning_deadline || 'Not specified')
  );

  // Budget available with currency and amount
  const budgetAvailable = (section3.budget_available as Record<string, unknown>) || {};
  const budgetAmount = Number(budgetAvailable.amount) || 0;
  const budgetCurrency = String(budgetAvailable.currency || 'USD');
  prompt = prompt.replace(
    /\{budget_available\}/g,
    budgetAmount > 0 ? `${budgetCurrency} ${budgetAmount.toLocaleString()}` : 'Not specified'
  );

  return prompt;
}

/**
 * Build user prompt using the new V3 template with 3-section static data
 * V3 provides context for AI awareness but prohibits embedding it in question text
 * This creates generic, template-based questions applicable to any organization
 */
export function buildUserPromptV3(staticAnswers: Record<string, unknown>): string {
  const template = loadUserPromptTemplateV3();

  // Extract 3-section data
  const section1 = (staticAnswers.section_1_role_experience as Record<string, unknown>) || {};
  const section2 = (staticAnswers.section_2_organization as Record<string, unknown>) || {};
  const section3 = (staticAnswers.section_3_learning_gap as Record<string, unknown>) || {};

  // Helper to format arrays
  const formatArray = (arr: unknown) => {
    if (Array.isArray(arr) && arr.length > 0) {
      return arr.join(', ');
    }
    return 'Not specified';
  };

  // Replace all template variables (context provided for AI awareness only)
  let prompt = template;

  // Section 1: Role & Experience
  prompt = prompt.replace(
    /\{current_role\}/g,
    String(section1.current_role || section1.custom_role || 'Not specified')
  );
  prompt = prompt.replace(/\{years_in_role\}/g, String(section1.years_in_role || 0));
  prompt = prompt.replace(
    /\{previous_roles\}/g,
    String(section1.previous_roles || 'Not specified')
  );
  prompt = prompt.replace(/\{industry_experience\}/g, formatArray(section1.industry_experience));
  prompt = prompt.replace(/\{team_size\}/g, String(section1.team_size || 'Not specified'));
  prompt = prompt.replace(/\{technical_skills\}/g, formatArray(section1.technical_skills));

  // Section 2: Organization
  prompt = prompt.replace(
    /\{organization_name\}/g,
    String(section2.organization_name || 'Not specified')
  );
  prompt = prompt.replace(
    /\{industry_sector\}/g,
    String(section2.industry_sector || 'Not specified')
  );
  prompt = prompt.replace(
    /\{organization_size\}/g,
    String(section2.organization_size || 'Not specified')
  );
  prompt = prompt.replace(/\{geographic_regions\}/g, formatArray(section2.geographic_regions));
  prompt = prompt.replace(
    /\{compliance_requirements\}/g,
    formatArray(section2.compliance_requirements)
  );
  prompt = prompt.replace(
    /\{data_sharing_policies\}/g,
    String(section2.data_sharing_policies || 'Not specified')
  );
  prompt = prompt.replace(/\{security_clearance\}/g, String(section2.security_clearance || 'None'));
  prompt = prompt.replace(
    /\{legal_restrictions\}/g,
    String(section2.legal_restrictions || 'None specified')
  );

  // Section 3: Learning Gap & Audience
  prompt = prompt.replace(
    /\{learning_gap_description\}/g,
    String(section3.learning_gap_description || 'Not specified')
  );
  prompt = prompt.replace(
    /\{total_learners_range\}/g,
    String(section3.total_learners_range || 'Not specified')
  );
  prompt = prompt.replace(
    /\{current_knowledge_level\}/g,
    String(section3.current_knowledge_level || 3)
  );
  prompt = prompt.replace(/\{motivation_factors\}/g, formatArray(section3.motivation_factors));
  prompt = prompt.replace(/\{learning_location\}/g, formatArray(section3.learning_location));
  prompt = prompt.replace(/\{devices_used\}/g, formatArray(section3.devices_used));
  prompt = prompt.replace(
    /\{hours_per_week\}/g,
    String(section3.hours_per_week || 'Not specified')
  );
  prompt = prompt.replace(
    /\{learning_deadline\}/g,
    String(section3.learning_deadline || 'Not specified')
  );

  // Budget available with currency and amount
  const budgetAvailable = (section3.budget_available as Record<string, unknown>) || {};
  const budgetAmount = Number(budgetAvailable.amount) || 0;
  const budgetCurrency = String(budgetAvailable.currency || 'USD');
  prompt = prompt.replace(
    /\{budget_available\}/g,
    budgetAmount > 0 ? `${budgetCurrency} ${budgetAmount.toLocaleString()}` : 'Not specified'
  );

  return prompt;
}

/**
 * Call LLM provider (Gemini)
 */
async function callGemini(
  systemPrompt: string,
  userPrompt: string,
  userId?: string,
  blueprintId?: string,
  supabase?: any
): Promise<string> {
  const config = LLM_CONFIG.claude;

  if (!config.apiKey) {
    throw new Error('Gemini API key not configured');
  }

  const claudeClient = new TrackedGeminiClient(undefined, supabase);

  try {
    const response = await claudeClient.generate({
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
      max_tokens: config.maxTokens,
      temperature: config.temperature,
      userId,
      blueprintId,
      endpoint: 'dynamic-questions',
    });

    return GeminiClient.extractText(response);
  } catch (error) {
    throw error;
  }
}

/**
 * Call LLM provider (OpenRouter)
 */
async function callOpenRouter(systemPrompt: string, userPrompt: string): Promise<string> {
  const config = LLM_CONFIG.openrouter;

  if (!config.apiKey) {
    throw new Error('OpenRouter API key not configured');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), LLM_CONFIG.timeout);

  try {
    const response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
        'HTTP-Referer': 'https://smartslate.io', // Required by some OpenRouter models
        'X-Title': 'SmartSlate Polaris',
      },
      body: JSON.stringify({
        model: config.model,
        max_tokens: config.maxTokens,
        temperature: config.temperature,
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: userPrompt,
          },
        ],
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`OpenRouter API error: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * Aggressively repair truncated JSON by finding the last complete structure
 */
function repairTruncatedJSON(jsonString: string): string {
  let repaired = jsonString;

  // Count opening and closing brackets
  const openBraces = (repaired.match(/{/g) || []).length;
  const closeBraces = (repaired.match(/}/g) || []).length;
  const openBrackets = (repaired.match(/\[/g) || []).length;
  const closeBrackets = (repaired.match(/]/g) || []).length;

  // If we have unclosed brackets, aggressively truncate to last valid structure
  if (openBraces > closeBraces || openBrackets > closeBrackets) {
    logger.warn(
      'dynamic_questions.json.truncation_detected',
      'JSON appears truncated, attempting aggressive repair',
      {
        openBraces,
        closeBraces,
        openBrackets,
        closeBrackets,
        position: repaired.length,
      }
    );

    // Strategy 1: Find last complete SECTION (not just question)
    const sectionPattern = /\{\s*"id"\s*:\s*"s\d+"\s*,\s*"title"\s*:/g;
    const sectionMatches = Array.from(repaired.matchAll(sectionPattern));

    if (sectionMatches.length > 0) {
      // Work backwards to find the last complete section
      for (let i = sectionMatches.length - 1; i >= Math.max(0, sectionMatches.length - 3); i--) {
        const startPos = sectionMatches[i].index || 0;
        const sectionEndPos = findMatchingBrace(repaired, startPos);

        if (sectionEndPos > 0) {
          repaired = repaired.substring(0, sectionEndPos + 1);
          repaired = repaired.trim();
          if (!repaired.endsWith(']')) repaired += '\n  ]';
          if (!repaired.includes('"metadata"')) {
            repaired += ',\n  "metadata": { "generatedAt": "' + new Date().toISOString() + '", "truncationRepaired": true }';
          }
          if (!repaired.endsWith('}')) repaired += '\n}';
          return repaired;
        }
      }
    }

    // Strategy 3: Nuclear option
    repaired = repaired.trim();
    repaired = repaired.replace(/,\s*$/, '');
    const finalOpenBrackets = (repaired.match(/\[/g) || []).length;
    const finalCloseBrackets = (repaired.match(/]/g) || []).length;
    const finalOpenBraces = (repaired.match(/{/g) || []).length;
    const finalCloseBraces = (repaired.match(/}/g) || []).length;

    for (let i = 0; i < finalOpenBrackets - finalCloseBrackets; i++) repaired += ']';
    for (let i = 0; i < finalOpenBraces - finalCloseBraces; i++) repaired += '}';
  }

  return repaired;
}

/**
 * Find the matching closing brace for an opening brace at position
 */
function findMatchingBrace(str: string, startPos: number): number {
  let depth = 0;
  let inString = false;
  let escapeNext = false;

  for (let i = startPos; i < str.length; i++) {
    const char = str[i];
    if (escapeNext) { escapeNext = false; continue; }
    if (char === '\\') { escapeNext = true; continue; }
    if (char === '"') { inString = !inString; continue; }
    if (!inString) {
      if (char === '{') depth++;
      else if (char === '}') {
        depth--;
        if (depth === 0) return i;
      }
    }
  }
  return -1;
}

/**
 * Repair common JSON formatting issues from LLM responses
 */
function repairJSON(jsonString: string): string {
  let repaired = jsonString;
  repaired = repairTruncatedJSON(repaired);
  repaired = repaired.replace(/: "([^"]*)"([^,\}\]\s])/g, (match, content, after) => `: "${content.replace(/"/g, '\\"')}"${after}`);
  repaired = repaired.replace(/"\s*\n\s*"/g, '",\n"');
  repaired = repaired.replace(/}\s*\n\s*{/g, '},\n{');
  repaired = repaired.replace(/]\s*\n\s*{/g, '],\n{');
  repaired = repaired.replace(/}\s*\n\s*\[/g, '},\n[');
  repaired = repaired.replace(/,(\s*[}\]])/g, '$1');
  repaired = repaired.replace(/: "([^"]*)\n([^"]*?)"/g, (match, before, after) => `: "${before}\\n${after}"`);
  repaired = repaired.replace(/\\(?!["\\/bfnrtu])/g, '\\\\');
  repaired = repaired.replace(/[\x00-\x1F\x7F]/g, '');
  return repaired;
}

/**
 * Extract and validate JSON from LLM response with repair attempts
 */
function extractAndValidateJSON(content: string, attemptRepair: boolean = true): { sections: unknown[]; metadata: unknown } {
  let jsonString = content.trim();
  const fenceMatch = jsonString.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (fenceMatch) jsonString = fenceMatch[1].trim();
  const startIdx = jsonString.indexOf('{');
  const endIdx = jsonString.lastIndexOf('}');
  if (startIdx === -1 || endIdx === -1 || endIdx <= startIdx) throw new Error('No valid JSON object found in response');
  jsonString = jsonString.substring(startIdx, endIdx + 1);

  let parsed: any = null;
  try {
    parsed = JSON.parse(jsonString);
  } catch (error) {
    if (attemptRepair) {
      try {
        const repairedString = repairJSON(jsonString);
        parsed = JSON.parse(repairedString);
      } catch (repairError) {
        throw new Error(`Invalid JSON from LLM (repair failed): ${(error as Error).message}`);
      }
    } else throw error;
  }

  if (!parsed || !parsed.sections || !Array.isArray(parsed.sections)) throw new Error('Response missing sections array');
  
  // Basic validation of sections
  parsed.sections.forEach((section: any) => {
    if (!section.id || !section.title || !section.questions || !Array.isArray(section.questions)) {
      throw new Error('Invalid section structure');
    }
  });

  return parsed;
}

/**
 * Generate dynamic questions using the new V2 system
 */
export async function generateDynamicQuestionsV2(
  blueprintId: string,
  staticAnswers: Record<string, unknown>,
  userId?: string,
  supabase?: any
): Promise<{ sections: unknown[]; metadata: unknown }> {
  const startTime = Date.now();

  console.log('\n========================================');
  console.log('⚙️  GENERATION SERVICE: dynamicQuestionGenerationV2');
  console.log('========================================');
  console.log('Blueprint ID:', blueprintId);
  console.log('Timestamp:', new Date().toISOString());

  logger.info(
    'dynamic_questions.generation.start',
    'Starting V2 question generation with Gemini (Primary) → OpenRouter fallback',
    { blueprintId }
  );

  try {
    const systemPrompt = loadSystemPromptV3();
    const userPrompt = buildUserPromptV3(staticAnswers);

    console.log('\n📄 Prompts loaded (V3 - Template-Based):');
    console.log('- System prompt:', systemPrompt.length, 'characters');
    console.log('- User prompt:', userPrompt.length, 'characters (context for AI awareness)');

    let responseContent: string | null = null;
    let usedProvider: 'claude' | 'openrouter' | null = null;

    // 1. Try Gemini first (Primary provider)
    if (LLM_CONFIG.claude.apiKey) {
      console.log('\n🤖 PRIMARY PROVIDER: Gemini (3 Flash)');
      console.log('→ Model:', LLM_CONFIG.claude.model);

      for (let attempt = 1; attempt <= LLM_CONFIG.retries + 1; attempt++) {
        try {
          console.log(`\n⏳ Attempt ${attempt}/${LLM_CONFIG.retries + 1}: Calling Gemini...`);
          responseContent = await callGemini(systemPrompt, userPrompt, userId, blueprintId, supabase);
          usedProvider = 'claude';
          console.log('✅ Gemini succeeded on attempt', attempt);
          break;
        } catch (error) {
          console.error(`❌ Attempt ${attempt} failed:`, error instanceof Error ? error.message : String(error));
          if (attempt < LLM_CONFIG.retries + 1) {
            const delay = Math.pow(2, attempt - 1) * 1000;
            console.log(`⏳ Retrying in ${delay}ms...`);
            await new Promise((resolve) => setTimeout(resolve, delay));
          }
        }
      }
    }

    // 2. Fallback to OpenRouter if Gemini failed or unavailable
    if (!responseContent && LLM_CONFIG.openrouter.apiKey) {
      console.log('\n🔄 FALLBACK PROVIDER: OpenRouter (Gemma 4)');
      console.log('→ Model:', LLM_CONFIG.openrouter.model);

      for (let attempt = 1; attempt <= LLM_CONFIG.retries + 1; attempt++) {
        try {
          console.log(`\n⏳ Attempt ${attempt}/${LLM_CONFIG.retries + 1}: Calling OpenRouter...`);
          responseContent = await callOpenRouter(systemPrompt, userPrompt);
          usedProvider = 'openrouter';
          console.log('✅ OpenRouter succeeded on attempt', attempt);
          break;
        } catch (error) {
          console.error(`❌ Attempt ${attempt} failed:`, error instanceof Error ? error.message : String(error));
          if (attempt < LLM_CONFIG.retries + 1) {
            const delay = Math.pow(2, attempt - 1) * 1000;
            await new Promise((resolve) => setTimeout(resolve, delay));
          }
        }
      }
    }

    if (!responseContent) {
      throw new Error('All generation providers failed. Please check API keys and try again.');
    }

    // Extract and validate JSON
    console.log('\n🔍 Parsing and validating response...');
    const result = extractAndValidateJSON(responseContent);
    console.log('✓ Response validated successfully');

    const duration = Date.now() - startTime;
    const resultTyped = result as { sections: any[]; metadata: any };
    const questionCount = resultTyped.sections.reduce((sum: number, s: any) => sum + s.questions.length, 0);

    console.log('\n✨ GENERATION COMPLETE');
    console.log('→ Provider Used:', usedProvider?.toUpperCase() || 'UNKNOWN');
    console.log('→ Sections Generated:', resultTyped.sections.length);
    console.log('→ Total Questions:', questionCount);
    console.log('→ Duration:', (duration / 1000).toFixed(2) + 's');
    console.log('========================================\n');

    return result;
  } catch (error) {
    logger.error('dynamic_questions.generation.error', 'Failed to generate questions', {
      blueprintId,
      error: error instanceof Error ? error.message : String(error),
      duration: Date.now() - startTime,
    });
    throw error;
  }
}
