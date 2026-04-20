# Blueprint Versioning Bug - Executive Summary

## The Problem

Users are seeing blueprint versions like "v2000+" instead of v1 or v2. This happens because a database trigger is incrementing the version field on **every save**, not just when blueprints are completed.

## The Impact

- **Affected Users:** Heavy users who spend 16+ hours working on blueprints
- **When It Happens:** After multiple hours of editing with auto-saves (every 30 seconds)
- **User Experience:** Version number appears broken or corrupted
- **Confidence:** Reduces user trust in the application

## Root Cause

### Migration History:
1. **Migration 0005** created a trigger that increments version on **every database update**
2. **Migration 0006** attempted to fix it with a conditional trigger, but the fix may not have applied correctly

### Current Database State (Likely):
- Old buggy trigger `trg_blueprint_version` may still exist AND/OR
- New conditional trigger `trg_blueprint_version_on_completion` exists

### Why v2000+:
Each auto-save (every 30 seconds) increments the version by 1:
- 30 seconds × 2000 saves = 1000 minutes = 16.7 hours
- Heavy users working on blueprints for extended periods hit this

## The Solution (3 Options)

### Option 1: Quick Fix (30 seconds)
```sql
DROP TRIGGER IF EXISTS trg_blueprint_version ON public.blueprint_generator;
```
- Immediate relief from the problem
- Takes 30 seconds to execute
- Affected users' old blueprints keep their high version numbers

### Option 2: Proper Fix (5 minutes)
- Create a migration that drops the buggy trigger and ensures correct one is active
- Apply migration to database
- Prevents the problem for new blueprints
- Old blueprints still have high version numbers

### Option 3: Complete Fix (1 hour)
- Drop buggy trigger (Option 2)
- Backfill all blueprints to correct version numbers
- Migrate away from trigger-based versioning to explicit API logic
- Long-term: Most robust solution

## What Files Are Involved

### Database Migrations:
- **Buggy:** `supabase/migrations/0005_functions_triggers.sql`
- **Attempted Fix:** `supabase/migrations/0006_fix_blueprint_versioning.sql`
- **Where to Add New Fix:** `supabase/migrations/20251113000000_fix_blueprint_version_trigger.sql`

### Code Files:
- **UI Display:** `frontend/components/dashboard/BlueprintCard.tsx` (line 587-590)
- **Blueprint Generation:** `frontend/app/api/blueprints/generate/route.ts`
- **Questionnaire Save:** `frontend/app/api/questionnaire/save/route.ts`
- **Database Service:** `frontend/lib/db/blueprints.ts`

## Verification Steps

To confirm the bug exists, run this SQL query:

```sql
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE event_object_table = 'blueprint_generator';
```

**If you see `trg_blueprint_version` in the results: BUG CONFIRMED**

## Implementation Priority

| Priority | Action | Time |
|----------|--------|------|
| 1 | Verify bug exists (run SQL query) | 2 min |
| 2 | Quick fix (DROP TRIGGER) | 0.5 min |
| 3 | Create migration for version control | 5 min |
| 4 | Backfill existing data | 10 min |
| 5 | Test with new blueprint | 5 min |
| 6 | Long-term refactor (explicit versioning) | 30 min |

**Total time to full fix: ~1 hour**

## Detailed Documentation

Three comprehensive documents have been created:

1. **BLUEPRINT_VERSIONING_INVESTIGATION.md** - Full technical investigation with root cause analysis
2. **BLUEPRINT_VERSIONING_FIX_GUIDE.md** - Step-by-step fix instructions with SQL queries and code examples
3. **This Document** - Executive summary for quick understanding

All are located in: `/home/jitin-m-nair/Desktop/polaris-v3/`

## Recommendation

**Immediate Action:** Drop the buggy trigger to prevent further increments
**Follow-up:** Implement Option 2 (proper migration)
**Long-term:** Consider Option 3 (explicit version management in API)

The fix is straightforward and low-risk. The sooner it's implemented, the sooner users will see correct version numbers.

---

**Status:** Fully investigated and documented. Ready for implementation.
**Risk Level:** Low (trigger fix is reversible)
**User Impact:** High (fixes confusing version numbers)
**Development Effort:** Minimal (30 min to 1 hour)
