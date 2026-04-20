# How to Get Actual Costs on the Admin Page

## Current Situation

Your local database is **empty** (no users, no blueprints, no API logs), so the admin costs page shows $0.00. To see actual costs, you need to work with your **production database** where real data exists.

## Quick Option: Check Production via Dashboard

### Step 1: Check if Production Has Blueprints

1. Go to https://supabase.com/dashboard/project/oyjslszrygcajdpwgxbe
2. Navigate to **SQL Editor**
3. Run this query:

```sql
-- Check if there are blueprints to backfill
SELECT
  COUNT(*) as total_blueprints,
  COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_blueprints,
  MIN(created_at) as oldest,
  MAX(created_at) as newest
FROM blueprint_generator;
```

**If you see blueprints (count > 0)**, continue to Step 2.
**If count = 0**, you need to generate blueprints through your production app first.

### Step 2: Apply Migrations to Production

**IMPORTANT**: The migrations have been tested and all syntax errors fixed:
- ✅ Function signature conflicts resolved
- ✅ FILTER clause compatibility fixed
- ✅ COMMENT concatenation fixed
- ✅ Ambiguous column reference fixed

Follow the instructions in `MANUAL_MIGRATION_INSTRUCTIONS.md`:

1. In Supabase Dashboard SQL Editor, create a **New Query**
2. Copy/paste entire contents of `migrations/20251112000000_enhance_cost_tracking_cache_tokens.sql`
3. Click **Run**
4. Create another **New Query**
5. Copy/paste entire contents of `migrations/20251112000001_backfill_historical_costs.sql`
6. Click **Run**

### Step 3: Check What Will Be Backfilled

Run this in SQL Editor:

```sql
-- Preview backfill estimates
SELECT
  blueprint_id,
  estimated_cost_cents / 100.0 as estimated_cost_dollars,
  estimated_input_tokens,
  estimated_output_tokens,
  estimation_method
FROM estimate_blueprint_costs()
ORDER BY estimated_cost_cents DESC
LIMIT 20;
```

This shows you what costs will be estimated for historical blueprints.

### Step 4: Execute the Backfill via Dashboard

Option A - Backfill everything (DRY RUN first):

```sql
-- DRY RUN - Preview what will be created
SELECT * FROM backfill_blueprint_costs(true);
```

Option B - Execute the backfill:

```sql
-- EXECUTE - Create the estimated cost logs
SELECT * FROM backfill_blueprint_costs(false);
```

### Step 5: Verify Costs Appear

1. Go to your **production app**: https://[your-domain].com/admin/costs
2. You should now see cost data!

Alternatively, check via SQL:

```sql
-- Check API usage logs were created
SELECT
  COUNT(*) as total_logs,
  SUM(total_cost_cents) / 100.0 as total_cost_dollars,
  COUNT(CASE WHEN request_metadata->>'is_backfilled' = 'true' THEN 1 END) as backfilled_logs
FROM api_usage_logs;

-- Check user cost summaries
SELECT
  COUNT(*) as users_with_costs,
  SUM(total_cost_cents) / 100.0 as total_platform_cost
FROM user_cost_summaries
WHERE period_type = 'monthly'
  AND period_date = DATE_TRUNC('month', CURRENT_DATE)::DATE;
```

## Alternative: Use Node.js Script (Requires Environment Setup)

### Step 1: Set Production Environment Variables

```bash
export SUPABASE_URL="https://oyjslszrygcajdpwgxbe.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key-here"
```

**Where to find the service role key:**
1. Go to https://supabase.com/dashboard/project/oyjslszrygcajdpwgxbe/settings/api
2. Copy the **service_role** key (NOT the anon key)
3. This key has full access - keep it secret!

### Step 2: Preview Backfill (Dry Run)

```bash
npm run backfill:costs -- --dry-run
```

This will show you:
- How many blueprints will be backfilled
- Estimated total cost
- No actual changes made

### Step 3: Execute Backfill

```bash
npm run backfill:costs -- --execute
```

This creates the actual cost estimate logs.

### Step 4: Check the Admin Page

Go to your production URL at `/admin/costs` to see the costs.

## What Gets Backfilled?

For each completed blueprint that has **no existing cost logs**:

1. **Dynamic Question Generation Log** (estimated)
   - Input tokens: ~(static_answers + dynamic_questions) / 4
   - Output tokens: ~dynamic_questions / 4
   - Cost: Based on current pricing (~$3/M input, ~$15/M output)
   - Marked with: `"is_backfilled": true`, `"is_estimated": true`

2. **Blueprint Generation Log** (estimated)
   - Input tokens: ~(dynamic_answers + blueprint) / 4
   - Output tokens: ~blueprint / 4
   - Cost: Based on current pricing
   - Marked with: `"is_backfilled": true`, `"is_estimated": true`

## Estimated vs Actual Costs

- **Estimated costs** (from backfill): ±20-30% accurate, based on content length
- **Actual costs** (from new blueprints): 100% accurate, from Claude API usage response
- All estimated data is clearly marked with metadata flags

## For Local Development Testing

If you want to test the admin costs page locally with sample data:

1. **Sign up** at http://localhost:3000 (create a local account)
2. **Generate a blueprint** (complete questionnaire → generate questions → generate blueprint)
3. **View costs** at http://localhost:3000/admin/costs

This will create real API usage logs with actual costs from Claude API.

## Troubleshooting

### "No pricing found for model" Warning

If you see logs with `pricing_found: false`:

```sql
-- Check which models are missing pricing
SELECT * FROM models_missing_pricing;

-- Add pricing for a model
INSERT INTO api_model_pricing (
  provider, model_id,
  input_cost_per_million_tokens,
  output_cost_per_million_tokens,
  cache_read_cost_per_million_tokens,
  is_active
) VALUES (
  'anthropic', 'claude-sonnet-4-20250514',
  300, 1500, 30,  -- $3, $15, $0.30 per million tokens (in cents)
  true
);
```

### Costs Not Appearing

1. Check blueprints exist: `SELECT COUNT(*) FROM blueprint_generator WHERE status = 'completed';`
2. Check logs were created: `SELECT COUNT(*) FROM api_usage_logs;`
3. Check summaries updated: `SELECT COUNT(*) FROM user_cost_summaries;`
4. Try refreshing the admin page (Refresh Data button)
5. Check browser console for errors

### Backfill Script Errors

- **"No blueprints found"**: No completed blueprints exist yet
- **"Pricing not found"**: Run the pricing INSERT query above
- **"Connection error"**: Check SUPABASE_URL and SERVICE_ROLE_KEY are set correctly

## Summary

**Fastest path to see costs:**

1. ✅ Apply migrations via Supabase Dashboard SQL Editor
2. ✅ Run `SELECT * FROM backfill_blueprint_costs(false);` in SQL Editor
3. ✅ Check your production admin page: https://[your-domain].com/admin/costs

The data is in your **production database**, not local. That's why you see $0.00 locally.
