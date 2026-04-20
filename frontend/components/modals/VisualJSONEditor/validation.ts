/**
 * Validation utilities for JSON editor
 */

import type { JsonValue } from './types';

export interface ValidationError {
  path: (string | number)[];
  message: string;
  severity: 'error' | 'warning';
}

/**
 * Validate JSON structure and content
 */
export function validateJSONStructure(data: JsonValue): ValidationError[] {
  const errors: ValidationError[] = [];

  function validateRecursive(value: JsonValue, path: (string | number)[]): void {
    if (value === null) return;

    if (typeof value === 'string') {
      // Warn about very long strings
      if (value.length > 5000) {
        errors.push({
          path,
          message:
            'Text is very long (>5000 characters). Consider breaking it into smaller sections.',
          severity: 'warning',
        });
      }

      // Warn about potential HTML injection
      if (/<script/i.test(value)) {
        errors.push({
          path,
          message: 'Contains potentially unsafe HTML tags',
          severity: 'error',
        });
      }
    }

    if (typeof value === 'number') {
      // Check for NaN or Infinity
      if (!Number.isFinite(value)) {
        errors.push({
          path,
          message: 'Invalid number value (NaN or Infinity)',
          severity: 'error',
        });
      }
    }

    if (Array.isArray(value)) {
      // Warn about very large arrays
      if (value.length > 100) {
        errors.push({
          path,
          message: `Array has ${value.length} items. Performance may be affected.`,
          severity: 'warning',
        });
      }

      value.forEach((item, index) => {
        validateRecursive(item, [...path, index]);
      });
    }

    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      const keys = Object.keys(value);

      // Warn about very large objects
      if (keys.length > 50) {
        errors.push({
          path,
          message: `Object has ${keys.length} keys. Consider restructuring.`,
          severity: 'warning',
        });
      }

      keys.forEach((key) => {
        validateRecursive((value as Record<string, JsonValue>)[key], [...path, key]);
      });
    }
  }

  validateRecursive(data, []);
  return errors;
}

/**
 * Get validation error for a specific path
 */
export function getErrorForPath(
  errors: ValidationError[],
  path: (string | number)[]
): ValidationError | undefined {
  return errors.find(
    (error) =>
      error.path.length === path.length &&
      error.path.every((segment, index) => segment === path[index])
  );
}
