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

// LLM Configuration - Gemini primary, Perplexity fallback
const LLM_CONFIG = {
  claude: {
    apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_GENERATIVE_AI_API_KEY || '',
    model: 'gemini-3.1-pro-preview',
    maxTokens: 32000, // Gemini 1.5/3 Pro supports large contexts
    temperature: 0.3, // Reduced to 0.3 for better schema adherence
  },
  perplexity: {
    apiKey: process.env.PERPLEXITY_API_KEY || '',
    model: 'sonar-pro',
    baseUrl: 'https://api.perplexity.ai',
    maxTokens: 32000,
    temperature: 0.3,
  },
  timeout: 840000, // 14 minutes
  retries: 2,
} as const;

// Load system prompt from file
function loadSystemPrompt(): string {
  try {
    const systemPromptPath = join(
      process.cwd(),
      'lib',
      'prompts',
      'dynamic-questions-system-v2.txt'
    );
    return readFileSync(systemPromptPath, 'utf-8');
  } catch (error) {
    logger.error('system_prompt.load.failure', 'Failed to load dynamic-questions-system-v2.txt', {
      error: error instanceof Error ? error.message : String(error),
    });
    throw new Error('Failed to load system prompt file');
  }
}

// Load user prompt template from file
function loadUserPromptTemplate(): string {
  try {
    const userPromptPath = join(process.cwd(), 'lib', 'prompts', 'dynamic-questions-user-v2.txt');
    return readFileSync(userPromptPath, 'utf-8');
  } catch (error) {
    logger.error('user_prompt.load.failure', 'Failed to load dynamic-questions-user-v2.txt', {
      error: error instanceof Error ? error.message : String(error),
    });
    throw new Error('Failed to load user prompt template file');
  }
}

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
 * Call LLM provider (Gemini)
 * Returns both the content and metadata about the response
 */
async function callGemini(
  systemPrompt: string,
  userPrompt: string,
  userId?: string,
  blueprintId?: string,
  supabase?: any
): Promise<{ content: string; stopReason: string; tokensUsed: { input: number; output: number } }> {
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

    const content = GeminiClient.extractText(response);

    // Check if response was truncated
    if (response.stop_reason === 'max_tokens') {
      logger.error('claude.truncation.detected', 'Response was truncated at max_tokens', {
        maxTokens: config.maxTokens,
        outputTokens: response.usage.output_tokens,
        contentLength: content.length,
      });

      throw new Error(
        `Gemini response was truncated at max_tokens (${config.maxTokens}). The generated JSON is incomplete. Please increase max_tokens or reduce the complexity of the request.`
      );
    }

    logger.info('claude.response.complete', 'Gemini response completed successfully', {
      stopReason: response.stop_reason,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
    });

    return {
      content,
      stopReason: response.stop_reason,
      tokensUsed: {
        input: response.usage.input_tokens,
        output: response.usage.output_tokens,
      },
    };
  } catch (error) {
    throw error;
  }
}

/**
 * Call LLM provider (Perplexity)
 */
async function callPerplexity(systemPrompt: string, userPrompt: string): Promise<string> {
  const config = LLM_CONFIG.perplexity;

  if (!config.apiKey) {
    throw new Error('Perplexity API key not configured');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), LLM_CONFIG.timeout);

  try {
    // Perplexity doesn't support system prompts, so combine them
    const combinedPrompt = `${systemPrompt}\n\n${userPrompt}`;

    const response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        max_tokens: config.maxTokens,
        temperature: config.temperature,
        messages: [
          {
            role: 'user',
            content: combinedPrompt,
          },
        ],
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Perplexity API error: ${response.status} - ${JSON.stringify(errorData)}`);
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
    // Look for section pattern: { "id": "s#", ... }
    const sectionPattern = /\{\s*"id"\s*:\s*"s\d+"\s*,\s*"title"\s*:/g;
    const sectionMatches = Array.from(repaired.matchAll(sectionPattern));

    if (sectionMatches.length > 0) {
      logger.info('dynamic_questions.repair.sections_found', 'Found sections', {
        count: sectionMatches.length,
      });

      // Work backwards to find the last complete section
      for (let i = sectionMatches.length - 1; i >= Math.max(0, sectionMatches.length - 3); i--) {
        const startPos = sectionMatches[i].index || 0;
        const sectionEndPos = findMatchingBrace(repaired, startPos);

        if (sectionEndPos > 0) {
          // Found a complete section! Truncate here
          repaired = repaired.substring(0, sectionEndPos + 1);

          logger.info(
            'dynamic_questions.repair.section_truncation',
            'Truncated to last complete section',
            {
              sectionIndex: i,
              truncatedAt: sectionEndPos,
              preservedSections: i + 1,
            }
          );

          // Close the sections array
          repaired = repaired.trim();
          if (!repaired.endsWith(']')) {
            repaired += '\n  ]';
          }

          // Add metadata and close root object
          if (!repaired.includes('"metadata"')) {
            repaired +=
              ',\n  "metadata": {\n    "generatedAt": "' +
              new Date().toISOString() +
              '",\n    "truncationRepaired": true,\n    "sectionsCount": ' +
              (i + 1) +
              '\n  }';
          }

          // Close root object
          if (!repaired.endsWith('}')) {
            repaired += '\n}';
          }

          logger.info(
            'dynamic_questions.repair.success',
            'Successfully repaired with complete sections',
            {
              originalLength: jsonString.length,
              repairedLength: repaired.length,
              sectionsPreserved: i + 1,
            }
          );

          return repaired;
        }
      }
    }

    // Strategy 2: If no complete section found, try to salvage questions
    // This is a fallback for severely truncated responses
    logger.warn(
      'dynamic_questions.repair.fallback',
      'No complete sections found, attempting question-level repair'
    );

    // Find last complete question
    const questionPattern = /\{\s*"id"\s*:\s*"s\d+_q\d+"/g;
    const questionMatches = Array.from(repaired.matchAll(questionPattern));

    if (questionMatches.length > 0) {
      for (let i = questionMatches.length - 1; i >= Math.max(0, questionMatches.length - 5); i--) {
        const startPos = questionMatches[i].index || 0;
        const questionEndPos = findMatchingBrace(repaired, startPos);

        if (questionEndPos > 0) {
          repaired = repaired.substring(0, questionEndPos + 1);

          // Close questions array, section object, sections array, add metadata, close root
          repaired = repaired.trim();
          if (!repaired.endsWith(']')) {
            repaired += '\n      ]';
          }
          if (!repaired.includes('}')) {
            repaired += '\n    }';
          }
          if (!repaired.includes(']')) {
            repaired += '\n  ]';
          }
          if (!repaired.includes('"metadata"')) {
            repaired +=
              ',\n  "metadata": {\n    "generatedAt": "' +
              new Date().toISOString() +
              '",\n    "truncationRepaired": true,\n    "partial": true\n  }';
          }
          if (!repaired.endsWith('}')) {
            repaired += '\n}';
          }

          logger.info('dynamic_questions.repair.partial_success', 'Repaired with partial content', {
            originalLength: jsonString.length,
            repairedLength: repaired.length,
            questionsPreserved: i + 1,
          });

          return repaired;
        }
      }
    }

    // Strategy 3: Nuclear option - just close everything
    logger.error(
      'dynamic_questions.repair.nuclear',
      'Could not find any complete structures, attempting nuclear repair'
    );

    repaired = repaired.trim();
    // Remove any trailing incomplete content
    const lastCompleteChar = Math.max(
      repaired.lastIndexOf('}'),
      repaired.lastIndexOf(']'),
      repaired.lastIndexOf('"')
    );
    if (lastCompleteChar > 0) {
      repaired = repaired.substring(0, lastCompleteChar + 1);
    }

    // Remove trailing commas
    repaired = repaired.replace(/,\s*$/, '');

    // Calculate and add missing closing brackets
    const finalOpenBrackets = (repaired.match(/\[/g) || []).length;
    const finalCloseBrackets = (repaired.match(/]/g) || []).length;
    const finalOpenBraces = (repaired.match(/{/g) || []).length;
    const finalCloseBraces = (repaired.match(/}/g) || []).length;

    const bracketDiff = finalOpenBrackets - finalCloseBrackets;
    const braceDiff = finalOpenBraces - finalCloseBraces;

    for (let i = 0; i < bracketDiff; i++) {
      repaired += ']';
    }
    for (let i = 0; i < braceDiff; i++) {
      repaired += '}';
    }

    logger.warn('dynamic_questions.repair.nuclear_complete', 'Nuclear repair completed', {
      originalLength: jsonString.length,
      repairedLength: repaired.length,
      bracketsAdded: bracketDiff + braceDiff,
    });
  }

  return repaired;
}

/**
 * Find the matching closing brace for an opening brace at position
 * Returns the position of the matching }, or -1 if not found
 */
function findMatchingBrace(str: string, startPos: number): number {
  let depth = 0;
  let inString = false;
  let escapeNext = false;

  for (let i = startPos; i < str.length; i++) {
    const char = str[i];

    if (escapeNext) {
      escapeNext = false;
      continue;
    }

    if (char === '\\') {
      escapeNext = true;
      continue;
    }

    if (char === '"' && !escapeNext) {
      inString = !inString;
      continue;
    }

    if (!inString) {
      if (char === '{') {
        depth++;
      } else if (char === '}') {
        depth--;
        if (depth === 0) {
          return i;
        }
      }
    }
  }

  return -1; // No matching brace found
}

/**
 * Repair common JSON formatting issues from LLM responses
 */
function repairJSON(jsonString: string): string {
  let repaired = jsonString;

  // First, try to fix truncation issues
  repaired = repairTruncatedJSON(repaired);

  // Fix incomplete string values at the very end of the JSON
  // This handles cases where Gemini was cut off mid-property
  const lastQuoteIndex = repaired.lastIndexOf('"');
  if (lastQuoteIndex > 0) {
    // Count quotes to see if we have an odd number (unclosed string)
    const quotesBeforeLast = (repaired.substring(0, lastQuoteIndex).match(/"/g) || []).length;
    if (quotesBeforeLast % 2 === 0) {
      // Even number before means the last quote opens a string - need to close it
      // But first, check if there's incomplete content after it
      const afterLastQuote = repaired.substring(lastQuoteIndex + 1);
      if (afterLastQuote && !afterLastQuote.trim().match(/^[\s,\}\]]*$/)) {
        // There's content that's not just whitespace/delimiters - truncate before it
        const cleanEnd = repaired.substring(0, lastQuoteIndex).lastIndexOf('"');
        if (cleanEnd > 0) {
          repaired = repaired.substring(0, cleanEnd + 1);
        }
      }
    }
  }

  // Fix unescaped quotes in strings (but not in property names)
  // This is a simplified approach - replace unescaped quotes in value positions
  repaired = repaired.replace(/: "([^"]*)"([^,\}\]\s])/g, (match, content, after) => {
    // If there's content after the closing quote without proper delimiter, it's likely malformed
    return `: "${content.replace(/"/g, '\\"')}"${after}`;
  });

  // Fix missing commas between array elements or object properties
  repaired = repaired.replace(/"\s*\n\s*"/g, '",\n"');
  repaired = repaired.replace(/}\s*\n\s*{/g, '},\n{');
  repaired = repaired.replace(/]\s*\n\s*{/g, '],\n{');
  repaired = repaired.replace(/}\s*\n\s*\[/g, '},\n[');

  // Fix trailing commas before closing brackets
  repaired = repaired.replace(/,(\s*[}\]])/g, '$1');

  // Fix unescaped newlines in strings
  repaired = repaired.replace(/: "([^"]*)\n([^"]*?)"/g, (match, before, after) => {
    return `: "${before}\\n${after}"`;
  });

  // Fix unescaped backslashes
  repaired = repaired.replace(/\\(?!["\\/bfnrtu])/g, '\\\\');

  // Remove any control characters
  repaired = repaired.replace(/[\x00-\x1F\x7F]/g, '');

  return repaired;
}

/**
 * Extract and validate JSON from LLM response with repair attempts
 */
function extractAndValidateJSON(
  content: string,
  attemptRepair: boolean = true
): { sections: unknown[]; metadata: unknown } {
  // Remove markdown code fences if present
  let jsonString = content.trim();
  const fenceMatch = jsonString.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (fenceMatch) {
    jsonString = fenceMatch[1].trim();
  }

  // Remove any leading/trailing text outside JSON
  const startIdx = jsonString.indexOf('{');
  const endIdx = jsonString.lastIndexOf('}');

  if (startIdx === -1 || endIdx === -1 || endIdx <= startIdx) {
    throw new Error('No valid JSON object found in response');
  }

  jsonString = jsonString.substring(startIdx, endIdx + 1);

  // Try parsing original first
  let parsed: { sections: unknown[]; metadata: unknown } | null = null;
  let parseError: Error | null = null;

  try {
    parsed = JSON.parse(jsonString);
  } catch (error) {
    parseError = error as Error;

    if (attemptRepair) {
      logger.warn(
        'dynamic_questions.json.repair_attempt',
        'Initial parse failed, attempting repair',
        {
          error: parseError.message,
          position: parseError.message.match(/position (\d+)/)?.[1],
        }
      );

      // Try repairing the JSON
      try {
        const repairedString = repairJSON(jsonString);
        parsed = JSON.parse(repairedString);

        logger.info(
          'dynamic_questions.json.repair_success',
          'Successfully repaired and parsed JSON',
          {
            originalLength: jsonString.length,
            repairedLength: repairedString.length,
          }
        );
      } catch (repairError) {
        // If repair fails, throw original error with context
        const errorPosition = parseError.message.match(/position (\d+)/)?.[1];
        const position = errorPosition ? parseInt(errorPosition) : 0;

        logger.error('dynamic_questions.json.repair_failure', 'JSON repair attempt failed', {
          originalError: parseError.message,
          repairError: repairError instanceof Error ? repairError.message : String(repairError),
          jsonPreview: jsonString.substring(Math.max(0, position - 200), position + 200),
          errorPosition,
          totalLength: jsonString.length,
        });

        // Provide actionable error message
        throw new Error(
          `LLM generated invalid JSON that could not be automatically repaired.\n` +
            `Error: ${parseError.message}\n` +
            `Position: ${errorPosition || 'unknown'} of ${jsonString.length} characters\n` +
            `This usually means:\n` +
            `1. Response was truncated mid-generation (check max_tokens)\n` +
            `2. Model generated malformed JSON syntax\n` +
            `3. Unescaped special characters in question text\n` +
            `Please try again or contact support if the issue persists.`
        );
      }
    } else {
      throw error;
    }
  }

  if (!parsed) {
    throw new Error('Failed to parse JSON response');
  }

  // Validate structure
  if (!parsed.sections || !Array.isArray(parsed.sections)) {
    throw new Error('Response missing sections array');
  }

  // STRICT ENFORCEMENT: Require exactly 10 sections (PRD requirement)
  // Do NOT accept partial responses - this ensures consistent, complete questionnaires
  if (parsed.sections.length !== 10) {
    logger.error('dynamic_questions.validation.error', 'Incorrect number of sections in response', {
      receivedCount: parsed.sections.length,
      expected: 10,
      deviation: Math.abs(parsed.sections.length - 10),
    });
    throw new Error(
      `Response must have exactly 10 sections but received ${parsed.sections.length}. ` +
        `This violates the PRD requirement. The AI must generate all 10 sections: ` +
        `1) Learning Objectives, 2) Target Audience, 3) Content Scope, 4) Instructional Strategy, ` +
        `5) Learning Activities, 6) Assessment, 7) Resources, 8) Technology, 9) Implementation, 10) Success Metrics. ` +
        `Please retry the generation.`
    );
  }

  // Validate that all section IDs are present and sequential (s1 through s10)
  const expectedSectionIds = ['s1', 's2', 's3', 's4', 's5', 's6', 's7', 's8', 's9', 's10'];
  const actualSectionIds = parsed.sections.map((s: any) => s.id);
  const missingSectionIds = expectedSectionIds.filter((id) => !actualSectionIds.includes(id));

  if (missingSectionIds.length > 0) {
    logger.error('dynamic_questions.validation.error', 'Missing required section IDs', {
      expectedIds: expectedSectionIds,
      actualIds: actualSectionIds,
      missingIds: missingSectionIds,
    });
    throw new Error(
      `Response is missing required section IDs: ${missingSectionIds.join(', ')}. ` +
        `All sections s1 through s10 must be present in sequential order.`
    );
  }

  // Validate and sanitize each section
  for (const section of parsed.sections) {
    const sec = section as any;
    if (!sec.id || !sec.title || !sec.questions || !Array.isArray(sec.questions)) {
      // Skip invalid sections if we're dealing with truncation
      logger.warn('dynamic_questions.validation.section_skip', 'Skipping invalid section', {
        sectionId: sec.id || 'unknown',
        hasQuestions: !!sec.questions,
      });
      continue;
    }

    // Ensure description is a string
    if (sec.description && typeof sec.description !== 'string') {
      sec.description = String(sec.description);
    }

    // Be more lenient with question count
    if (sec.questions.length < 3) {
      logger.warn('dynamic_questions.validation.warning', 'Section has few questions', {
        sectionId: sec.id,
        questionCount: sec.questions.length,
      });
    }

    // Validate and sanitize each question
    for (const question of sec.questions) {
      const q = question as any;
      if (!q.id || !q.label || !q.type) {
        throw new Error(
          `Invalid question structure in section ${sec.id}: ${JSON.stringify(q).substring(0, 200)}`
        );
      }

      // Sanitize string fields to remove control characters
      if (typeof q.label === 'string') {
        q.label = q.label.replace(/[\x00-\x1F\x7F]/g, '').trim();
      }
      if (q.helpText && typeof q.helpText === 'string') {
        q.helpText = q.helpText.replace(/[\x00-\x1F\x7F]/g, '').trim();
      }
      if (q.placeholder && typeof q.placeholder === 'string') {
        q.placeholder = q.placeholder.replace(/[\x00-\x1F\x7F]/g, '').trim();
      }
    }
  }

  // Filter out any invalid sections
  const validSections = parsed.sections.filter((section: any) => {
    return (
      section.id &&
      section.title &&
      section.questions &&
      Array.isArray(section.questions) &&
      section.questions.length > 0
    );
  });

  if (validSections.length < 5) {
    logger.error(
      'dynamic_questions.validation.insufficient_valid',
      'Too few valid sections after filtering',
      {
        originalCount: parsed.sections.length,
        validCount: validSections.length,
      }
    );
    throw new Error(`Only ${validSections.length} valid sections found, minimum 5 required`);
  }

  // Update parsed object with valid sections
  parsed.sections = validSections;

  // Add metadata about repair process
  if (!parsed.metadata) {
    parsed.metadata = {};
  }
  (parsed.metadata as any).totalSections = validSections.length;
  (parsed.metadata as any).wasRepaired = attemptRepair && !!parseError;

  return parsed;
}

/**
 * Generate dynamic questions using the new V2 system with Perplexity → OpenAI fallback
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
    'Starting V2 question generation with Gemini → Perplexity fallback',
    {
      blueprintId,
    }
  );

  try {
    // Load prompts
    const systemPrompt = loadSystemPrompt();
    const userPrompt = buildUserPromptV2(staticAnswers);

    console.log('\n📄 Prompts loaded:');
    console.log('- System prompt:', systemPrompt.length, 'characters');
    console.log(
      '- User prompt:',
      userPrompt.length,
      'characters (personalized with static answers)'
    );

    logger.debug('dynamic_questions.prompts.loaded', 'Loaded prompts successfully', {
      blueprintId,
      systemPromptLength: systemPrompt.length,
      userPromptLength: userPrompt.length,
    });

    let responseContent: string | null = null;
    let usedProvider: 'claude' | 'perplexity' | null = null;
    let responseMetadata: { stopReason?: string; tokensUsed?: { input: number; output: number } } =
      {};

    // Try Gemini first (primary provider)
    if (LLM_CONFIG.claude.apiKey) {
      console.log('\n🤖 PRIMARY PROVIDER: Gemini');
      console.log('→ Model:', LLM_CONFIG.claude.model);
      console.log('→ Max Tokens:', LLM_CONFIG.claude.maxTokens);
      console.log('→ Temperature:', LLM_CONFIG.claude.temperature);

      for (let attempt = 1; attempt <= LLM_CONFIG.retries + 1; attempt++) {
        try {
          console.log(`\n⏳ Attempt ${attempt}/${LLM_CONFIG.retries + 1}: Calling Gemini...`);

          logger.info('dynamic_questions.claude.request', `Calling Gemini (attempt ${attempt})`, {
            blueprintId,
            attemptNumber: attempt,
            model: LLM_CONFIG.claude.model,
          });

          const response = await callGemini(
            systemPrompt,
            userPrompt,
            userId,
            blueprintId,
            supabase
          );
          responseContent = response.content;
          responseMetadata = {
            stopReason: response.stopReason,
            tokensUsed: response.tokensUsed,
          };
          usedProvider = 'claude';

          console.log('✅ Gemini succeeded on attempt', attempt);
          console.log('→ Stop Reason:', response.stopReason);
          console.log(
            '→ Tokens Used:',
            response.tokensUsed.input,
            'input +',
            response.tokensUsed.output,
            'output'
          );

          logger.info('dynamic_questions.claude.success', 'Gemini generation successful', {
            blueprintId,
            attemptNumber: attempt,
            stopReason: response.stopReason,
            tokensUsed: response.tokensUsed,
          });

          break; // Success, exit retry loop
        } catch (error) {
          console.error(
            `❌ Attempt ${attempt} failed:`,
            error instanceof Error ? error.message : String(error)
          );

          logger.warn('dynamic_questions.claude.error', `Gemini attempt ${attempt} failed`, {
            blueprintId,
            error: error instanceof Error ? error.message : String(error),
            attemptNumber: attempt,
          });

          if (attempt < LLM_CONFIG.retries + 1) {
            const delay = Math.pow(2, attempt - 1) * 1000; // Exponential backoff
            console.log(`⏳ Retrying in ${delay}ms...`);
            logger.debug('dynamic_questions.claude.retry', `Retrying Gemini after delay`, {
              blueprintId,
              delay,
            });
            await new Promise((resolve) => setTimeout(resolve, delay));
          }
        }
      }
    } else {
      console.log('\n⚠️  Gemini API key not configured, skipping to fallback');
      logger.warn(
        'dynamic_questions.claude.skipped',
        'Gemini API key not configured, skipping to Perplexity',
        {
          blueprintId,
        }
      );
    }

    // Fallback to Perplexity if Gemini failed or unavailable
    if (!responseContent && LLM_CONFIG.perplexity.apiKey) {
      console.log('\n🔄 FALLBACK PROVIDER: Perplexity');
      console.log('→ Model:', LLM_CONFIG.perplexity.model);
      console.log('→ Max Tokens:', LLM_CONFIG.perplexity.maxTokens);
      console.log('→ Temperature:', LLM_CONFIG.perplexity.temperature);

      logger.info('dynamic_questions.perplexity.fallback', 'Falling back to Perplexity', {
        blueprintId,
      });

      for (let attempt = 1; attempt <= LLM_CONFIG.retries + 1; attempt++) {
        try {
          console.log(`\n⏳ Attempt ${attempt}/${LLM_CONFIG.retries + 1}: Calling Perplexity...`);

          logger.info(
            'dynamic_questions.perplexity.request',
            `Calling Perplexity (attempt ${attempt})`,
            {
              blueprintId,
              attemptNumber: attempt,
              model: LLM_CONFIG.perplexity.model,
            }
          );

          responseContent = await callPerplexity(systemPrompt, userPrompt);
          usedProvider = 'perplexity';

          console.log('✅ Perplexity succeeded on attempt', attempt);

          logger.info('dynamic_questions.perplexity.success', 'Perplexity generation successful', {
            blueprintId,
            attemptNumber: attempt,
          });

          break; // Success, exit retry loop
        } catch (error) {
          logger.error(
            'dynamic_questions.perplexity.error',
            `Perplexity attempt ${attempt} failed`,
            {
              blueprintId,
              error: error instanceof Error ? error.message : String(error),
              attemptNumber: attempt,
            }
          );

          if (attempt < LLM_CONFIG.retries + 1) {
            const delay = Math.pow(2, attempt - 1) * 1000;
            logger.debug('dynamic_questions.perplexity.retry', `Retrying Perplexity after delay`, {
              blueprintId,
              delay,
            });
            await new Promise((resolve) => setTimeout(resolve, delay));
          }
        }
      }
    } else if (!responseContent) {
      logger.error('dynamic_questions.perplexity.skipped', 'Perplexity API key not configured', {
        blueprintId,
      });
    }

    if (!responseContent) {
      console.error('\n❌ ALL PROVIDERS FAILED');
      console.error('- Gemini: Failed or not configured');
      console.error('- Perplexity: Failed or not configured');
      console.log('========================================\n');
      throw new Error('All generation providers failed. Please check API keys and try again.');
    }

    // Extract and validate JSON
    console.log('\n🔍 Parsing and validating response...');
    const result = extractAndValidateJSON(responseContent);
    console.log('✓ Response validated successfully');

    const duration = Date.now() - startTime;
    const resultTyped = result as { sections: unknown[]; metadata: unknown };
    const questionCount = resultTyped.sections.reduce((sum: number, s: unknown) => {
      const sTyped = s as { questions: unknown[] };
      return sum + sTyped.questions.length;
    }, 0);

    console.log('\n✨ GENERATION COMPLETE');
    console.log('→ Provider Used:', usedProvider?.toUpperCase() || 'UNKNOWN');
    console.log('→ Sections Generated:', resultTyped.sections.length);
    console.log('→ Total Questions:', questionCount);
    console.log('→ Duration:', duration + 'ms (' + (duration / 1000).toFixed(2) + 's)');
    console.log('========================================\n');

    logger.info('dynamic_questions.generation.complete', 'Successfully generated questions', {
      blueprintId,
      provider: usedProvider,
      sectionCount: resultTyped.sections.length,
      questionCount,
      duration,
    });

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;

    console.error('\n❌ GENERATION SERVICE ERROR');
    console.error('Error:', error instanceof Error ? error.message : String(error));
    console.error('Duration before failure:', duration + 'ms');
    console.log('========================================\n');

    logger.error('dynamic_questions.generation.error', 'Failed to generate questions', {
      blueprintId,
      error: error instanceof Error ? error.message : String(error),
      duration,
    });

    throw error;
  }
}
