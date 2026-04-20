# Blueprint Versioning Bug - Investigation & Fix Guide

## Problem Statement

Users are seeing unrealistic blueprint versions (v2000+) instead of v1 or v2. The issue is caused by a database trigger that increments the version field on every update to the blueprint_generator table, rather than only when blueprints are completed.

**Location:** `/home/jitin-m-nair/Desktop/polaris-v3/BLUEPRINT_VERSIONING_INVESTIGATION.md` - Full investigation report

## Quick Summary

| Aspect | Details |
|--------|---------|
| **Root Cause** | Migration 0005 created a trigger that increments version on every blueprint update |
| **Attempted Fix** | Migration 0006 tried to replace it with a conditional trigger, but fix may not have applied |
| **Symptom** | Users see v2000+ after hours of work (each auto-save = +1 version) |
| **Timeline** | 2000 versions ≈ 16.7 hours of continuous editing with 30-sec auto-saves |
| **Impact** | High - affects all users who work on blueprints for extended periods |

## Investigation Steps

### Step 1: Verify Database State

Run these queries on your Supabase instance:

```sql
-- Check active triggers
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE event_object_table = 'blueprint_generator'
  AND event_object_schema = 'public'
ORDER BY trigger_name;
```

**Expected Output (CORRECT):**
```
trigger_name                          │ event_manipulation │ event_object_table
──────────────────────────────────────┼──────────────────┼────────────────────
on_blueprint_created                  │ AFTER INSERT     │ blueprint_generator
trg_blueprint_updated_at               │ BEFORE UPDATE    │ blueprint_generator
trg_blueprint_version_on_completion    │ BEFORE UPDATE    │ blueprint_generator
```

**Bad Output (BUG EXISTS):**
```
trigger_name                          │ event_manipulation │ event_object_table
──────────────────────────────────────┼──────────────────┼────────────────────
on_blueprint_created                  │ AFTER INSERT     │ blueprint_generator
trg_blueprint_updated_at               │ BEFORE UPDATE    │ blueprint_generator
trg_blueprint_version                  │ BEFORE UPDATE    │ blueprint_generator ← BUGGY
trg_blueprint_version_on_completion    │ BEFORE UPDATE    │ blueprint_generator
```

### Step 2: Check Version Distribution

```sql
-- See how widespread the problem is
SELECT 
  version,
  COUNT(*) as blueprint_count,
  MIN(created_at) as oldest,
  MAX(created_at) as newest
FROM blueprint_generator
GROUP BY version
ORDER BY version DESC
LIMIT 30;
```

**Analysis:**
- If you see versions > 10: Bug is active
- If you see versions > 100: Bug has been active for a long time
- If you see versions > 1000: Many users have been affected

### Step 3: Check Affected Users

```sql
-- Find users with the highest version numbers (most affected)
SELECT 
  bp.user_id,
  up.email,
  COUNT(*) as blueprint_count,
  MAX(bp.version) as max_version,
  AVG(bp.version) as avg_version,
  MAX(bp.updated_at) as last_updated
FROM blueprint_generator bp
LEFT JOIN user_profiles up ON bp.user_id = up.id
GROUP BY bp.user_id, up.email
HAVING MAX(bp.version) > 10
ORDER BY MAX(bp.version) DESC
LIMIT 20;
```

## Fix Strategy

### Option 1: Quick Fix (Drop Buggy Trigger)

If the buggy trigger `trg_blueprint_version` exists, drop it immediately:

```sql
-- This should be your first step if you confirmed the buggy trigger exists
DROP TRIGGER IF EXISTS trg_blueprint_version ON public.blueprint_generator;

-- Verify it's gone
SELECT trigger_name
FROM information_schema.triggers
WHERE event_object_table = 'blueprint_generator'
  AND trigger_name = 'trg_blueprint_version';
-- Should return: (0 rows)
```

### Option 2: Complete Fix (Create Migration)

Create a new migration file: `supabase/migrations/20251113000000_fix_blueprint_version_trigger.sql`

```sql
-- Migration: Fix Blueprint Version Trigger Bug
-- Description: Remove the buggy trigger that increments version on every update
-- Issue: https://github.com/yourrepo/issues/XXX

-- Drop the buggy trigger if it exists
DROP TRIGGER IF EXISTS trg_blueprint_version ON public.blueprint_generator;

-- Verify the correct trigger exists (should have been created by 0006)
-- If it doesn't exist, recreate it:
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

-- Create trigger only if it doesn't exist
DROP TRIGGER IF EXISTS trg_blueprint_version_on_completion ON public.blueprint_generator;
CREATE TRIGGER trg_blueprint_version_on_completion
BEFORE UPDATE ON public.blueprint_generator
FOR EACH ROW EXECUTE FUNCTION public.increment_blueprint_version_on_completion();

-- Verify trigger is active
SELECT trigger_name FROM information_schema.triggers 
WHERE event_object_table = 'blueprint_generator' 
  AND trigger_name = 'trg_blueprint_version_on_completion';
```

### Option 3: Long-Term Fix (Explicit Version Management)

Instead of relying on triggers, manage versioning in the API:

**In `/frontend/app/api/blueprints/generate/route.ts`:**

```typescript
// When blueprint generation completes
const markdown = convertBlueprintToMarkdown(result.blueprint);

// Fetch current blueprint to check if already completed
const { data: currentBlueprint } = await supabase
  .from('blueprint_generator')
  .select('version, status')
  .eq('id', blueprintId)
  .single();

// Only increment version if not already completed
const newVersion = currentBlueprint?.status === 'completed' 
  ? currentBlueprint.version 
  : (currentBlueprint?.version || 1) + 1;

const saveQuery = supabase
  .from('blueprint_generator')
  .update({
    blueprint_json: {...},
    blueprint_markdown: markdown,
    status: 'completed',
    version: newVersion, // EXPLICIT
    title: generatedTitle,
    updated_at: new Date().toISOString(),
  })
  .eq('id', blueprintId);
```

**Remove trigger-based versioning entirely** - triggers are too fragile for business logic.

## Backfill Strategy

### Option 1: Reset All Versions to v2

Assumes all blueprints should be either v1 (draft) or v2 (completed):

```sql
-- For completed blueprints, set version to 2
UPDATE blueprint_generator
SET version = 2
WHERE status = 'completed' AND version > 2;

-- For draft/generating blueprints, set version to 1  
UPDATE blueprint_generator
SET version = 1
WHERE status IN ('draft', 'generating') AND version > 1;

-- Verify
SELECT version, COUNT(*) FROM blueprint_generator GROUP BY version;
```

### Option 2: Backfill with Calculated Versions

If you want to preserve some version history:

```sql
-- Complex version calculation (only if you want historical accuracy)
-- This assigns versions based on update frequency and status changes

-- First, mark all as v1 initially
UPDATE blueprint_generator SET version = 1;

-- Then increment to v2 for completed ones
UPDATE blueprint_generator 
SET version = 2 
WHERE status = 'completed';

-- Optional: Add more versions based on when major changes occurred
-- (This requires more complex logic and activity logs)
```

### Option 3: No Backfill (Accept Current Numbers)

If the high version numbers aren't causing issues and you just want to prevent future increments:

1. Drop the buggy trigger
2. New blueprints will start at v1
3. Existing blueprints keep their (incorrect) high versions
4. Over time, existing blueprints will be v2000+, new ones v1-2

## Implementation Checklist

- [ ] **Verify bug exists** - Run Step 1 queries above
- [ ] **Check impact** - Run Step 2 & 3 queries to see affected users
- [ ] **Apply quick fix** - Drop buggy trigger immediately
- [ ] **Test fix** - Create new blueprint and verify version stays at 1
- [ ] **Apply migration** - Create official migration file
- [ ] **Backfill data** - Choose strategy above
- [ ] **Code review** - Consider Option 3 (explicit version management)
- [ ] **Notify users** - Explain version numbers will reset
- [ ] **Update documentation** - Explain new versioning behavior

## Testing After Fix

### Create Test Blueprint:

1. Create new blueprint (should start at v1)
2. Save static answers 5 times (version should stay v1)
3. Generate dynamic questions (version should stay v1)
4. Save dynamic answers 5 times (version should stay v1)
5. Generate blueprint (version should increment to v2)
6. Verify it shows "v2" in UI

### Verify Database:

```sql
-- Check the test blueprint
SELECT id, version, status, created_at, updated_at
FROM blueprint_generator
WHERE title LIKE 'Test%' OR user_id = 'test-user-id'
ORDER BY created_at DESC
LIMIT 5;

-- Should show:
-- id                                   │ version │ status    │ ...
-- ─────────────────────────────────────┼─────────┼───────────┼─────
-- (test blueprint uuid)                │ 2       │ completed │ ...
-- (test blueprint uuid, earlier)       │ 1       │ draft     │ ...
```

## Rollback Plan

If the fix causes issues:

```sql
-- Revert to previous trigger (not recommended, but possible)
DROP TRIGGER IF EXISTS trg_blueprint_version_on_completion ON public.blueprint_generator;

-- This would revert to old behavior (but DON'T do this!)
-- Instead, investigate why the fix caused problems
```

## References

- **Full Investigation:** `/home/jitin-m-nair/Desktop/polaris-v3/BLUEPRINT_VERSIONING_INVESTIGATION.md`
- **Flow Diagram:** `/tmp/versioning_flow.txt`
- **Migration 0005:** `supabase/migrations/0005_functions_triggers.sql` (buggy)
- **Migration 0006:** `supabase/migrations/0006_fix_blueprint_versioning.sql` (attempted fix)
- **UI Component:** `frontend/components/dashboard/BlueprintCard.tsx` (line 587-590)
- **API Route:** `frontend/app/api/blueprints/generate/route.ts`
- **Save Route:** `frontend/app/api/questionnaire/save/route.ts`

## Summary

The blueprint versioning system has a critical bug where a trigger increments the version on every database update, not just when blueprints are completed. The fix is straightforward:

1. **Verify** the buggy trigger exists
2. **Drop** it immediately
3. **Apply** a proper migration
4. **Backfill** existing data
5. **Test** the fix
6. **Long-term:** Replace trigger-based versioning with explicit API logic

Expected timeline: 30 minutes to implement, 5 minutes to test, immediate user impact improvement.
