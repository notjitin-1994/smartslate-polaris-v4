# Cost Tracking Tests - Execution Guide

## Overview

Comprehensive test suite for cache token support in the cost tracking system.

## Test Files Created

### Unit Tests (frontend/**tests**/unit/)

1. **services/costTrackingService.test.ts** - 71 tests
   - logApiUsage with standard tokens
   - logApiUsage with cache tokens
   - getUserCostSummary
   - getAllUsersCostOverview
   - getModelIdForTracking
   - estimateTokenCount
   - Error handling

2. **claude/trackedClaudeClient.test.ts** - 58 tests
   - generate() with standard tokens
   - generate() with cache tokens
   - Error handling and status classification
   - Request/response metadata tracking
   - Model ID determination

3. **services/pricingValidationService.test.ts** - 47 tests
   - validateModelPricing
   - getModelsMissingPricing
   - checkAndAlertMissingPricing
   - Edge cases and error handling

### Integration Tests (frontend/**tests**/integration/)

4. **cost-tracking/full-cost-flow.test.ts**
   - Full flow: API → TrackedClaudeClient → costTrackingService → Database
   - Cache token logging and cost calculation
   - Pricing validation
   - Cost aggregation
   - Error handling

### Database Tests (frontend/**tests**/database/)

5. **cost-tracking-sql-functions.test.ts**
   - log_api_usage() PostgreSQL function
   - Cache token cost calculations
   - models_missing_pricing view
   - get_cache_token_stats() function
   - Data integrity constraints

### End-to-End Tests (frontend/**tests**/e2e/)

6. **cost-tracking-complete-flow.test.ts**
   - Real user workflows
   - Blueprint generation with cache
   - Multiple users with different patterns
   - Admin dashboard visibility
   - Cost calculation accuracy

## Running Tests

### Quick Start

```bash
cd frontend

# Run all cost tracking tests
npm run test -- cost-tracking

# Run specific test file
npm run test -- __tests__/unit/services/costTrackingService.test.ts

# Run with coverage
npm run test -- --coverage cost-tracking
```

### Unit Tests Only

```bash
# All unit tests
npm run test -- __tests__/unit/

# Specific unit test
npm run test -- __tests__/unit/services/costTrackingService.test.ts
npm run test -- __tests__/unit/claude/trackedClaudeClient.test.ts
npm run test -- __tests__/unit/services/pricingValidationService.test.ts
```

### Integration Tests

```bash
# Requires test database
export TEST_SUPABASE_URL="your-test-url"
export TEST_SUPABASE_SERVICE_KEY="your-service-key"

npm run test:integration -- cost-tracking
```

### Database Tests

```bash
# Requires test database with migration applied
export TEST_SUPABASE_URL="your-test-url"
export TEST_SUPABASE_SERVICE_KEY="your-service-key"

npm run test -- __tests__/database/cost-tracking-sql-functions.test.ts
```

### End-to-End Tests

```bash
# Requires complete test environment
export TEST_SUPABASE_URL="your-test-url"
export TEST_SUPABASE_SERVICE_KEY="your-service-key"

npm run test:e2e -- cost-tracking
```

## Test Database Setup

### 1. Create Test Database

```bash
# Using Supabase CLI
supabase start

# Or create a separate test project on Supabase
```

### 2. Apply Migration

```bash
# From project root
cd supabase
supabase db push

# Or manually
psql -h localhost -U postgres -d postgres \
  -f migrations/20251112000000_enhance_cost_tracking_cache_tokens.sql
```

### 3. Seed Test Data

```sql
-- Add test pricing
INSERT INTO api_model_pricing (
  provider,
  model_id,
  input_cost_per_million_tokens,
  output_cost_per_million_tokens,
  cache_read_cost_per_million_tokens,
  description,
  is_active,
  effective_from
) VALUES
(
  'anthropic',
  'claude-sonnet-4-5-20250929',
  300,
  1500,
  30,
  'Claude Sonnet 4.5 - Test',
  true,
  NOW()
),
(
  'anthropic',
  'claude-sonnet-4-5-20250929-large',
  600,
  3000,
  60,
  'Claude Sonnet 4.5 Large - Test',
  true,
  NOW()
);
```

### 4. Set Environment Variables

```bash
# Add to .env.test or export
export TEST_SUPABASE_URL="http://localhost:54321"
export TEST_SUPABASE_SERVICE_KEY="your-service-role-key"
```

## Expected Test Results

### Unit Tests

- **Total**: 176 tests
- **Expected**: All pass
- **Duration**: ~2-3 seconds

### Integration Tests

- **Total**: ~25 tests
- **Expected**: All pass
- **Duration**: ~5-10 seconds
- **Requires**: Test database

### Database Tests

- **Total**: ~30 tests
- **Expected**: All pass
- **Duration**: ~10-15 seconds
- **Requires**: Test database with migration

### End-to-End Tests

- **Total**: ~20 tests
- **Expected**: All pass
- **Duration**: ~15-20 seconds
- **Requires**: Complete test environment

## Test Coverage Goals

- **Statements**: >95%
- **Branches**: >90%
- **Functions**: >95%
- **Lines**: >95%

## Viewing Coverage

```bash
# Generate coverage report
npm run test -- --coverage

# Open HTML report
open coverage/index.html
```

## Continuous Integration

### GitHub Actions Example

```yaml
name: Cost Tracking Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: supabase/postgres:15.1.0.117
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: cd frontend && npm ci

      - name: Run migration
        env:
          TEST_SUPABASE_URL: http://localhost:54321
          TEST_SUPABASE_SERVICE_KEY: ${{ secrets.TEST_SUPABASE_SERVICE_KEY }}
        run: |
          cd supabase
          npm run db:push

      - name: Run unit tests
        run: cd frontend && npm run test -- __tests__/unit/

      - name: Run integration tests
        env:
          TEST_SUPABASE_URL: http://localhost:54321
          TEST_SUPABASE_SERVICE_KEY: ${{ secrets.TEST_SUPABASE_SERVICE_KEY }}
        run: cd frontend && npm run test:integration

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./frontend/coverage/lcov.info
```

## Troubleshooting

### Tests Failing?

1. **Check database connection**:

   ```bash
   psql -h localhost -U postgres -c "SELECT 1;"
   ```

2. **Verify migration applied**:

   ```bash
   psql -h localhost -U postgres -c "\d api_usage_logs"
   ```

3. **Check test data**:

   ```bash
   psql -h localhost -U postgres -c "SELECT * FROM api_model_pricing WHERE is_active = true;"
   ```

4. **Review test logs**:
   ```bash
   npm run test -- --verbose
   ```

### Common Issues

#### "No pricing found for model"

- Ensure test pricing data is seeded
- Check model IDs match exactly

#### "Database connection failed"

- Verify TEST_SUPABASE_URL is correct
- Check TEST_SUPABASE_SERVICE_KEY is set
- Ensure database is running

#### "Migration not applied"

- Run migration manually
- Check migration logs for errors

#### "Permission denied"

- Use service role key for tests
- Check RLS policies aren't blocking test users

## Test Data Cleanup

Tests automatically clean up after themselves, but you can manually clean:

```sql
-- Delete test data
DELETE FROM api_usage_logs WHERE user_id IN (
  SELECT id FROM auth.users WHERE email LIKE '%test%'
);

DELETE FROM blueprint_generator WHERE user_id IN (
  SELECT id FROM auth.users WHERE email LIKE '%test%'
);

-- Delete test users (requires admin)
-- Use Supabase dashboard or:
DELETE FROM auth.users WHERE email LIKE '%test%';
```

## Next Steps

After tests pass:

1. ✅ Review test coverage report
2. ✅ Deploy migration to staging
3. ✅ Monitor staging for 24 hours
4. ✅ Deploy to production
5. ✅ Monitor production costs for accuracy

## Support

For issues:

- Check test output for specific failures
- Review migration logs
- Check application logs
- Verify pricing data is current
