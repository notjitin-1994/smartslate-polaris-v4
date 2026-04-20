# Manual Migration Instructions for Production Database

Due to network connectivity issues with the Supabase CLI, please apply the backfill migrations manually through the Supabase Dashboard.

## Steps to Apply Migrations

### 1. Access Supabase Dashboard SQL Editor

1. Go to https://supabase.com/dashboard/project/oyjslszrygcajdpwgxbe
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**

### 2. Apply Cache Token Migration

Copy and paste the entire contents of:
```
migrations/20251112000000_enhance_cost_tracking_cache_tokens.sql
```

Then click **Run** or press `Ctrl/Cmd + Enter`

**Note**: This migration has been tested and includes fixes for:
- Function signature conflicts (DROP statements before CREATE OR REPLACE)
- FILTER clause syntax (replaced with CASE WHEN for compatibility)
- COMMENT concatenation (combined into single strings)
All fixes have been verified on local database.

### 3. Apply Backfill Migration

Create a new query, then copy and paste the entire contents of:
```
migrations/20251112000001_backfill_historical_costs.sql
```

Then click **Run** or press `Ctrl/Cmd + Enter`

### 4. Verify Functions Exist

Run this verification query:
```sql
-- Check if functions were created
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('estimate_blueprint_costs', 'backfill_blueprint_costs')
ORDER BY routine_name;
```

You should see 2 functions returned.

### 5. Test Estimate Function

```sql
-- See if any blueprints need backfilling
SELECT 
  COUNT(*) as blueprints_to_backfill,
  SUM(estimated_cost_cents) / 100.0 as total_estimated_cost_dollars
FROM estimate_blueprint_costs();
```

## Expected Output

After successful migration, you should see:
- ✅ Cache token columns added to `api_usage_logs`
- ✅ Cache pricing columns added to `api_model_pricing`
- ✅ `models_missing_pricing` view created
- ✅ `estimate_blueprint_costs()` function created
- ✅ `backfill_blueprint_costs()` function created

## Next Steps

Once migrations are applied successfully:

1. **Set environment variables** on your local machine:
   ```bash
   export SUPABASE_URL="https://oyjslszrygcajdpwgxbe.supabase.co"
   export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
   ```

2. **Preview backfill** (dry run):
   ```bash
   npm run backfill:costs -- --dry-run
   ```

3. **Execute backfill** when ready:
   ```bash
   npm run backfill:costs -- --execute
   ```

## Troubleshooting

If you encounter errors:

1. **Check existing structures**: Some objects may already exist
   - Warnings about existing relations are normal
   - Errors about missing columns indicate partial migration

2. **Rerun migrations**: Safe to rerun as migrations use `IF NOT EXISTS`

3. **Check migration history**:
   ```sql
   SELECT version, name, applied_at
   FROM supabase_migrations.schema_migrations
   WHERE version::TEXT LIKE '202511%'
   ORDER BY version DESC;
   ```

## Migration Files Location

The migration SQL files are located at:
- `migrations/20251112000000_enhance_cost_tracking_cache_tokens.sql` (14KB)
- `migrations/20251112000001_backfill_historical_costs.sql` (13KB)

Copy these files to your local machine if applying from a different location.
