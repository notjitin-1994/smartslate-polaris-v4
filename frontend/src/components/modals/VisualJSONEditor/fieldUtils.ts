/**
 * Utilities for smart field label generation and metadata
 */

import type { FieldMetadata } from './types';

/**
 * Convert technical JSON keys to human-readable labels
 * Examples:
 * - "overview" → "Overview"
 * - "key_points" → "Key Points"
 * - "learning_objectives" → "Learning Objectives"
 * - "targetAudience" → "Target Audience"
 */
export function humanizeFieldName(key: string): string {
  // Handle common abbreviations
  const abbreviations: Record<string, string> = {
    id: 'ID',
    url: 'URL',
    api: 'API',
    ui: 'UI',
    ux: 'UX',
    html: 'HTML',
    css: 'CSS',
    js: 'JavaScript',
    ai: 'AI',
    ml: 'ML',
  };

  // Split by underscores or camelCase
  const words = key
    .replace(/([A-Z])/g, ' $1') // Insert space before capitals
    .replace(/_/g, ' ') // Replace underscores with spaces
    .replace(/-/g, ' ') // Replace hyphens with spaces
    .trim()
    .split(/\s+/);

  // Capitalize and handle abbreviations
  return words
    .map((word) => {
      const lower = word.toLowerCase();
      if (abbreviations[lower]) {
        return abbreviations[lower];
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
}

/**
 * Get field description based on common patterns
 */
export function getFieldDescription(key: string): string | undefined {
  const descriptions: Record<string, string> = {
    overview: 'A high-level summary of this section',
    description: 'Detailed description or explanation',
    title: 'The title or heading for this item',
    content: 'Main content or body text',
    summary: 'Brief summary or overview',
    objectives: 'Learning objectives or goals',
    prerequisites: 'Required knowledge or preparation',
    duration: 'Estimated time required',
    difficulty: 'Difficulty level or complexity',
    key_points: 'Main points or takeaways',
    learning_objectives: 'What learners will achieve',
    target_audience: 'Intended audience for this content',
    resources: 'Additional resources or materials',
    notes: 'Additional notes or comments',
    tags: 'Keywords or categories',
    author: 'Content author or creator',
    created_at: 'Creation date and time',
    updated_at: 'Last update date and time',
  };

  return descriptions[key.toLowerCase()];
}

/**
 * Infer field metadata from key and value
 */
export function inferFieldMetadata(key: string, value: unknown): FieldMetadata {
  const label = humanizeFieldName(key);
  const description = getFieldDescription(key);

  // Infer type from value
  if (value === null) {
    return {
      label,
      description,
      type: 'text',
    };
  }

  if (typeof value === 'boolean') {
    return {
      label,
      description,
      type: 'boolean',
    };
  }

  if (typeof value === 'number') {
    return {
      label,
      description,
      type: 'number',
    };
  }

  if (typeof value === 'string') {
    // Check for dates
    if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
      return {
        label,
        description,
        type: 'date',
      };
    }

    // Long text = textarea
    if (value.length > 100) {
      return {
        label,
        description,
        type: 'textarea',
        validation: {
          maxLength: 5000,
        },
      };
    }

    return {
      label,
      description,
      type: 'text',
      validation: {
        maxLength: 500,
      },
    };
  }

  if (Array.isArray(value)) {
    return {
      label,
      description,
      type: 'array',
    };
  }

  return {
    label,
    description,
    type: 'object',
  };
}

/**
 * Get a user-friendly label for array items
 * Examples:
 * - key="objectives", index=0 → "Objective 1"
 * - key="resources", index=2 → "Resource 3"
 */
export function getArrayItemLabel(arrayKey: string, index: number): string {
  const singular = arrayKey.endsWith('s') ? arrayKey.slice(0, -1) : arrayKey;
  return `${humanizeFieldName(singular)} ${index + 1}`;
}

/**
 * Get placeholder text for a field
 */
export function getPlaceholder(key: string, type: string): string {
  const placeholders: Record<string, string> = {
    title: 'Enter a title...',
    description: 'Enter a description...',
    overview: 'Provide an overview...',
    content: 'Enter content...',
    summary: 'Write a summary...',
    notes: 'Add notes...',
    tags: 'Enter tags separated by commas...',
    author: 'Author name...',
  };

  if (placeholders[key.toLowerCase()]) {
    return placeholders[key.toLowerCase()];
  }

  if (type === 'textarea') {
    return `Enter ${humanizeFieldName(key).toLowerCase()}...`;
  }

  if (type === 'number') {
    return '0';
  }

  if (type === 'date') {
    return 'YYYY-MM-DD';
  }

  return `Enter ${humanizeFieldName(key).toLowerCase()}...`;
}
