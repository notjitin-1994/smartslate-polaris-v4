# Edit Section Data Loss Bug Fix - Detailed Analysis

## Problem Description

When users clicked the "Edit Section" button in the blueprint dashboard and modified a single field in the modal editor, saving the changes would **delete all other fields** in that section, keeping only the modified field.

### Example Scenario

- User opens "Learning Objectives" section for editing
- Section contains: `objectives`, `chartConfig`, `overview`, etc.
- User edits only the `overview` field
- After saving, the entire section is replaced with just: `{ overview: "new value" }`
- All other fields (`objectives`, `chartConfig`, etc.) are **lost**

## Root Cause Analysis

The issue was in the **recursive data update logic** within the `EditorPanel` component.

### The Data Flow

```
User clicks Edit → VisualJSONEditor opens → EditorPanel renders nested fields
User edits field → updateValue() called → onUpdate() propagates changes up
Save clicked → handleSave() sends data to API → API replaces section
```

### The Bug

The bug was in `EditorPanel.tsx` lines 66-107 (before fix):

```typescript
function EditorNode({ data, path, onUpdate, validationErrors, propertyKey }: EditorNodeProps) {
  const updateValue = useCallback(
    (newValue: JsonValue) => {
      const updateAtPath = (current: JsonValue, pathSegments: (string | number)[]): JsonValue => {
        // ... recursive update logic
      };

      // BUG: Using local 'data' instead of root data
      const rootData = path.length === 0 ? newValue : updateAtPath(data, path);
      onUpdate(rootData);
    },
    [data, path, onUpdate]
  );
}
```

**The Problem:**

- Each nested `EditorNode` component only receives its **slice** of the data tree via the `data` prop
- When `updateAtPath(data, path)` is called from a deeply nested component, `data` is only that component's local data, **not the complete root data structure**
- Example: If editing `objectives[0].description`, the `EditorNode` only has access to the `objectives` array, not the full `learning_objectives` object
- When reconstructing the update, it only has partial data, so the rest gets lost

### Visual Example

**Original Data Structure:**

```json
{
  "learning_objectives": {
    "objectives": [...],
    "chartConfig": {...},
    "overview": "Original text"
  }
}
```

**When editing `overview` field:**

```
Root EditorNode (data = learning_objectives object, path = [])
  ├─ Object EditorNode (data = objectives array, path = ["objectives"])
  ├─ Object EditorNode (data = chartConfig object, path = ["chartConfig"])
  └─ Primitive EditorNode (data = "Original text", path = ["overview"])  ← Editing here
```

**Before Fix:**

- Primitive EditorNode has: `data = "Original text"`, `path = ["overview"]`
- Calls `updateAtPath("Original text", ["overview"])` ← WRONG! Should use root data
- Result: Returns only `{ overview: "New text" }`, losing `objectives` and `chartConfig`

**After Fix:**

- Primitive EditorNode has: `data = "Original text"`, `rootData = {objectives, chartConfig, overview}`
- Calls `updateAtPath(rootData, ["overview"])` ← CORRECT!
- Result: Returns `{ objectives: [...], chartConfig: {...}, overview: "New text" }`

## The Solution

### Changes Made to `EditorPanel.tsx`

1. **Added `rootData` prop to `EditorNodeProps` interface:**

```typescript
interface EditorNodeProps {
  data: JsonValue;
  path: (string | number)[];
  onUpdate: (newData: JsonValue) => void;
  validationErrors: ValidationError[];
  propertyKey?: string;
  rootData?: JsonValue; // NEW: Pass complete data structure
}
```

2. **Modified `EditorNode` to use root data for updates:**

```typescript
function EditorNode({
  data,
  path,
  onUpdate,
  validationErrors,
  propertyKey,
  rootData,
}: EditorNodeProps) {
  // Use rootData if provided, otherwise use data (for top-level component)
  const actualRootData = rootData ?? data;

  const updateValue = useCallback(
    (newValue: JsonValue) => {
      const updateAtPath = (current: JsonValue, pathSegments: (string | number)[]): JsonValue => {
        // ... same recursive logic
      };

      // FIX: Always update from root data to preserve entire structure
      const updatedRootData = path.length === 0 ? newValue : updateAtPath(actualRootData, path);
      onUpdate(updatedRootData);
    },
    [actualRootData, path, onUpdate] // Changed dependency from 'data' to 'actualRootData'
  );
}
```

3. **Updated recursive calls to pass `rootData` down:**

For array items (line 213-220):

```typescript
<EditorNode
  data={item}
  path={[...path, index]}
  onUpdate={onUpdate}
  validationErrors={validationErrors}
  rootData={actualRootData}  // NEW: Pass root data down
/>
```

For object properties (line 291-299):

```typescript
<EditorNode
  key={key}
  data={value}
  path={[...path, key]}
  onUpdate={onUpdate}
  validationErrors={validationErrors}
  propertyKey={key}
  rootData={actualRootData}  // NEW: Pass root data down
/>
```

## How the Fix Works

### Before (Broken Behavior)

```
1. User edits field → updateValue() called
2. updateAtPath(localData, ["field"]) ← Only has partial data
3. Returns incomplete structure
4. API saves incomplete data → DATA LOSS
```

### After (Fixed Behavior)

```
1. User edits field → updateValue() called
2. updateAtPath(rootData, ["field"]) ← Has complete data structure
3. Navigates path, updates only the target field
4. Returns complete structure with one field modified
5. API saves complete data → ALL DATA PRESERVED ✓
```

## Key Principles Applied

1. **Immutable Updates**: The fix maintains React best practices by creating new objects/arrays via spread operators
2. **Path-Based Navigation**: Uses path array to navigate to the exact field, preserving all sibling fields
3. **Root Data Propagation**: Ensures every nested component has access to the complete data structure
4. **Backward Compatible**: Top-level component still works the same way (`rootData ?? data`)

## Testing Recommendations

1. **Single Field Edit**: Edit one field, verify all others remain intact
2. **Nested Field Edit**: Edit a deeply nested field (e.g., `objectives[0].description`)
3. **Array Item Edit**: Modify an item in an array, ensure other items aren't affected
4. **Multiple Edits**: Edit multiple fields before saving
5. **Complex Sections**: Test with sections that have many nested levels

## Files Modified

- `/home/jitin-m-nair/Desktop/polaris-v3/frontend/components/modals/VisualJSONEditor/EditorPanel.tsx`
  - Lines 66-73: Added `rootData` prop to interface
  - Lines 75-82: Updated component signature
  - Lines 85-86: Added `actualRootData` logic
  - Line 115: Fixed to use `actualRootData` instead of `data`
  - Line 118: Updated dependency array
  - Line 218: Pass `rootData` to array item nodes
  - Line 298: Pass `rootData` to object property nodes

## Related Components (No Changes Needed)

- `VisualJSONEditor.tsx`: Already correctly handles full data structure
- `InteractiveBlueprintDashboard.tsx`: Correctly passes section data
- `/api/blueprints/update-section/route.ts`: API works correctly, just replaces section

## Summary

The fix ensures that when editing any field in a section, the **complete section data structure** is always available during the update process. This prevents data loss by making sure that when we update one field, we're updating it within the context of the complete data, not just a slice of it.

The solution is elegant because it:

- ✅ Preserves the existing recursive component structure
- ✅ Maintains React immutability patterns
- ✅ Requires minimal code changes
- ✅ Has no breaking changes to the API or other components
- ✅ Is type-safe with TypeScript
