# Scripts

This directory contains utility scripts for the SmartSlate project.

## Migration Scripts

### migrate-blueprints-v1-to-v2.ts

Migrates existing blueprint data from V1 (5 simple questions) to V2 (8 structured questions) format.

**Prerequisites:**
- Set `SUPABASE_SERVICE_ROLE_KEY` environment variable
- Database migrations 0008 and 0009 must be applied

**Usage:**

```bash
# Dry run (preview changes without applying)
npx tsx scripts/migrate-blueprints-v1-to-v2.ts --dry-run

# Apply migration
npx tsx scripts/migrate-blueprints-v1-to-v2.ts
```

**What it does:**
1. Fetches all blueprints from the database
2. Identifies V1 format blueprints (no version or version=1)
3. Uses the `migrate_static_answers_v1_to_v2` database function
4. Updates `static_answers` and sets `questionnaire_version=2`
5. Skips blueprints already in V2 format
6. Provides detailed progress and summary

**Safety:**
- Always run with `--dry-run` first
- Creates migration audit log
- Does not modify blueprints already in V2
- Preserves original data in migrated structure
