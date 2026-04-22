/**
 * Blueprint Validation Utilities
 * Provides parsing and validation for blueprint JSON data
 */

import { parseAndValidateJSON, stripMarkdownCodeFences } from '@/lib/claude/validation';
import { AnyBlueprint, isBlueprint, isFullBlueprint } from './schema';

/**
 * Parse and validate blueprint JSON string
 * Handles markdown code fences and validates structure
 *
 * @param jsonString - JSON string to parse (may include markdown code fences)
 * @returns Parsed and validated blueprint object
 * @throws ValidationError if JSON is invalid or blueprint structure is incorrect
 */
export function parseAndValidateBlueprintJSON(jsonString: string): AnyBlueprint {
  // Remove markdown code fences if present
  const cleanedJson = stripMarkdownCodeFences(jsonString);

  // Parse JSON using Gemini validation utility
  const parsed = parseAndValidateJSON<any>(cleanedJson);

  // Basic validation - ensure it's an object
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Parsed blueprint is not an object');
  }

  // Check if it's a valid blueprint structure
  if (!isBlueprint(parsed) && !isFullBlueprint(parsed)) {
    // For legacy blueprints or flexible formats, allow any object with minimal validation
    if (!parsed.metadata && !parsed.title) {
      throw new Error('Blueprint missing required metadata or title');
    }
  }

  return parsed as AnyBlueprint;
}

/**
 * Safely parse blueprint JSON with error handling
 * Returns null instead of throwing on error
 *
 * @param jsonString - JSON string to parse
 * @returns Parsed blueprint or null if invalid
 */
export function safeParseBlueprint(jsonString: string): AnyBlueprint | null {
  try {
    return parseAndValidateBlueprintJSON(jsonString);
  } catch (error) {
    console.error('Failed to parse blueprint:', error);
    return null;
  }
}

/**
 * Validate blueprint object structure
 *
 * @param blueprint - Blueprint object to validate
 * @returns True if valid, false otherwise
 */
export function validateBlueprintStructure(blueprint: unknown): boolean {
  return isBlueprint(blueprint) || isFullBlueprint(blueprint);
}

/**
 * Re-export validation utilities from Gemini validation
 */
export { parseAndValidateJSON, stripMarkdownCodeFences } from '@/lib/claude/validation';
