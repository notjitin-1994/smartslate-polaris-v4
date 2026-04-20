# Blueprint Edit Features Analysis

## Executive Summary

This document analyzes the current implementation of blueprint editing features in Polaris v3, including manual editing ("Edit Section") and AI-powered editing ("Edit with AI"). It details where these features are implemented, how they currently work, and what changes would be needed to implement proper versioning.

---

## 1. Current Edit Features Overview

### 1.1 "Edit Section" Feature (Manual Editing)
**Status**: IMPLEMENTED AND WORKING

**Trigger**: User clicks edit button on an expanded section in the blueprint viewer

**Flow**:
1. User clicks edit (pencil) icon in section header
2. `handleOpenEditor()` is called in `InteractiveBlueprintDashboard`
3. VisualJSONEditor modal opens with section data
4. User edits JSON structure using the visual editor
5. User saves changes
6. PATCH request sent to `/api/blueprints/update-section`
7. Section is updated in database
8. Page reloads to show updated content

### 1.2 "Solara Learning Engine Pro" Button (Coming Soon Feature)
**Status**: PLACEHOLDER - IMPLEMENTED AS NON-FUNCTIONAL BUTTON

**Trigger**: User clicks wand icon on an expanded section

**Current Implementation**:
- Button exists in UI with hover animations and glow effects
- Shows tooltip: "Edit with Solara Learning Engine Pro: Coming Soon"
- `handleSolaraProPlaceholder()` function logs to console only
- No actual API endpoint or AI processing
- This is a placeholder for a future premium feature
- Button appears in:
  - `InteractiveBlueprintDashboard.tsx` (all blueprint sections)

---

## 2. Edit Section Implementation Details

### 2.1 Frontend Implementation

**File**: `/frontend/components/features/blueprints/InteractiveBlueprintDashboard.tsx`

**Key Functions**:

```typescript
// Lines 351-389: Open editor modal
const handleOpenEditor = (sectionId: string, sectionTitle: string) => {
  // Maps section ID to blueprint data
  const sectionDataMap: Record<string, unknown> = {
    learning_objectives: blueprint.learning_objectives,
    target_audience: blueprint.target_audience,
    content_outline: blueprint.content_outline,
    // ... all other sections
  };
  
  setSelectedSectionId(sectionId);
  setSelectedSectionTitle(sectionTitle);
  setSelectedSectionData(sectionData);
  setIsEditorModalOpen(true);
};

// Lines 391-441: Save editor changes
const handleSaveEditorChanges = async (editedJSON: unknown) => {
  // 1. Validate edited JSON is not null/undefined
  if (editedJSON === null || editedJSON === undefined) {
    throw new Error('Cannot save empty data');
  }
  
  // 2. Create backup of current data
  const backupData = JSON.parse(JSON.stringify(blueprint));
  
  // 3. Send PATCH request to update-section endpoint
  const response = await fetch('/api/blueprints/update-section', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      blueprintId,
      sectionId: selectedSectionId,
      data: editedJSON,
    }),
  });
  
  // 4. On success, reload page
  window.location.reload();
};
```

**VisualJSONEditor Component**:
- File: `/frontend/components/modals/VisualJSONEditor.tsx`
- Purpose: Provides visual JSON editing interface with:
  - Split view (edit/preview)
  - Undo/redo support via `useEditorHistory`
  - Auto-save functionality via `useAutoSave`
  - Real-time validation
  - Keyboard shortcuts (Cmd+S, Cmd+Z, etc.)

### 2.2 API Implementation

**File**: `/frontend/app/api/blueprints/update-section/route.ts`

**Endpoint**: `PATCH /api/blueprints/update-section`

**Request Body**:
```json
{
  "blueprintId": "uuid",
  "sectionId": "section_name",
  "data": { /* section data */ }
}
```

**Processing Steps** (lines 19-253):

1. **Authentication** (lines 23-34):
   - Validates user session exists
   - Returns 401 if unauthorized

2. **Validation** (lines 36-111):
   - Requires `blueprintId`, `sectionId`, `data`
   - Validates data is not null/undefined
   - Returns 400 if invalid

3. **Blueprint Verification** (lines 70-94):
   - Fetches blueprint from database
   - Verifies user owns the blueprint
   - Returns 404 if not found

4. **Update Logic** (lines 113-157):
   - Creates deep clone of current blueprint_json
   - Backs up current section data
   - Updates single section in cloned blueprint
   - Validates structure is valid
   - **PRESERVES existing status** - does NOT reset to draft
   - Updates database with `updated_at: new Date().toISOString()`

5. **Verification** (lines 179-225):
   - Verifies update was successful
   - Implements rollback if data loss detected
   - Returns 500 on verification failure

6. **Response** (lines 233-238):
   ```json
   {
     "success": true,
     "message": "Section updated successfully",
     "blueprintId": "uuid",
     "sectionId": "section_name"
   }
   ```

---

## 3. Blueprint Versioning System

### 3.1 Database Schema

**File**: `/supabase/migrations/0003_blueprint_generator.sql`

**blueprint_generator Table** (lines 2-14):
```sql
CREATE TABLE public.blueprint_generator (
  id uuid primary key,
  user_id uuid,
  version integer NOT NULL DEFAULT 1,  -- VERSION COLUMN EXISTS
  static_answers jsonb,
  dynamic_questions jsonb,
  dynamic_answers jsonb,
  blueprint_json jsonb,
  blueprint_markdown text,
  status text CHECK (status IN ('draft','generating','completed','error')),
  created_at timestamptz,
  updated_at timestamptz
);
```

**Version Column**: 
- Exists in schema
- Default value: 1
- Type: integer

### 3.2 Version Increment Logic

**File**: `/supabase/migrations/0006_fix_blueprint_versioning.sql`

**Trigger Function**: `increment_blueprint_version_on_completion()`

```sql
CREATE OR REPLACE FUNCTION public.increment_blueprint_version_on_completion()
RETURNS TRIGGER AS $$
BEGIN
  -- Only increment version when status changes to 'completed'
  IF NEW.status = 'completed' AND 
     (OLD.status IS NULL OR OLD.status != 'completed') THEN
    NEW.version := COALESCE(OLD.version, 1) + 1;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Applied as BEFORE UPDATE trigger on blueprint_generator table
CREATE TRIGGER trg_blueprint_version_on_completion
BEFORE UPDATE ON public.blueprint_generator
FOR EACH ROW
EXECUTE FUNCTION public.increment_blueprint_version_on_completion();
```

**Current Behavior**:
- **ONLY increments version when status changes from NOT 'completed' to 'completed'**
- Triggered during blueprint GENERATION (lines 217-361 of `/frontend/app/api/blueprints/generate/route.ts`)
- Does NOT increment for manual edits via `update-section`

**RPC Function**: `increment_blueprint_version()`
- Defined but NOT currently used by any API endpoint
- Parameters: blueprint_id, new_blueprint_json, new_blueprint_markdown, new_static_answers, new_dynamic_answers, new_status
- Would need to be called explicitly by endpoints that want to increment version

---

## 4. Where Edit Features Are Used

### 4.1 "Edit Section" Button Locations

**1. InteractiveBlueprintDashboard Component**
- File: `/frontend/components/features/blueprints/InteractiveBlueprintDashboard.tsx`
- Lines: 1069-1093
- Location: Section header (visible when section is expanded)
- Icon: Edit (pencil icon from lucide-react)
- Styling: Cyan/primary color with hover animations
- On Click: Calls `handleEdit()` → `handleOpenEditor()`

**2. ExpandableSection Sub-Component**
- Rendered for each section in the blueprint:
  - Learning Objectives
  - Target Audience
  - Assessment Strategy
  - Content Outline
  - Instructional Strategy
  - Resources & Budget
  - Implementation Timeline
  - Success Metrics
  - Risk Mitigation
  - Sustainability Plan
  - Additional/Unknown Sections

### 4.2 "Modify with AI" Button Locations

**1. InteractiveBlueprintDashboard Component**
- File: `/frontend/components/features/blueprints/InteractiveBlueprintDashboard.tsx`
- Lines: 1096-1132
- Location: Section header (visible when section is expanded)
- Icon: Wand2 (magic wand icon from lucide-react)
- Styling: Cyan/primary with animated glowing pulse effect
- On Click: Calls `handleModify()` → **currently only logs to console**

**2. ExecutiveSummaryInfographic Component**
- File: `/frontend/components/blueprint/infographics/ExecutiveSummaryInfographic.tsx`
- Lines: 67-95
- Location: Strategic Overview section header
- Icon: Wand2 (magic wand icon)
- On Click: Calls `console.log('Modify Strategic Overview')`
- Only shown when not in public view

---

## 5. Current Version Increment Behavior

### 5.1 When Versions Are Incremented

**Currently Only Happens During Generation**:

Flow in `/frontend/app/api/blueprints/generate/route.ts` (lines 217-361):

1. Status set to `'generating'` (line 220)
2. Blueprint is generated via Claude
3. Database UPDATE with status: `'completed'` (line 358)
4. **Trigger fires**: `increment_blueprint_version_on_completion()`
5. **Version incremented**: old_version + 1

### 5.2 When Versions Are NOT Incremented

**Currently NOT Incremented For**:
- Manual section edits via "Edit Section" button
  - Endpoint: `PATCH /api/blueprints/update-section`
  - Line 151 in update-section/route.ts: Updates but does NOT call version increment
  - Line 153: **Preserves existing status** - doesn't change to 'completed'
  
- Auto-saves in the VisualJSONEditor
- Any other blueprint modifications

---

## 6. Implementation Plan for Proper Versioning

### 6.1 Required Changes for "Edit Section" Versioning

**Goal**: Increment version when user saves manual edits

**Implementation Approach 1: Database Trigger (Recommended)**

Create a new trigger that increments version on ANY update:

```sql
CREATE OR REPLACE FUNCTION public.increment_blueprint_version_on_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Increment version on any update to blueprint_json
  -- But preserve the "completed" trigger logic
  IF (NEW.blueprint_json != OLD.blueprint_json OR 
      NEW.blueprint_markdown != OLD.blueprint_markdown) THEN
    NEW.version := COALESCE(OLD.version, 1) + 1;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**Benefits**:
- Automatic for all endpoints
- No code changes needed in API routes
- Database-enforced consistency

**Drawbacks**:
- Increments on every change (including auto-saves if we decide to use them)

**Implementation Approach 2: Explicit API Call (More Control)**

Modify `update-section/route.ts` to call RPC function:

```typescript
// In update-section/route.ts, replace the direct update with RPC call
const { data: updateResult, error: updateError } = await supabase.rpc(
  'increment_blueprint_version',
  {
    blueprint_id_input: blueprintId,
    new_blueprint_json: updatedBlueprintJson,
    new_blueprint_markdown: updatedMarkdown, // Would need to regenerate
    new_static_answers: blueprint.static_answers,
    new_dynamic_answers: blueprint.dynamic_answers,
    new_status: 'completed' // Would need to decide if status changes
  }
);
```

**Benefits**:
- Explicit control over when versions increment
- Can exclude auto-saves
- Clearer intent in code

**Drawbacks**:
- Requires markdown regeneration
- Need to decide on status changes
- More code complexity

### 6.2 Required Changes for "Edit with AI" Feature

**Goal**: Implement AI-powered section editing

**High-Level Flow**:

1. User clicks "Modify with AI" button
2. Modal opens with current section data and optional prompt
3. Send to API endpoint: `POST /api/blueprints/edit-section-with-ai`
4. Claude regenerates just that section
5. Returns new section data
6. Preview before save
7. User accepts/rejects changes
8. Save triggers version increment

**Required Files to Create**:

**1. API Route**: `/frontend/app/api/blueprints/edit-section-with-ai/route.ts`

```typescript
interface EditSectionRequest {
  blueprintId: string;
  sectionId: string;
  userPrompt?: string;  // Optional refinement prompt
  staticAnswers: Record<string, unknown>;
  dynamicAnswers: Record<string, unknown>;
}

interface EditSectionResponse {
  success: boolean;
  sectionData?: Record<string, unknown>;
  error?: string;
  metadata?: {
    model: string;
    tokens: number;
  };
}
```

**2. Service Class**: `/frontend/lib/services/blueprintSectionEditService.ts`

```typescript
export class BlueprintSectionEditService {
  async editSectionWithAI(
    blueprintId: string,
    sectionId: string,
    sectionData: unknown,
    userPrompt?: string
  ): Promise<unknown> {
    // 1. Build prompt for Claude
    // 2. Call Claude API with section-specific system prompt
    // 3. Validate response matches section schema
    // 4. Return edited section
  }
}
```

**3. Modal Component**: Enhance VisualJSONEditor to support AI editing mode

**4. Handler**: Add to `InteractiveBlueprintDashboard`:

```typescript
const handleModifyWithAI = async (sectionId: string) => {
  // 1. Show loading state
  // 2. Call edit-section-with-ai API
  // 3. Show preview of changes
  // 4. User confirms
  // 5. Call update-section endpoint (which will increment version)
};
```

---

## 7. Version Increment Scenarios - Desired Behavior

### 7.1 Versioning Requirements

**Desired Workflow**:

```
Initial Generation:
  → Create blueprint (v1)

Manual Edit (Edit Section):
  → Increment to v2

AI Edit (Edit with AI):
  → Increment to v3

Auto-save (every 30 seconds):
  → NO version increment (drafts only)

Generate (entire blueprint):
  → Increment version

Re-generate (on same blueprint):
  → Create new version
```

### 7.2 Decisions to Make

1. **Should manual edits increment version?**
   - YES (per requirements)

2. **Should AI edits increment version?**
   - YES (per requirements)

3. **Should auto-saves increment version?**
   - NO (should only happen on explicit save)

4. **Should status change to 'draft' when editing a completed blueprint?**
   - Current: NO - preserves status
   - Recommendation: Keep current behavior (preserve 'completed' status)

5. **Should we track edit history/change logs?**
   - Separate consideration - not in current scope
   - Would require new table: `blueprint_versions` or `blueprint_edits`

---

## 8. Detailed File Locations

### API Routes
- `/frontend/app/api/blueprints/update-section/route.ts` - Manual edit endpoint (IMPLEMENTED)
- `/frontend/app/api/blueprints/edit-section-with-ai/route.ts` - AI edit endpoint (NOT IMPLEMENTED)
- `/frontend/app/api/blueprints/generate/route.ts` - Blueprint generation (IMPLEMENTED)

### Components
- `/frontend/components/features/blueprints/InteractiveBlueprintDashboard.tsx` - Main blueprint viewer with edit buttons
- `/frontend/components/modals/VisualJSONEditor.tsx` - JSON editing UI
- `/frontend/components/blueprint/infographics/ExecutiveSummaryInfographic.tsx` - Executive summary with edit button

### Services
- `/frontend/lib/services/blueprintGenerationService.ts` - Blueprint generation orchestrator
- `/frontend/lib/claude/prompts.ts` - Claude system and user prompts
- `/frontend/lib/claude/validation.ts` - Blueprint response validation

### Database
- `/supabase/migrations/0003_blueprint_generator.sql` - Schema with version column
- `/supabase/migrations/0006_fix_blueprint_versioning.sql` - Version increment trigger

### Types
- `/frontend/components/features/blueprints/types.ts` - BlueprintJSON type definition

---

## 9. Summary Table

| Feature | Status | Location | Version Impact |
|---------|--------|----------|-----------------|
| Edit Section (Manual) | Implemented | `update-section/route.ts` | NO increment (needs implementation) |
| Edit with AI | Placeholder only | `InteractiveBlueprintDashboard.tsx` | NOT IMPLEMENTED |
| Auto-save | Not present | N/A | Should NOT increment |
| Generation | Implemented | `blueprints/generate/route.ts` | YES increment (via trigger) |
| Version increment logic | Implemented | `0006_fix_blueprint_versioning.sql` | Only on generation (needs expansion) |

---

## 10. Recommended Next Steps

1. **Decide on versioning trigger**:
   - Database trigger (automatic) vs explicit API calls (controlled)

2. **Implement "Edit Section" versioning**:
   - Choose implementation approach
   - Test with existing manual edits

3. **Implement "Edit with AI" feature**:
   - Create API endpoint
   - Create service layer
   - Enhance modal UI
   - Add handlers in InteractiveBlueprintDashboard

4. **Consider change logging**:
   - Track what changed (section name, fields modified)
   - Store edit history per version

5. **Update UI to show versions**:
   - Display current version in blueprint viewer
   - Show version history when available

---

## Appendix: Key Code Snippets

### Trigger Version Increment on Any Update

```sql
-- Option: Create a more comprehensive trigger
CREATE OR REPLACE FUNCTION public.increment_blueprint_version_on_any_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Increment version if key fields changed AND still completed
  IF NEW.status = 'completed' AND (
    NEW.blueprint_json IS DISTINCT FROM OLD.blueprint_json OR
    NEW.blueprint_markdown IS DISTINCT FROM OLD.blueprint_markdown OR
    NEW.static_answers IS DISTINCT FROM OLD.static_answers OR
    NEW.dynamic_answers IS DISTINCT FROM OLD.dynamic_answers
  ) THEN
    NEW.version := COALESCE(OLD.version, 1) + 1;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### Manual Version Increment Call

```typescript
// In any endpoint that wants to manually increment version:
const { data: result, error } = await supabase.rpc(
  'increment_blueprint_version',
  {
    blueprint_id_input: blueprintId,
    new_blueprint_json: updatedBlueprint,
    new_blueprint_markdown: updatedMarkdown,
    new_static_answers: staticAnswers,
    new_dynamic_answers: dynamicAnswers,
    new_status: blueprint.status // Keep existing status
  }
);

if (error) {
  logger.error('version_increment_failed', error);
  throw error;
}
```

---

**Document Version**: 1.0  
**Last Updated**: 2025-11-12  
**Prepared By**: Code Analysis
