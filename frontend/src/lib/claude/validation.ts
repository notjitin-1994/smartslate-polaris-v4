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
 * Parse and validate JSON response
 * Throws ValidationError if response is not valid JSON
 */
export function parseAndValidateJSON<T = unknown>(text: string): T {
  if (!text || typeof text !== 'string') {
    throw new ValidationError('Response text is empty or not a string', 'EMPTY_RESPONSE', { text });
  }

  // Check for markdown code fences
  const hasCodeFences = /^```/.test(text) || /```$/.test(text);
  if (hasCodeFences) {
    logger.warn('claude.validation.markdown_detected', {
      textPreview: text.substring(0, 100),
    });

    text = stripMarkdownCodeFences(text);
  }

  // Try to parse JSON
  try {
    const parsed = JSON.parse(text);
    return parsed as T;
  } catch (error) {
    throw new ValidationError('Response is not valid JSON', 'INVALID_JSON', {
      textPreview: text.substring(0, 500),
      error: (error as Error).message,
    });
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

      logger.warn('claude.validation.missing_display_type', {
        section: sectionKey,
      });
    }
  }

  // Log warning but don't fail validation for missing displayType
  // The normalization step will add defaults
  if (sectionsWithoutDisplayType.length > 0) {
    logger.info('claude.validation.sections_missing_display_type', {
      count: sectionsWithoutDisplayType.length,
      sections: sectionsWithoutDisplayType,
    });
  }
}

/**
 * Normalize blueprint by adding default displayType where missing
 * Returns normalized blueprint
 */
export function normalizeBlueprintStructure(blueprint: any): any {
  if (!blueprint || typeof blueprint !== 'object') {
    return blueprint;
  }

  const normalized = { ...blueprint };

  // Get all sections (excluding metadata)
  const sections = Object.keys(normalized).filter((key) => key !== 'metadata');

  // Add default displayType to sections missing it
  for (const sectionKey of sections) {
    const section = normalized[sectionKey];

    if (section && typeof section === 'object' && !section.displayType) {
      section.displayType = 'markdown'; // Default to markdown

      logger.info('claude.validation.added_default_display_type', {
        section: sectionKey,
        displayType: 'markdown',
      });
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

  logger.info('claude.validation.success', {
    hasMetadata: !!normalized.metadata,
    sectionCount: Object.keys(normalized).filter((k) => k !== 'metadata').length,
  });

  return normalized;
}
