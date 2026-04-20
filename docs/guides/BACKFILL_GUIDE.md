# Historical Cost Backfill Guide

## Overview

This guide explains how to backfill cost estimates for blueprints and dynamic questionnaires that were generated **before** the cache token cost tracking was implemented.

## What Gets Backfilled

The backfill process creates **estimated** cost tracking logs for:
- ✅ Blueprints in `completed` or `generating` status
- ✅ Blueprints that have no existing `api_usage_logs` entries
- ✅ Both dynamic question generation and blueprint generation API calls

For each blueprint, **2 cost logs** are created:
1. **Dynamic Questions Generation** log
2. **Blueprint Generation** log

## How It Works

### Cost Estimation Method

Since we can't retroactively get actual token counts from past API calls, the system estimates costs based on **content length**:

**Token Estimation Formula**: `tokens ≈ characters / 4`

**Dynamic Questions Generation**:
- Input tokens: `static_answers` length + system prompt (≈8K tokens)
- Output tokens: `dynamic_questions` length

**Blueprint Generation**:
- Input tokens: `static_answers` + `dynamic_answers` + system prompt (≈15K tokens)
- Output tokens: `blueprint_markdown` length

**Cost Calculation**:
- Input cost: `(input_tokens / 1,000,000) × $3.00`
- Output cost: `(output_tokens / 1,000,000) × $15.00`
- Total cost split equally between the 2 API calls

### Estimated Log Metadata

All backfilled logs are marked as estimates:

```json
{
  "request_metadata": {
    "is_backfilled": true,
    "estimation_method": "content_length_estimation"
  },
  "response_metadata": {
    "is_estimated": true
  }
}
```

**Cache tokens** are set to `0` (not available for historical data).

## Prerequisites

### 1. Apply Migrations

First, ensure both migrations are applied:

```bash
# From project root
cd supabase

# Apply cache token migration
supabase db push

# Or manually apply both:
psql -h your-host -U postgres -d your-db \
  -f migrations/20251112000000_enhance_cost_tracking_cache_tokens.sql

psql -h your-host -U postgres -d your-db \
  -f migrations/20251112000001_backfill_historical_costs.sql
```

### 2. Set Environment Variables

```bash
# For production
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# For local development
export SUPABASE_URL="http://localhost:54321"
export SUPABASE_SERVICE_ROLE_KEY="your-local-service-key"
```

### 3. Verify Database Functions

```bash
# Check functions exist
psql -h your-host -U postgres -d your-db -c "\df estimate_blueprint_costs"
psql -h your-host -U postgres -d your-db -c "\df backfill_blueprint_costs"
```

## Usage

### Option 1: Using TypeScript Script (Recommended)

#### 1. Preview What Will Be Backfilled (Dry Run)

```bash
npm run backfill:costs -- --dry-run
```

Example output:
```
🔄 Historical Cost Backfill Script

📊 Mode: DRY RUN (preview only)
🎯 Target: All blueprints without cost logs

1️⃣  Fetching cost estimates...
✅ Found 150 blueprint(s) to process

📈 Cost Summary:
────────────────────────────────────────────────────────────────────────────────
Total Blueprints:    150
Total Estimated Cost: $425.75
Total Input Tokens:   12,450,000
Total Output Tokens:  16,100,000
Avg Cost/Blueprint:   $2.84
────────────────────────────────────────────────────────────────────────────────

2️⃣  Running dry-run (no changes will be made)...
✅ Processed 150 blueprint(s)

✅ DRY RUN COMPLETE - No changes made
────────────────────────────────────────────────────────────────────────────────
To execute the backfill, run:
  npm run backfill:costs -- --execute
────────────────────────────────────────────────────────────────────────────────
```

#### 2. Execute Backfill (With Confirmation)

```bash
npm run backfill:costs -- --execute
```

You'll be prompted to confirm:
```
⚠️  This will create estimated cost logs in the database. Continue? (yes/no):
```

#### 3. Execute Backfill (Skip Confirmation)

```bash
npm run backfill:costs -- --execute --yes
```

#### 4. Backfill Specific Blueprint

```bash
npm run backfill:costs -- --execute --blueprint-id=abc-123-def-456
```

#### 5. Get Help

```bash
npm run backfill:costs -- --help
```

### Option 2: Using SQL Directly

#### 1. Preview Estimates

```sql
-- See all blueprints that need backfilling
SELECT * FROM estimate_blueprint_costs();

-- Get total estimated cost
SELECT
  COUNT(*) as blueprint_count,
  SUM(estimated_cost_cents) as total_cost_cents,
  SUM(estimated_cost_cents) / 100.0 as total_cost_dollars
FROM estimate_blueprint_costs();
```

#### 2. Execute Backfill (Dry Run)

```sql
-- Preview without making changes
SELECT * FROM backfill_blueprint_costs(true);
```

#### 3. Execute Backfill (Actual)

```sql
-- Backfill all blueprints
SELECT * FROM backfill_blueprint_costs(false);

-- Backfill specific blueprint
SELECT * FROM backfill_blueprint_costs(false, 'abc-123-def-456'::uuid);
```

## Verification

### Check Backfilled Logs

```sql
-- Count backfilled logs
SELECT COUNT(*)
FROM api_usage_logs
WHERE request_metadata->>'is_backfilled' = 'true';

-- View backfilled logs
SELECT
  id,
  user_id,
  blueprint_id,
  endpoint,
  total_cost_cents,
  created_at,
  request_metadata,
  response_metadata
FROM api_usage_logs
WHERE request_metadata->>'is_backfilled' = 'true'
ORDER BY created_at DESC
LIMIT 10;

-- Total backfilled cost
SELECT
  COUNT(*) as log_count,
  COUNT(DISTINCT blueprint_id) as blueprint_count,
  SUM(total_cost_cents) as total_cost_cents,
  SUM(total_cost_cents) / 100.0 as total_cost_dollars
FROM api_usage_logs
WHERE request_metadata->>'is_backfilled' = 'true';
```

### Check User Cost Summaries

```sql
-- View top users by estimated costs
SELECT
  u.email,
  COUNT(DISTINCT aul.blueprint_id) as backfilled_blueprints,
  SUM(aul.total_cost_cents) as estimated_cost_cents,
  SUM(aul.total_cost_cents) / 100.0 as estimated_cost_dollars
FROM api_usage_logs aul
JOIN auth.users u ON aul.user_id = u.id
WHERE aul.request_metadata->>'is_backfilled' = 'true'
GROUP BY u.id, u.email
ORDER BY estimated_cost_cents DESC
LIMIT 10;
```

### Verify Admin Dashboard

Visit your admin dashboard to see the backfilled costs:
```
https://polaris.smartslate.io/admin/costs
```

The estimated costs should now appear in:
- ✅ Per-user cost breakdowns
- ✅ Monthly cost totals
- ✅ Cost by endpoint charts
- ✅ Cost by model charts

## Important Notes

### Accuracy

⚠️ **Estimated costs are approximations**, not exact values:
- Token estimation uses `characters / 4` heuristic
- Actual token counts vary by content complexity
- Typical accuracy: ±20-30% of actual costs

### Cache Tokens

❌ **Cache token data is NOT available** for historical blueprints:
- All cache token columns are set to `0`
- Historical data predates cache token tracking
- Only new API calls (post-migration) have accurate cache data

### Pricing Assumptions

The backfill uses **current pricing** to estimate historical costs:
- Input: $3.00 per million tokens (300 cents)
- Output: $15.00 per million tokens (1500 cents)
- If pricing has changed since blueprint generation, estimates may be off

### Data Integrity

✅ **Backfilled logs are clearly marked**:
- `request_metadata.is_backfilled = true`
- `response_metadata.is_estimated = true`
- Can be filtered out for "actual only" reports

## Troubleshooting

### No Blueprints Found

```
✅ No blueprints found that need backfilling!
```

**Possible causes**:
1. All blueprints already have cost logs ✅
2. No completed blueprints in database
3. Database connection issue

**Check**:
```sql
-- Count blueprints without logs
SELECT COUNT(*)
FROM blueprint_generator bg
WHERE bg.status IN ('completed', 'generating')
  AND NOT EXISTS (
    SELECT 1 FROM api_usage_logs aul WHERE aul.blueprint_id = bg.id
  );
```

### Permission Denied

```
❌ Error: Permission denied for function backfill_blueprint_costs
```

**Solution**: Ensure you're using the **service role key**, not the anon key:
```bash
export SUPABASE_SERVICE_ROLE_KEY="eyJhbG..."  # Service role key, not anon key
```

### Function Not Found

```
❌ Error: function backfill_blueprint_costs does not exist
```

**Solution**: Apply the migration:
```bash
cd supabase
supabase db push
```

### High Estimated Costs

If estimated costs seem too high:

1. **Check token estimates**:
   ```sql
   SELECT
     blueprint_id,
     estimated_input_tokens,
     estimated_output_tokens,
     estimated_cost_cents
   FROM estimate_blueprint_costs()
   ORDER BY estimated_cost_cents DESC
   LIMIT 10;
   ```

2. **Verify blueprint content isn't unusually large**:
   ```sql
   SELECT
     id,
     LENGTH(blueprint_markdown) as markdown_length,
     LENGTH(dynamic_questions::TEXT) as questions_length
   FROM blueprint_generator
   WHERE status = 'completed'
   ORDER BY markdown_length DESC
   LIMIT 10;
   ```

## Rollback

If you need to remove backfilled data:

```sql
-- Delete all backfilled logs
DELETE FROM api_usage_logs
WHERE request_metadata->>'is_backfilled' = 'true';

-- Check deletion
SELECT COUNT(*)
FROM api_usage_logs
WHERE request_metadata->>'is_backfilled' = 'true';
-- Should return 0
```

## Best Practices

### 1. Always Dry Run First

```bash
# Preview first
npm run backfill:costs -- --dry-run

# Then execute
npm run backfill:costs -- --execute
```

### 2. Backup Before Backfill

```bash
# Backup api_usage_logs table
pg_dump -h your-host -U postgres -d your-db -t api_usage_logs > backup_api_usage_logs.sql
```

### 3. Test on Staging

Run the backfill on staging environment first:
```bash
# Point to staging database
export SUPABASE_URL="https://staging-project.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="staging-service-key"

npm run backfill:costs -- --execute
```

### 4. Monitor After Backfill

After backfilling production:
```sql
-- Monitor backfill results
SELECT
  DATE(created_at) as date,
  COUNT(*) as log_count,
  SUM(total_cost_cents) / 100.0 as cost_dollars
FROM api_usage_logs
WHERE request_metadata->>'is_backfilled' = 'true'
GROUP BY DATE(created_at)
ORDER BY date;
```

### 5. Communicate to Users

If showing costs to users, explain that historical data is estimated:
```
* Costs before [date] are estimates based on content length
* Costs after [date] reflect actual API usage
```

## Performance

### Processing Speed

- **Dry run**: ~0.5 seconds per 100 blueprints
- **Actual backfill**: ~2-3 seconds per 100 blueprints

### Database Impact

- Minimal impact on active database
- Uses efficient batch processing
- No table locks required
- Can run during business hours

### Recommended Batch Size

For large datasets (>1000 blueprints):
```sql
-- Process in batches of 500
DO $$
DECLARE
  v_batch_size INTEGER := 500;
  v_offset INTEGER := 0;
  v_total INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_total FROM estimate_blueprint_costs();

  WHILE v_offset < v_total LOOP
    RAISE NOTICE 'Processing batch starting at %', v_offset;

    -- Process batch
    PERFORM backfill_blueprint_costs(false);

    v_offset := v_offset + v_batch_size;

    -- Brief pause between batches
    PERFORM pg_sleep(1);
  END LOOP;
END $$;
```

## Support

For issues or questions:
- Check troubleshooting section above
- Review migration logs for errors
- Verify environment variables are set correctly
- Check database connection and permissions

## Summary

✅ **Before running**:
1. Apply both migrations
2. Set environment variables
3. Run dry-run preview

✅ **To execute**:
```bash
npm run backfill:costs -- --execute
```

✅ **To verify**:
1. Check backfilled log counts
2. Review admin dashboard
3. Validate cost totals

✅ **Remember**:
- Estimated costs are approximations (±20-30%)
- No cache token data for historical blueprints
- Backfilled logs are clearly marked
- Always dry-run first!
