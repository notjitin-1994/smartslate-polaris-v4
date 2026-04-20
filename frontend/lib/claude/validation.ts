/**
 * Gemini Response Validation
 * Ensures responses are valid JSON and conform to expected structure
 */

import { createServiceLogger } from '@/lib/logging';

const logger = createServiceLogger('claude-validation');

export class ValidationError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Remove markdown code fences from text
 * Handles ```json ... ``` and ``` ... ``` formats
 */
export function stripMarkdownCodeFences(text: string): string {
  // Remove markdown code fences (```json or ``` at start and ``` at end)
  const cleaned = text
    .replace(/^```(?:json)?\s*\n/i, '')
    .replace(/\n```\s*$/, '')
    .trim();

  return cleaned;
}

/**
 * Intelligently repair truncated JSON by finding the last complete structure
 * Handles arrays and objects that were cut off mid-generation
 * Enhanced to preserve as much valid data as possible
 */
function repairTruncatedJSON(jsonString: string): string {
  let repaired = jsonString.trim();

  // Count opening and closing brackets
  const openBraces = (repaired.match(/{/g) || []).length;
  const closeBraces = (repaired.match(/}/g) || []).length;
  const openBrackets = (repaired.match(/\[/g) || []).length;
  const closeBrackets = (repaired.match(/]/g) || []).length;

  // If JSON is already balanced, return as-is
  if (openBraces === closeBraces && openBrackets === closeBrackets) {
    return repaired;
  }

  logger.warn(
    'claude.validation.json_truncation_detected',
    'JSON appears truncated, attempting repair',
    {
      openBraces,
      closeBraces,
      openBrackets,
      closeBrackets,
      length: repaired.length,
    }
  );

  // Strategy 1: Try to complete the last incomplete value
  // Look for patterns that indicate where the JSON was cut off
  const lastChars = repaired.slice(-100);

  // Check if we're in the middle of a string value
  const lastQuoteIndex = repaired.lastIndexOf('"');
  const secondLastQuoteIndex = repaired.lastIndexOf('"', lastQuoteIndex - 1);

  // If odd number of quotes after last colon/comma, we're mid-string
  if (lastQuoteIndex > -1) {
    const afterLastStructure = Math.max(
      repaired.lastIndexOf(','),
      repaired.lastIndexOf(':'),
      repaired.lastIndexOf('{'),
      repaired.lastIndexOf('[')
    );
    const quotesAfter = (repaired.slice(afterLastStructure).match(/"/g) || []).length;

    if (quotesAfter % 2 === 1) {
      // Close the string and remove any partial content after it
      repaired = repaired.substring(0, lastQuoteIndex + 1);
      logger.info('claude.validation.closed_incomplete_string', 'Closed incomplete string value');
    }
  }

  // Strategy 2: Find the last complete key-value pair or array element
  let bestValidPosition = -1;
  const depth = { braces: 0, brackets: 0 };
  let inString = false;
  let escapeNext = false;
  let lastCompleteValueEnd = -1;

  for (let i = 0; i < repaired.length; i++) {
    const char = repaired[i];

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
      if (!inString) {
        // End of a string value
        lastCompleteValueEnd = i;
      }
      continue;
    }

    if (!inString) {
      if (char === '{') depth.braces++;
      else if (char === '}') {
        depth.braces--;
        lastCompleteValueEnd = i;
      } else if (char === '[') depth.brackets++;
      else if (char === ']') {
        depth.brackets--;
        lastCompleteValueEnd = i;
      } else if (char === ',' && depth.braces > 0) {
        // Comma indicates end of a complete element
        lastCompleteValueEnd = i - 1;
      }

      // If we're balanced at this point, mark it as a valid endpoint
      if (depth.braces === 0 && depth.brackets === 0 && (char === '}' || char === ']')) {
        bestValidPosition = i;
      }
    }
  }

  if (bestValidPosition > 0 && bestValidPosition < repaired.length - 1) {
    logger.info('claude.validation.truncating_to_valid', 'Truncating to last valid JSON position', {
      originalLength: repaired.length,
      truncatedLength: bestValidPosition + 1,
      removedChars: repaired.length - bestValidPosition - 1,
    });
    repaired = repaired.substring(0, bestValidPosition + 1);
  } else if (lastCompleteValueEnd > 0 && lastCompleteValueEnd < repaired.length - 1) {
    // Truncate to last complete value and close structures
    logger.info('claude.validation.truncating_to_last_value', 'Truncating to last complete value', {
      position: lastCompleteValueEnd,
    });

    repaired = repaired.substring(0, lastCompleteValueEnd + 1);

    // Remove trailing comma if present
    repaired = repaired.replace(/,\s*$/, '');

    // Recount brackets after truncation
    const finalOpenBraces = (repaired.match(/{/g) || []).length;
    const finalCloseBraces = (repaired.match(/}/g) || []).length;
    const finalOpenBrackets = (repaired.match(/\[/g) || []).length;
    const finalCloseBrackets = (repaired.match(/]/g) || []).length;

    // Add missing closing brackets in the correct order
    // Track nesting to close in proper order
    const toClose = [];
    const tempDepth = { braces: 0, brackets: 0 };

    for (let i = 0; i < repaired.length; i++) {
      const char = repaired[i];
      if (char === '{') {
        toClose.push('}');
        tempDepth.braces++;
      } else if (char === '[') {
        toClose.push(']');
        tempDepth.brackets++;
      } else if (char === '}') {
        const idx = toClose.lastIndexOf('}');
        if (idx > -1) toClose.splice(idx, 1);
        tempDepth.braces--;
      } else if (char === ']') {
        const idx = toClose.lastIndexOf(']');
        if (idx > -1) toClose.splice(idx, 1);
        tempDepth.brackets--;
      }
    }

    // Add the missing closures in reverse order
    repaired += toClose.reverse().join('');

    logger.info('claude.validation.added_closures', 'Added missing closures', {
      added: toClose.reverse().join(''),
    });
  } else {
    // Strategy 3: Clean up and close - last resort
    logger.warn('claude.validation.emergency_repair', 'Using emergency repair strategy', {
      missingBraces: openBraces - closeBraces,
      missingBrackets: openBrackets - closeBrackets,
    });

    // Remove any trailing incomplete content
    repaired = repaired.replace(/,\s*$/, ''); // Remove trailing comma
    repaired = repaired.replace(/:\s*$/, ''); // Remove trailing colon
    repaired = repaired.replace(/:\s*"[^"]*$/, '": ""'); // Complete incomplete string value
    repaired = repaired.replace(/"\s*[^"]*$/, '"'); // Close unclosed string

    // Add missing closing brackets
    const bracketDiff = openBrackets - closeBrackets;
    const braceDiff = openBraces - closeBraces;

    for (let i = 0; i < bracketDiff; i++) {
      repaired += ']';
    }
    for (let i = 0; i < braceDiff; i++) {
      repaired += '}';
    }
  }

  return repaired;
}

/**
 * Parse and validate JSON response
 * Throws ValidationError if response is not valid JSON
 * Enhanced to handle truncation and various edge cases
 */
export function parseAndValidateJSON<T = unknown>(text: string): T {
  if (!text || typeof text !== 'string') {
    throw new ValidationError('Response text is empty or not a string', 'EMPTY_RESPONSE', { text });
  }

  // Trim whitespace first
  text = text.trim();

  // Check for markdown code fences more aggressively
  const hasCodeFences = /^```/i.test(text) || /```$/i.test(text);
  if (hasCodeFences) {
    logger.warn('claude.validation.markdown_detected', 'Markdown code fences detected', {
      textPreview: text.substring(0, 200),
    });

    text = stripMarkdownCodeFences(text);

    // Log cleaned text preview for debugging
    logger.debug('claude.validation.cleaned_text', 'Text after removing markdown', {
      cleanedPreview: text.substring(0, 200),
    });
  }

  // Additional cleanup - remove any non-JSON content before first { or [
  const jsonStartMatch = text.match(/^[^{[]*([{[])/);
  if (jsonStartMatch && jsonStartMatch.index !== 0) {
    logger.warn('claude.validation.removing_preamble', 'Removing preamble text', {
      removedText: text.substring(0, jsonStartMatch.index),
    });
    text = text.substring(text.indexOf(jsonStartMatch[1]));
  }

  // Remove any trailing non-JSON content after last } or ]
  const lastBrace = Math.max(text.lastIndexOf('}'), text.lastIndexOf(']'));
  if (lastBrace > -1 && lastBrace < text.length - 1) {
    const trailingContent = text.substring(lastBrace + 1).trim();
    if (trailingContent) {
      logger.warn('claude.validation.removing_trailing', 'Removing trailing text', {
        removedText: trailingContent.substring(0, 200), // Limit logged content
      });
      text = text.substring(0, lastBrace + 1);
    }
  }

  // Try to parse JSON
  try {
    const parsed = JSON.parse(text);
    return parsed as T;
  } catch (error) {
    // JSON parse failed - attempt aggressive repair
    logger.warn(
      'claude.validation.attempting_repair',
      'Initial JSON parse failed, attempting repair',
      {
        error: (error as Error).message,
        textLength: text.length,
      }
    );

    try {
      const repairedText = repairTruncatedJSON(text);
      const parsed = JSON.parse(repairedText);

      logger.info('claude.validation.repair_success', 'Successfully repaired and parsed JSON', {
        originalLength: text.length,
        repairedLength: repairedText.length,
      });

      return parsed as T;
    } catch (repairError) {
      // Log more details for debugging
      logger.error('claude.validation.json_parse_error', 'Failed to parse JSON after repair', {
        textLength: text.length,
        textStart: text.substring(0, 100),
        textEnd: text.substring(Math.max(0, text.length - 100)),
        originalError: (error as Error).message,
        repairError: (repairError as Error).message,
      });

      throw new ValidationError('Response is not valid JSON and repair failed', 'INVALID_JSON', {
        textPreview: text.substring(0, 500),
        originalError: (error as Error).message,
        repairError: (repairError as Error).message,
      });
    }
  }
}

/**
 * Validate blueprint JSON structure
 * Ensures required fields and displayType metadata are present
 */
export function validateBlueprintStructure(blueprint: any): void {
  if (!blueprint || typeof blueprint !== 'object') {
    throw new ValidationError('Blueprint is not an object', 'INVALID_STRUCTURE', { blueprint });
  }

  // Validate metadata exists
  if (!blueprint.metadata || typeof blueprint.metadata !== 'object') {
    throw new ValidationError('Blueprint missing required metadata section', 'MISSING_METADATA', {
      blueprint,
    });
  }

  // Validate metadata fields
  const requiredMetadataFields = ['title', 'organization', 'role', 'generated_at'];
  for (const field of requiredMetadataFields) {
    if (!blueprint.metadata[field]) {
      throw new ValidationError(
        `Blueprint metadata missing required field: ${field}`,
        'MISSING_METADATA_FIELD',
        { field, metadata: blueprint.metadata }
      );
    }
  }

  // Get all sections (excluding metadata)
  const sections = Object.keys(blueprint).filter((key) => key !== 'metadata');

  if (sections.length === 0) {
    throw new ValidationError('Blueprint has no content sections', 'NO_SECTIONS', { blueprint });
  }

  // Validate each section has displayType
  const sectionsWithoutDisplayType: string[] = [];

  for (const sectionKey of sections) {
    const section = blueprint[sectionKey];

    if (section && typeof section === 'object' && !section.displayType) {
      sectionsWithoutDisplayType.push(sectionKey);

      logger.warn('claude.validation.missing_display_type', 'Section missing displayType', {
        section: sectionKey,
      });
    }
  }

  // Log warning but don't fail validation for missing displayType
  // The normalization step will add defaults
  if (sectionsWithoutDisplayType.length > 0) {
    logger.info('claude.validation.sections_missing_display_type', 'Sections need displayType', {
      count: sectionsWithoutDisplayType.length,
      sections: sectionsWithoutDisplayType,
    });
  }
}

/**
 * Infer appropriate displayType based on section content structure
 * Returns the best matching display type
 */
function inferDisplayType(sectionKey: string, section: any): string {
  // Check for specific data structures that indicate visualization types

  // Timeline: has phases, modules with dates, or similar temporal data
  if (section.phases || section.modules || section.timeline) {
    if (Array.isArray(section.phases) && section.phases[0]?.start_date) {
      return 'timeline';
    }
    if (Array.isArray(section.modules) && section.modules[0]?.duration) {
      return 'timeline';
    }
  }

  // Table: has structured lists of similar objects or budget/resource data
  if (section.risks || section.human_resources || section.tools_and_platforms) {
    if (Array.isArray(section.risks) || Array.isArray(section.human_resources)) {
      return 'table';
    }
  }

  // Infographic: has rich data for visualization
  if (section.objectives || section.kpis || section.metrics || section.demographics) {
    return 'infographic';
  }

  // Chart: has explicit chart configuration or quantitative data
  if (section.chartConfig || section.chartType) {
    return 'chart';
  }

  // Check section key for hints
  const keyLower = sectionKey.toLowerCase();
  if (
    keyLower.includes('timeline') ||
    keyLower.includes('schedule') ||
    keyLower.includes('implementation')
  ) {
    return 'timeline';
  }
  if (keyLower.includes('resource') || keyLower.includes('budget') || keyLower.includes('risk')) {
    return 'table';
  }
  if (
    keyLower.includes('metric') ||
    keyLower.includes('kpi') ||
    keyLower.includes('objective') ||
    keyLower.includes('audience') ||
    keyLower.includes('assessment')
  ) {
    return 'infographic';
  }

  // Default to markdown for text-heavy content
  return 'markdown';
}

/**
 * Normalize blueprint by adding intelligent displayType where missing
 * Returns normalized blueprint with inferred display types
 */
export function normalizeBlueprintStructure(blueprint: any): any {
  if (!blueprint || typeof blueprint !== 'object') {
    return blueprint;
  }

  const normalized = { ...blueprint };

  // Get all sections (excluding metadata and internal fields)
  const sections = Object.keys(normalized).filter(
    (key) => key !== 'metadata' && !key.startsWith('_')
  );

  // Add intelligent displayType to sections missing it
  for (const sectionKey of sections) {
    const section = normalized[sectionKey];

    if (section && typeof section === 'object') {
      if (!section.displayType) {
        // Infer appropriate displayType based on content
        section.displayType = inferDisplayType(sectionKey, section);

        logger.info('claude.validation.inferred_display_type', 'Inferred displayType', {
          section: sectionKey,
          displayType: section.displayType,
          hasObjectives: !!section.objectives,
          hasPhases: !!section.phases,
          hasModules: !!section.modules,
          hasMetrics: !!section.metrics || !!section.kpis,
        });
      }

      // Validate displayType is a known value
      const validTypes = ['infographic', 'timeline', 'chart', 'table', 'markdown'];
      if (!validTypes.includes(section.displayType)) {
        logger.warn('claude.validation.invalid_display_type', 'Invalid displayType', {
          section: sectionKey,
          invalidType: section.displayType,
          defaultingTo: 'markdown',
        });
        section.displayType = 'markdown';
      }
    }
  }

  return normalized;
}

/**
 * Full validation and normalization pipeline
 * Parse JSON, validate structure, and normalize
 */
export function validateAndNormalizeBlueprint(text: string): any {
  // Step 1: Parse JSON and strip markdown if present
  const blueprint = parseAndValidateJSON(text);

  // Step 2: Validate structure
  validateBlueprintStructure(blueprint);

  // Step 3: Normalize (add defaults where needed)
  const normalized = normalizeBlueprintStructure(blueprint);

  logger.info('claude.validation.success', 'Blueprint validation successful', {
    hasMetadata: !!normalized.metadata,
    sectionCount: Object.keys(normalized).filter((k) => k !== 'metadata').length,
  });

  return normalized;
}
