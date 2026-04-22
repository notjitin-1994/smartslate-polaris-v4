/**
 * Blueprint Schema Types
 * Unified types for blueprint data across the application
 */

import { Blueprint as SchemaBlueprint, FullBlueprint } from '@/lib/schemas/blueprintSchema';

/**
 * Standard Blueprint type from schema
 */
export type Blueprint = SchemaBlueprint;

/**
 * AnyBlueprint - Union type that can represent any blueprint format
 * This allows flexibility for legacy blueprints and different blueprint structures
 */
export type AnyBlueprint = Blueprint | FullBlueprint | Record<string, any>;

/**
 * Type guard to check if a blueprint is a FullBlueprint
 */
export function isFullBlueprint(blueprint: unknown): blueprint is FullBlueprint {
  if (!blueprint || typeof blueprint !== 'object') {
    return false;
  }

  const bp = blueprint as Record<string, any>;

  // Check for required Blueprint fields
  const hasBasicFields =
    typeof bp.title === 'string' &&
    typeof bp.overview === 'string' &&
    Array.isArray(bp.learningObjectives) &&
    Array.isArray(bp.modules);

  if (!hasBasicFields) {
    return false;
  }

  // Check for FullBlueprint-specific fields
  const hasFullBlueprintFeatures =
    bp.modules.some((m: any) => m.content !== undefined || m.quizzes !== undefined) ||
    bp.assessmentStrategy !== undefined ||
    bp.pathways !== undefined;

  return hasFullBlueprintFeatures;
}

/**
 * Type guard to check if a value is a valid Blueprint
 */
export function isBlueprint(value: unknown): value is Blueprint {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const bp = value as Record<string, any>;

  return (
    typeof bp.title === 'string' &&
    typeof bp.overview === 'string' &&
    Array.isArray(bp.learningObjectives) &&
    Array.isArray(bp.modules)
  );
}

/**
 * Type guard to check if a value is any valid blueprint type
 */
export function isAnyBlueprint(value: unknown): value is AnyBlueprint {
  return isBlueprint(value) || isFullBlueprint(value);
}

/**
 * Re-export types from schemas for convenience
 */
export type { FullBlueprint } from '@/lib/schemas/blueprintSchema';
export {
  blueprintSchema,
  fullBlueprintSchema,
  validateBlueprint,
  validateFullBlueprint,
  normalizeBlueprint,
} from '@/lib/schemas/blueprintSchema';
