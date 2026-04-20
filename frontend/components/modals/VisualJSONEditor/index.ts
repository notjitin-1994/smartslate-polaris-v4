/**
 * VisualJSONEditor - World-class JSON editing experience
 *
 * Export all public APIs for easy imports
 */

export { VisualJSONEditor } from '../VisualJSONEditor';
export { EditorPanel } from './EditorPanel';
export { PreviewPanel } from './PreviewPanel';

// Types
export type {
  JsonValue,
  JsonObject,
  JsonArray,
  JsonPrimitive,
  FieldMetadata,
  EditorConfig,
} from './types';
export type { ValidationError } from './validation';

// Utilities
export {
  humanizeFieldName,
  getFieldDescription,
  inferFieldMetadata,
  getArrayItemLabel,
  getPlaceholder,
} from './fieldUtils';

export { validateJSONStructure, getErrorForPath } from './validation';

// Hooks
export { useEditorHistory } from './useEditorHistory';
export { useAutoSave, loadDraft, clearDraft } from './useAutoSave';
