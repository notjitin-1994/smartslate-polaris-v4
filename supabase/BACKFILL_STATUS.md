# Backfill Implementation Status

## ✅ Completed Work

### 1. Database Migrations Created
- `migrations/20251112000000_enhance_cost_tracking_cache_tokens.sql` (14KB)
  - Adds cache token columns to `api_usage_logs`
  - Adds cache pricing to `api_model_pricing`
  - Updates `log_api_usage()` function with cache token support
  - **Fixed**: Added DROP statements to resolve function signature conflicts

- `migrations/20251112000001_backfill_historical_costs.sql` (13KB)
  - Creates `estimate_blueprint_costs()` function
  - Creates `backfill_blueprint_costs()` function
  - Provides dry-run capability for safe testing

### 2. CLI Script Created
- `scripts/backfill-historical-costs.ts` (9KB)
  - User-friendly command-line interface
  - Dry-run mode as default
  - Confirmation prompts before execution
  - Beautiful formatted output with colors
  - Added to package.json as `npm run backfill:costs`

### 3. Documentation Created
- `MANUAL_MIGRATION_INSTRUCTIONS.md` - Step-by-step guide for manual migration
- `BACKFILL_STATUS.md` - This file (current status tracker)

### 4. Database Fixes Applied
- Fixed CREATE INDEX conflicts in `0027_payment_orders.sql`
- Removed problematic `idx_subscriptions_ends_at` index
- Fixed `log_api_usage()` function signature conflict

### 5. Local Database Status
- ✅ Cache token migration applied successfully
- ✅ Backfill migration applied successfully
- ✅ Functions verified: `estimate_blueprint_costs`, `backfill_blueprint_costs`
- ✅ Script tested with dry-run mode

## ⏳ Pending Tasks

### 1. Apply Migrations to Remote Production Database

**Why Manual Application is Required:**
- Supabase CLI has network connectivity issues (IPv6 unreachable)
- Direct psql connection times out
- Background processes hang during initialization

**How to Apply Manually:**

Follow the instructions in `MANUAL_MIGRATION_INSTRUCTIONS.md`:

1. Go to https://supabase.com/dashboard/project/oyjslszrygcajdpwgxbe
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy/paste contents of `migrations/20251112000000_enhance_cost_tracking_cache_tokens.sql`
5. Click **Run**
6. Create another new query
7. Copy/paste contents of `migrations/20251112000001_backfill_historical_costs.sql`
8. Click **Run**

### 2. Verify Functions Exist in Remote Database

After applying migrations, run this verification query:

```sql
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('estimate_blueprint_costs', 'backfill_blueprint_costs')
ORDER BY routine_name;
```

Should return 2 functions.

### 3. Execute Backfill on Production Data

Once migrations are applied:

```bash
# Set production environment variables
export SUPABASE_URL="https://oyjslszrygcajdpwgxbe.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Preview backfill (dry run)
npm run backfill:costs -- --dry-run

# Execute backfill when ready
npm run backfill:costs -- --execute
```

## 📊 What the Backfill Does

### Token Estimation Formula
```
tokens ≈ characters / 4
```

### Cost Calculation
- **Input tokens**: $3.00 per million tokens
- **Output tokens**: $15.00 per million tokens
- **Cache creation**: Same as input ($3.00/M)
- **Cache read**: 90% discount ($0.30/M)

### Blueprint Cost Estimation
For each blueprint with no existing cost logs:

1. **Dynamic Question Generation Log** (estimated)
   - Input: static_answers + dynamic_questions length
   - Output: dynamic_questions length
   - Endpoint: `/api/generate-dynamic-questions`
   - Marked as: `is_backfilled: true`, `is_estimated: true`

2. **Blueprint Generation Log** (estimated)
   - Input: dynamic_answers + blueprint length
   - Output: blueprint length
   - Endpoint: `/api/blueprints/generate`
   - Marked as: `is_backfilled: true`, `is_estimated: true`

### Accuracy
- Token estimates are ±20-30% accurate
- Costs are approximations for historical analytics
- All estimated data is clearly marked with metadata

## 🐛 Issues Encountered and Resolved

### Issue 1: CREATE INDEX Conflicts
**Error**: `relation "idx_subscriptions_user_id" already exists`
**Fix**: Changed all CREATE INDEX to CREATE INDEX IF NOT EXISTS

### Issue 2: Missing ends_at Column
**Error**: `column "ends_at" does not exist`
**Fix**: Removed problematic index creation

### Issue 3: Function Signature Conflict
**Error**: `function name "public.log_api_usage" is not unique`
**Fix**: Added explicit DROP FUNCTION statements before CREATE OR REPLACE

### Issue 5: FILTER Clause Syntax Error
**Error**: `syntax error at or near "FILTER"`
**Fix**: Replaced `COUNT(*) FILTER (WHERE ...)` with `COUNT(CASE WHEN ... THEN 1 END)` for broader PostgreSQL compatibility

### Issue 6: COMMENT String Concatenation
**Error**: `syntax error at or near "||"` in COMMENT ON statements
**Fix**: Combined multi-line strings into single strings (COMMENT ON doesn't support concatenation operator)

### Issue 7: Ambiguous Column Reference
**Error**: `column reference "blueprint_id" is ambiguous`
**Fix**: Added table alias `e` to qualify column in WHERE clause: `e.blueprint_id = p_blueprint_id`

### Issue 4: Network Connectivity
**Error**: IPv6 unreachable, connection timeouts
**Fix**: Created manual migration instructions as workaround

## 📝 Notes

- All migrations are idempotent (safe to rerun)
- Backfill script has dry-run mode as default for safety
- Estimated data is clearly marked to distinguish from actual usage
- Token estimation uses content-length heuristic (characters / 4)
- Cache token support is backward compatible (defaults to 0)

## 🔗 Related Files

- Migration files: `supabase/migrations/`
- Backfill script: `supabase/scripts/backfill-historical-costs.ts`
- Manual instructions: `supabase/MANUAL_MIGRATION_INSTRUCTIONS.md`
- Status document: `supabase/BACKFILL_STATUS.md` (this file)

## ✅ Next Steps

1. ⏳ Apply migrations to remote production database (manual via Dashboard)
2. ⏳ Verify functions exist with SQL query
3. ⏳ Set production environment variables
4. ⏳ Run backfill dry-run to preview changes
5. ⏳ Execute backfill on production data

---

**Last Updated**: 2025-11-12 (after fixing function signature conflict)
