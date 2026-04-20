# Blueprint Versioning System Analysis Report

## Overview
The blueprint versioning system in Polaris v3 is designed to track changes to blueprints over time by incrementing a `version` integer field. However, users are reporting seeing versions like `v2000+`, which indicates a critical bug in the versioning logic.

## 1. Database Schema & Column Definition

### Location: `supabase/migrations/0003_blueprint_generator.sql`

The `blueprint_generator` table includes:
```sql
version integer not null default 1,
```

**Key Points:**
- Version is initialized to `1` when a blueprint is created
- Type: `integer` (not a serial/auto-increment)
- Should be managed via triggers and RPC functions

## 2. Versioning Mechanism

### 2.1 Original Trigger (Migration 0005)
**File:** `supabase/migrations/0005_functions_triggers.sql`

```sql
CREATE OR REPLACE FUNCTION public.increment_blueprint_version()
RETURNS trigger AS $$
BEGIN
  new.version := coalesce(old.version, 1) + 1;
  RETURN new;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_blueprint_version
BEFORE UPDATE on public.blueprint_generator
FOR EACH ROW EXECUTE FUNCTION public.increment_blueprint_version();
```

**CRITICAL BUG:** This trigger increments version on **EVERY UPDATE** to the blueprint_generator table. This causes the version to increment uncontrollably whenever ANY field is updated (e.g., `updated_at`, status changes during generation, etc.).

### 2.2 Fixed Trigger (Migration 0006)
**File:** `supabase/migrations/0006_fix_blueprint_versioning.sql`

The fix attempted to address this by:
1. Dropping the problematic `trg_blueprint_version` trigger
2. Creating a new trigger `trg_blueprint_version_on_completion` that only increments when `status = 'completed'`
3. Creating an RPC function `increment_blueprint_version()` for explicit version control

```sql
CREATE OR REPLACE FUNCTION public.increment_blueprint_version_on_completion()
RETURNS trigger AS $$
BEGIN
  -- Only increment version when status changes to 'completed'
  IF new.status = 'completed' AND (old.status IS NULL OR old.status != 'completed') THEN
    new.version := coalesce(old.version, 1) + 1;
  END IF;
  RETURN new;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_blueprint_version_on_completion
BEFORE UPDATE ON public.blueprint_generator
FOR EACH ROW EXECUTE FUNCTION public.increment_blueprint_version_on_completion();
```

**Status:** This should prevent uncontrolled increments. However, the issue persists, suggesting either:
- The migration wasn't applied correctly
- The old trigger is still active
- Another process is updating the version field

## 3. API Route Usage

### 3.1 Blueprint Generation Route
**File:** `frontend/app/api/blueprints/generate/route.ts` (line 220-228)

When generating a blueprint:
```typescript
const updateQuery = supabase
  .from('blueprint_generator')
  .update({ status: 'generating' })
  .eq('id', blueprintId);
```

After generation completes (line 350-362):
```typescript
const saveQuery = supabase
  .from('blueprint_generator')
  .update({
    blueprint_json: {...},
    blueprint_markdown: markdown,
    status: 'completed',
    title: generatedTitle,
    updated_at: new Date().toISOString(),
  })
  .eq('id', blueprintId);
```

**Issue:** When status is set to 'completed', the trigger should increment the version. However, if the old buggy trigger is still active, it would have already incremented the version during the `status: 'generating'` update.

### 3.2 Questionnaire Save Route
**File:** `frontend/app/api/questionnaire/save/route.ts` (line 136-144)

Updates existing blueprints with:
```typescript
const { error: updateError, count } = await supabase
  .from('blueprint_generator')
  .update({
    static_answers: staticAnswers,
    updated_at: new Date().toISOString(),
  })
  .eq('id', blueprintId)
  .eq('user_id', userId)
  .select('*', { count: 'exact', head: true });
```

**Issue:** This update would trigger the old buggy trigger on **every save** (every 30 seconds), incrementing version uncontrollably.

## 4. UI Display

### BlueprintCard Component
**File:** `frontend/components/dashboard/BlueprintCard.tsx` (line 587-590)

```tsx
<span
  className="cursor-help font-medium text-white/60"
  title={`Version ${blueprint.version}`}
>
  v{blueprint.version}
</span>
```

Simply displays the `version` field from the database. The UI is correct; the data is wrong.

## 5. Root Cause Analysis

### Primary Issue: Trigger Migration Order

The problem stems from migration execution order:

1. **Migration 0005** creates the buggy trigger `trg_blueprint_version` that increments on every update
2. **Migration 0006** attempts to fix it by:
   - Dropping the old trigger
   - Creating the new, conditional trigger

**Possible Failure Points:**

1. **Old trigger still exists:** The `drop trigger if exists trg_blueprint_version` may have failed silently, leaving both triggers active
2. **Multiple trigger execution:** If both triggers exist, they would both execute, causing double increments
3. **Version field incremented without trigger:** Direct updates to the version field outside of API logic
4. **Backfill operations:** The backfill scripts might have incremented versions incorrectly

### Secondary Issue: Multiple Update Calls

Each time a blueprint is saved (every 30 seconds during dynamic questionnaire), if the buggy trigger is active:
- Version increments by 1
- Over time (e.g., 30 seconds × 2000 updates = 1000 minutes = ~16 hours), version could reach v2000+

**Timeline Example:**
- User starts working on blueprint at 9 AM
- Auto-save every 30 seconds
- By 1 PM (4 hours = 14,400 seconds), with auto-save: 480 saves
- If each save increments version: v481 (if buggy trigger) vs v1 (if fixed trigger)
- 2000 increments would take ~1000 minutes (16.7 hours) of continuous work

## 6. Current Migrations Status

### Active Migrations:
- ✅ `0005_functions_triggers.sql` - Created buggy trigger
- ✅ `0006_fix_blueprint_versioning.sql` - Attempted fix
- ✅ `0035_activity_logging_triggers.sql` - Additional triggers (unrelated)

### Verification Needed:
```sql
-- Check which triggers are active
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE event_object_table = 'blueprint_generator';

-- Should show:
-- ✓ trg_blueprint_updated_at (BEFORE UPDATE) - updates updated_at
-- ✓ trg_blueprint_version_on_completion (BEFORE UPDATE) - conditional increment
-- ✗ trg_blueprint_version (BEFORE UPDATE) - BUGGY, should be dropped

-- Check function existence
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name LIKE 'increment_blueprint%';

-- Should show:
-- ✓ increment_blueprint_version (FUNCTION)
-- ✓ increment_blueprint_version_on_completion (FUNCTION)
```

## 7. Why v2000+?

### Calculation:
If the buggy `trg_blueprint_version` trigger is still active (incrementing on every update):

**Dynamic Questionnaire Auto-Save:**
- Saves every 30 seconds (frontend logic)
- Each save = 1 version increment
- 2000 updates = ~1000 minutes = ~16.7 hours of active editing

**Static Questionnaire + Blueprint Generation:**
- Static save: 1-2 increments
- Dynamic questions generation: status changes = 1 increment
- Blueprint generation: status changes (generating → completed) = 1 increment per status change
- Total per blueprint: 3-4 increments

**Why 2000+ for some users:**
- Heavy users who spend 16+ hours working on blueprints
- Multiple blueprints worked on sequentially
- Rapid iteration with frequent saves

## 8. Current Implementation Status

### Version Control Flow (INTENDED):
```
1. Blueprint created with version = 1 (default)
2. User completes static questionnaire (version stays 1, no generation)
3. Dynamic questions generated (version stays 1, no completion)
4. User completes dynamic questionnaire (version stays 1, no completion)
5. Blueprint generation triggered → status = 'completed' → trigger increments to version = 2
6. Re-generation → status already 'completed' → trigger prevents duplicate increment
```

### Current Broken Flow (IF BUGGY TRIGGER ACTIVE):
```
1. Blueprint created with version = 1 (default)
2. Auto-save static answers → version = 2 (buggy trigger)
3. Auto-save static answers → version = 3 (buggy trigger)
4. ... repeat 100 times ...
5. Each update increments version
6. Result: v100+ before blueprint is even completed
```

## 9. Files to Review/Fix

### Priority 1 - Investigate:
1. `supabase/migrations/0006_fix_blueprint_versioning.sql` - Verify migration was applied
2. Database state - Check active triggers
3. `frontend/app/api/blueprints/generate/route.ts` - Version not being passed to update
4. `frontend/app/api/questionnaire/save/route.ts` - Version not being passed to update

### Priority 2 - Code Review:
1. `frontend/lib/db/blueprints.ts` - RPC function calls
2. `frontend/components/dashboard/BlueprintCard.tsx` - Correct UI display
3. Zustand store - Any version management logic
4. Types - `frontend/types/supabase.ts` - Blueprint type definition

### Priority 3 - Backfill:
1. `supabase/migrations/20251104020000_backfill_activity_logs.sql` - Check if it touches versions
2. `supabase/migrations/20251106050000_backfill_all_user_counters_historical_accuracy.sql` - Check if it touches versions

## 10. Recommended Fixes

### Immediate Actions:
1. **Verify trigger state** - Query active triggers on production database
2. **Check migration history** - Verify 0006 was executed after 0005
3. **Inspect version values** - SELECT version, created_at, updated_at FROM blueprint_generator WHERE version > 10

### Short Term:
1. Drop the buggy trigger if it still exists
2. Ensure only `trg_blueprint_version_on_completion` is active
3. Verify RPC function `increment_blueprint_version()` is not being called during regular saves

### Long Term:
1. Implement version increment only in specific API routes, not via trigger
2. Remove trigger-based versioning (too fragile)
3. Use explicit version management in business logic
4. Add database constraint to prevent version overflow
5. Create migration to reset existing high version numbers to v2

## 11. Alternative Approach: Remove Trigger-Based Versioning

Instead of relying on database triggers, manage versioning explicitly in the API:

```typescript
// When generating blueprint (final completion)
if (blueprint.status !== 'completed') {
  await supabase
    .from('blueprint_generator')
    .update({
      status: 'completed',
      version: (blueprint.version || 1) + 1, // Explicit increment
      blueprint_json: {...},
      updated_at: new Date().toISOString(),
    })
    .eq('id', blueprintId);
}

// Regular saves do NOT touch version
// Versioning only happens on status changes
```

This approach is:
- More transparent
- Easier to debug
- Less prone to trigger-related bugs
- More maintainable long-term

---

## Summary

The v2000+ issue is caused by an overly aggressive trigger in migration 0005 that increments the version on every blueprint update. Migration 0006 attempted to fix this by creating a conditional trigger, but the fix may not have been applied correctly, or both triggers are running simultaneously. The result is users seeing unrealistic version numbers after hours of editing and auto-saving their blueprints.
