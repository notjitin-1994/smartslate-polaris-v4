# Archive Directory

This directory contains archived files that were previously in the project root but are not actively needed for development.

## Directory Structure

### `/manual-migrations`
Manual SQL migration files that were run during development. These are kept for historical reference.

**Contents:**
- `apply_activity_stats_fix.sql` - Activity stats fix migration
- `check_blueprint.sql` - Blueprint validation query
- `CHECK_BUCKET_CONFIG.sql` - Bucket configuration check
- `CORRECTED_FEEDBACK_MIGRATION.sql` - Feedback system migration
- `fix_missing_column.sql` - Column addition fix
- `manual_backfill_*.sql` - Manual backfill scripts
- `manual_migration_*.sql` - Manual migration scripts
- `migrate_blueprints_*.sql` - Blueprint migration scripts

**Note:** These migrations have already been applied. For current migrations, see `supabase/migrations/`.

### `/aider-history`
Aider AI coding assistant chat history and session data.

**Contents:**
- `.aider.chat.history.md` - Aider chat history
- `.aider.input.history` - Aider input history

**Note:** Archived for reference but not actively used.

### `/development`
Development artifacts, data files, and reports.

**Contents:**
- `USAGE_SYSTEM_INTEGRATION_EXAMPLES.tsx` - Usage system code examples
- `blueprint_generator` - Blueprint generator data file
- `dependency-report.json` - Dependency analysis report
- `.secrets-test-*` - Secrets testing artifacts

**Note:** Kept for reference but not part of active codebase.

### `/old-pricing-page`
Standalone pricing page copied from smartslate-final project.

**Contents:**
- Complete pricing page implementation with components, hooks, and contexts
- Material-UI based design
- Currency toggle and billing features

**Note:** This was a standalone pricing module. The current pricing page is integrated in `frontend/app/(auth)/pricing/`. Archived for historical reference.

## When to Archive Files

Files should be moved to `_archive/` when:
- They are no longer actively used in development
- They are historical reference material
- They are temporary development artifacts
- They clutter the project root
- They have been superseded by better implementations

## When NOT to Archive

Keep files in their original location if:
- They are actively used by the build system
- They are part of the active codebase
- They are configuration files (package.json, .env, etc.)
- They are documentation (README.md, CLAUDE.md, etc.)
- They are required by tools or scripts

## Accessing Archived Files

If you need to reference archived files:
1. Check this directory structure
2. Look in the appropriate subdirectory
3. For SQL migrations, prefer using the official migrations in `supabase/migrations/`

## Cleaning Up

Periodically review this directory and:
- Remove files that are no longer needed for reference
- Consolidate similar files
- Update this README with any changes

---

Last Updated: 2025-11-19
