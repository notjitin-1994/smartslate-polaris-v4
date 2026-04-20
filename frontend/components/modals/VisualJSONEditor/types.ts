/**
 * Type definitions for VisualJSONEditor
 */

export type JsonPrimitive = string | number | boolean | null;
export type JsonArray = JsonValue[];
export type JsonObject = { [key: string]: JsonValue };
export type JsonValue = JsonPrimitive | JsonObject | JsonArray;

/**
 * Field metadata for enhanced UX
 */
export interface FieldMetadata {
  label: string;
  description?: string;
  type: 'text' | 'textarea' | 'number' | 'boolean' | 'date' | 'array' | 'object';
  validation?: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    pattern?: RegExp;
  };
  placeholder?: string;
  hint?: string;
}

/**
 * Editor configuration
 */
export interface EditorConfig {
  autoSaveInterval?: number; // milliseconds
  historyLimit?: number; // max undo/redo states
  enableRichText?: boolean;
  enablePreview?: boolean;
}
