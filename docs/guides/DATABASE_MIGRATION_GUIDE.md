# Database Migration Guide

## Overview

This guide provides comprehensive instructions for deploying Razorpay integration database migrations to production Supabase environment.

## Prerequisites

- Supabase CLI installed and authenticated
- Production Supabase project access
- Database backup procedures in place
- Appropriate permissions for database operations

## Migration Files

The following migration files are part of the Razorpay integration:

### Core Tables

1. **`20251029060000_create_razorpay_subscriptions_table.sql`**
   - Creates `subscriptions` table for storing Razorpay subscription data
   - Includes RLS policies, indexes, and helper functions
   - Automatically syncs with `user_profiles` table

2. **`20251029070000_create_razorpay_payments_table.sql`**
   - Creates `payments` table for storing payment transaction data
   - Links to subscriptions and users with foreign keys
   - Includes payment method tracking and refund support

3. **`20251029080000_create_razorpay_webhook_events_table.sql`**
   - Creates `razorpay_webhook_events` table for webhook logging
   - Tracks all webhook events for audit and debugging
   - Includes event processing status and retry logic

### Supporting Migrations

4. **`20251029090000_create_payment_history_function.sql`**
   - Creates helper functions for payment analytics
   - Provides user payment statistics and history
   - Supports subscription management queries

5. **`20251029100000_fix_user_profile_column_references.sql`**
   - Updates `user_profiles` table to support subscription integration
   - Adds new columns for subscription tier management
   - Creates triggers for automatic user limit updates

## Deployment Scripts

### 1. Migration Deployment Script

**Location**: `scripts/deploy-database-migrations.sh`

**Usage**:
```bash
# Deploy to production
npm run db:migrate:prod

# Deploy to development
npm run db:migrate
```

**Features**:
- ✅ Automatic database backup before migration
- ✅ Prerequisites checking (CLI, auth, environment variables)
- ✅ Production deployment confirmation prompts
- ✅ Migration verification and validation
- ✅ Detailed deployment logging
- ✅ Rollback procedures documentation
- ✅ Deployment report generation

### 2. Migration Verification Script

**Location**: `scripts/verify-database-migrations.ts`

**Usage**:
```bash
# Verify production deployment
npm run db:verify:prod

# Verify development deployment
npm run db:verify
```

**Verification Checks**:
- ✅ Database connectivity
- ✅ Table structure validation
- ✅ Row Level Security (RLS) policies
- ✅ Database indexes
- ✅ Custom functions
- ✅ Foreign key constraints
- ✅ Database triggers
- ✅ Performance statistics

## Step-by-Step Deployment Process

### Step 1: Environment Setup

1. **Set up Supabase CLI**:
   ```bash
   npm install -g supabase
   supabase login
   ```

2. **Configure environment variables**:
   ```bash
   export SUPABASE_PROJECT_REF=your_production_project_ref
   export SUPABASE_DB_PASSWORD=your_production_db_password
   ```

3. **Verify prerequisites**:
   ```bash
   supabase projects list
   supabase db shell --help
   ```

### Step 2: Pre-Deployment Checklist

✅ **Backup Strategy**:
- [ ] Recent database backup available
- [ ] Backup restoration procedures tested
- [ ] Emergency rollback plan documented

✅ **Environment Validation**:
- [ ] Production Supabase URL confirmed
- [ ] Database credentials verified
- [ ] Network connectivity tested
- [ ] Required permissions confirmed

✅ **Migration Review**:
- [ ] All migration files reviewed
- [ ] SQL syntax validated
- [ ] Rollback scripts tested
- [ ] Performance impact assessed

### Step 3: Deployment Execution

1. **Create manual backup** (recommended):
   ```bash
   # Using Supabase dashboard
   # Go to Settings → Database → Backups → Create Backup
   ```

2. **Run migration script**:
   ```bash
   npm run db:migrate:prod
   ```

3. **Confirm deployment prompts**:
   ```
   DEPLOYING TO PRODUCTION ENVIRONMENT
   Are you sure you want to continue? (yes/no): yes

   About to apply the following migrations to production:
     - 20251029060000_create_razorpay_subscriptions_table.sql
     - 20251029070000_create_razorpay_payments_table.sql
     - 20251029080000_create_razorpay_webhook_events_table.sql
     - 20251029090000_create_payment_history_function.sql
     - 20251029100000_fix_user_profile_column_references.sql

   Continue with deployment? (yes/no): yes
   ```

4. **Monitor deployment progress**:
   ```
   [2025-10-30 12:00:00] Starting database migration deployment for environment: production
   [2025-10-30 12:00:01] Checking prerequisites...
   [2025-10-30 12:00:02] Prerequisites check passed
   [2025-10-30 12:00:03] Creating database backup...
   [2025-10-30 12:00:15] Database backup created: pre-migration-backup-20251030_120015.sql
   [2025-10-30 12:00:16] Starting migration deployment...
   [2025-10-30 12:00:17] Applying migration: 20251029060000_create_razorpay_subscriptions_table.sql
   [2025-10-30 12:00:25] Migration applied successfully: 20251029060000_create_razorpay_subscriptions_table.sql
   ...
   [2025-10-30 12:02:30] Migration verification completed
   [2025-10-30 12:02:31] Deployment report generated
   [2025-10-30 12:02:32] Database migration deployment completed successfully!
   ```

### Step 4: Post-Deployment Verification

1. **Run verification script**:
   ```bash
   npm run db:verify:prod
   ```

2. **Expected verification output**:
   ```
   🔍 Starting database migration verification for PRODUCTION environment
   ============================================================

   ✅ Database connection successful

   📋 Verifying Razorpay tables...
   ✅ Table 'subscriptions' exists
   ✅ Table 'payments' exists
   ✅ Table 'razorpay_webhook_events' exists

   🔒 Verifying Row Level Security policies...
   ✅ RLS enabled for table 'subscriptions'
   ✅ RLS enabled for table 'payments'
   ✅ RLS enabled for table 'razorpay_webhook_events'

   📊 Verifying database indexes...
   ✅ Index available for table 'subscriptions' on columns: user_id
   ✅ Index available for table 'subscriptions' on columns: razorpay_subscription_id
   ...

   📈 Gathering database statistics...
   📊 subscriptions: 0 rows
   📊 payments: 0 rows
   📊 razorpay_webhook_events: 0 rows

   ============================================================
   📊 VERIFICATION RESULTS
   ============================================================
   Environment: PRODUCTION
   Total Checks: 7
   Passed: 7
   Failed: 0
   Success Rate: 100.0%

   🎉 ALL CRITICAL CHECKS PASSED!
   ✅ Database is ready for production deployment
   ```

### Step 5: Manual Verification

1. **Check table structure in Supabase Dashboard**:
   - Go to Database → Tables
   - Verify `subscriptions`, `payments`, `razorpay_webhook_events` exist
   - Check RLS policies are enabled
   - Review table schemas

2. **Test database functions**:
   ```sql
   -- Test subscription helper function
   SELECT get_active_subscription('test-user-id');

   -- Test payment statistics function
   SELECT calculate_user_blueprint_stats('test-user-id');
   ```

3. **Verify foreign key relationships**:
   - Check that `subscriptions.user_id` references `auth.users.id`
   - Verify `payments.subscription_id` references `subscriptions.subscription_id`
   - Confirm cascade delete behavior

## Troubleshooting

### Common Issues and Solutions

#### Issue 1: Migration Timeout
**Problem**: Migration script hangs or times out
**Solution**:
```bash
# Check database connection
supabase db shell --db-url "postgresql://postgres:$SUPABASE_DB_PASSWORD@db.$SUPABASE_PROJECT_REF.supabase.co:5432/postgres" -c "SELECT 1;"

# Restart migration process
npm run db:migrate:prod
```

#### Issue 2: Permission Denied
**Problem**: "Permission denied" errors during migration
**Solution**:
```bash
# Verify service role key permissions
echo $SUPABASE_SERVICE_ROLE_KEY

# Check user has required permissions
supabase db shell --db-url "..." -c "SELECT rolname FROM pg_roles;"
```

#### Issue 3: Foreign Key Constraint Violation
**Problem**: Foreign key constraint errors during migration
**Solution**:
```sql
-- Check for orphaned records before migration
SELECT COUNT(*) FROM user_profiles WHERE user_id NOT IN (SELECT id FROM auth.users);

-- Clean up orphaned records if needed
DELETE FROM user_profiles WHERE user_id NOT IN (SELECT id FROM auth.users);
```

#### Issue 4: RLS Policy Conflicts
**Problem**: RLS policies blocking migration operations
**Solution**:
```sql
-- Temporarily disable RLS for migration
ALTER TABLE subscriptions DISABLE ROW LEVEL SECURITY;
-- Run migration
-- Re-enable RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
```

## Rollback Procedures

### Emergency Rollback

If critical issues are detected after deployment:

1. **Stop application**:
   ```bash
   # Scale down Vercel deployment or put in maintenance mode
   ```

2. **Restore database backup**:
   ```bash
   # Using backup created during migration
   psql "postgresql://postgres:$SUPABASE_DB_PASSWORD@db.$SUPABASE_PROJECT_REF.supabase.co:5432/postgres" < pre-migration-backup-20251030_120015.sql
   ```

3. **Verify rollback**:
   ```bash
   npm run db:verify:prod
   ```

4. **Document rollback**:
   - Create incident report
   - Document root cause analysis
   - Update deployment procedures

### Selective Rollback

If only specific migrations need to be rolled back:

1. **Identify problematic migration**:
   ```sql
   -- Check migration history
   SELECT * FROM supabase_migrations.schema_migrations ORDER BY installed_on DESC;
   ```

2. **Create manual rollback script**:
   ```sql
   -- Example: Rollback subscriptions table
   DROP TABLE IF EXISTS subscriptions CASCADE;
   DROP FUNCTION IF EXISTS get_active_subscription;
   DROP FUNCTION IF EXISTS cancel_subscription;
   ```

3. **Execute rollback**:
   ```bash
   supabase db shell --db-url "..." < rollback-script.sql
   ```

## Performance Optimization

### Database Indexes

The following indexes are automatically created:

1. **Subscriptions Table**:
   - `idx_subscriptions_user_id` (user queries)
   - `idx_subscriptions_razorpay_subscription_id` (webhook lookups)
   - `idx_subscriptions_status` (status filtering)
   - `idx_subscriptions_subscription_tier` (tier filtering)
   - `idx_subscriptions_next_billing_date` (billing queries)

2. **Payments Table**:
   - `idx_payments_subscription_id` (payment history)
   - `idx_payments_user_id` (user payment history)
   - `idx_payments_razorpay_payment_id` (webhook lookups)
   - `idx_payments_status` (status filtering)
   - `idx_payments_created_at` (chronological queries)

3. **Webhook Events Table**:
   - `idx_webhook_events_event_id` (deduplication)
   - `idx_webhook_events_event_type` (event filtering)
   - `idx_webhook_events_created_at` (chronological queries)

### Query Optimization

Optimize common queries:

1. **User Subscription Lookup**:
   ```sql
   -- Optimized query using indexes
   SELECT * FROM subscriptions
   WHERE user_id = $1
     AND status IN ('active', 'authenticated')
   ORDER BY created_at DESC
   LIMIT 1;
   ```

2. **Payment History**:
   ```sql
   -- Optimized payment history query
   SELECT p.*, s.plan_name
   FROM payments p
   JOIN subscriptions s ON p.subscription_id = s.subscription_id
   WHERE p.user_id = $1
   ORDER BY p.created_at DESC
   LIMIT 50;
   ```

## Monitoring and Maintenance

### Post-Migration Monitoring

Monitor these metrics for 24 hours after migration:

1. **Database Performance**:
   - Query response times
   - Connection pool utilization
   - Database size growth

2. **Application Performance**:
   - API response times
   - Error rates
   - Payment processing success rates

3. **Data Integrity**:
   - Foreign key constraint violations
   - Data consistency checks
   - Backup verification

### Regular Maintenance

1. **Weekly**:
   - Monitor table growth
   - Check index efficiency
   - Review query performance

2. **Monthly**:
   - Analyze slow queries
   - Optimize indexes if needed
   - Review RLS policy performance

3. **Quarterly**:
   - Full database performance review
   - Schema optimization assessment
   - Backup restoration testing

## Documentation and Reporting

### Deployment Reports

Each migration generates a detailed report including:
- Migration summary
- Applied changes
- Verification results
- Performance impact
- Rollback procedures

### Audit Trail

All migration activities are logged to:
- `deployment.log` (timestamped entries)
- Supabase migration history
- Git commit history

### Change Management

Document all database changes:
- Migration files with detailed comments
- Impact analysis for each change
- Performance benchmarks before/after
- Rollback procedures for each migration

---

**Important Notes**:
- Always create backups before migration
- Test migrations in staging first
- Monitor performance after deployment
- Document all changes and issues
- Have rollback procedures ready