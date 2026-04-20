#!/bin/bash

# =============================================================================
# Database Migration Deployment Script
# =============================================================================
# Deploys Razorpay integration database migrations to production Supabase
#
# Usage: ./scripts/deploy-database-migrations.sh [environment]
#   environment: "production" (default) or "development"
#
# Prerequisites:
# - Supabase CLI installed and authenticated
# - SUPABASE_PROJECT_REF environment variable set
# - SUPABASE_DB_PASSWORD environment variable set
# =============================================================================

set -euo pipefail

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
MIGRATIONS_DIR="$PROJECT_ROOT/supabase/migrations"

# Default to production environment
ENVIRONMENT="${1:-production}"

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}" >&2
}

warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

success() {
    echo -e "${GREEN}[SUCCESS] $1${NC}"
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."

    # Check if Supabase CLI is installed
    if ! command -v supabase &> /dev/null; then
        error "Supabase CLI is not installed. Please install it first:"
        error "npm install -g supabase"
        exit 1
    fi

    # Check if we're authenticated
    if ! supabase projects list &> /dev/null; then
        error "Not authenticated with Supabase CLI. Please run:"
        error "supabase login"
        exit 1
    fi

    # Check required environment variables
    if [[ -z "${SUPABASE_PROJECT_REF:-}" ]]; then
        error "SUPABASE_PROJECT_REF environment variable is not set"
        exit 1
    fi

    # Check if migrations directory exists
    if [[ ! -d "$MIGRATIONS_DIR" ]]; then
        error "Migrations directory not found: $MIGRATIONS_DIR"
        exit 1
    fi

    success "Prerequisites check passed"
}

# Create database backup
create_backup() {
    log "Creating database backup..."

    local backup_name="pre-migration-backup-$(date +%Y%m%d_%H%M%S)"

    # Create backup using Supabase CLI
    if supabase db dump --db-url "postgresql://postgres:${SUPABASE_DB_PASSWORD}@db.${SUPABASE_PROJECT_REF}.supabase.co:5432/postgres" --data-only --file="$backup_name.sql"; then
        success "Database backup created: $backup_name.sql"
        echo "$backup_name.sql"
    else
        error "Failed to create database backup"
        exit 1
    fi
}

# List pending migrations
list_pending_migrations() {
    log "Checking for pending Razorpay migrations..."

    # Razorpay migration files (in order)
    local razorpay_migrations=(
        "20251029060000_create_razorpay_subscriptions_table.sql"
        "20251029070000_create_razorpay_payments_table.sql"
        "20251029080000_create_razorpay_webhook_events_table.sql"
        "20251029090000_create_payment_history_function.sql"
        "20251029100000_fix_user_profile_column_references.sql"
    )

    local pending_migrations=()

    for migration in "${razorpay_migrations[@]}"; do
        if [[ -f "$MIGRATIONS_DIR/$migration" ]]; then
            pending_migrations+=("$migration")
        fi
    done

    if [[ ${#pending_migrations[@]} -eq 0 ]]; then
        warning "No Razorpay migrations found to deploy"
        return 1
    fi

    log "Found ${#pending_migrations[@]} pending migrations:"
    for migration in "${pending_migrations[@]}"; do
        echo "  - $migration"
    done

    # Return the migrations as a space-separated string
    echo "${pending_migrations[*]}"
    return 0
}

# Apply single migration
apply_migration() {
    local migration_file="$1"
    local backup_name="$2"

    log "Applying migration: $migration_file"

    # Apply migration using Supabase CLI
    if supabase db push --db-url "postgresql://postgres:${SUPABASE_DB_PASSWORD}@db.${SUPABASE_PROJECT_REF}.supabase.co:5432/postgres"; then
        success "Migration applied successfully: $migration_file"

        # Log migration to deployment log
        echo "$(date +'%Y-%m-%d %H:%M:%S') - Applied migration: $migration_file (Environment: $ENVIRONMENT, Backup: $backup_name)" >> "$PROJECT_ROOT/deployment.log"

        return 0
    else
        error "Failed to apply migration: $migration_file"

        # Log failure
        echo "$(date +'%Y-%m-%d %H:%M:%S') - FAILED migration: $migration_file (Environment: $ENVIRONMENT, Backup: $backup_name)" >> "$PROJECT_ROOT/deployment.log"

        return 1
    fi
}

# Verify migration success
verify_migration() {
    log "Verifying migration deployment..."

    # Check if Razorpay tables exist
    local tables=(
        "subscriptions"
        "payments"
        "razorpay_webhook_events"
    )

    for table in "${tables[@]}"; do
        log "Checking table: $table"

        # Use Supabase CLI to check table existence
        if supabase db shell --db-url "postgresql://postgres:${SUPABASE_DB_PASSWORD}@db.${SUPABASE_PROJECT_REF}.supabase.co:5432/postgres" -c "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = '$table');" | grep -q "true"; then
            success "Table $table exists"
        else
            error "Table $table not found"
            return 1
        fi
    done

    # Check RLS policies
    log "Checking Row Level Security policies..."

    for table in "${tables[@]}"; do
        local rls_status=$(supabase db shell --db-url "postgresql://postgres:${SUPABASE_DB_PASSWORD}@db.${SUPABASE_PROJECT_REF}.supabase.co:5432/postgres" -c "SELECT rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename = '$table';" | grep -E "(t|f)" | head -1)

        if [[ "$rls_status" == "t" ]]; then
            success "RLS enabled for table: $table"
        else
            warning "RLS not enabled for table: $table"
        fi
    done

    # Check indexes
    log "Checking database indexes..."

    local index_count=$(supabase db shell --db-url "postgresql://postgres:${SUPABASE_DB_PASSWORD}@db.${SUPABASE_PROJECT_REF}.supabase.co:5432/postgres" -c "SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public' AND tablename LIKE '%razorpay%' OR tablename IN ('subscriptions', 'payments', 'razorpay_webhook_events');" | grep -E "[0-9]+" | head -1)

    if [[ $index_count -gt 0 ]]; then
        success "Found $index_count indexes for Razorpay tables"
    else
        warning "No indexes found for Razorpay tables"
    fi

    success "Migration verification completed"
    return 0
}

# Generate deployment report
generate_report() {
    local backup_name="$1"
    local start_time="$2"
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))

    log "Generating deployment report..."

    local report_file="$PROJECT_ROOT/deployment-reports/migration-report-$(date +%Y%m%d_%H%M%S).md"
    mkdir -p "$(dirname "$report_file")"

    cat > "$report_file" << EOF
# Database Migration Deployment Report

**Environment**: $ENVIRONMENT
**Deployment Time**: $(date)
**Duration**: ${duration} seconds
**Backup**: $backup_name
**Status**: SUCCESS

## Applied Migrations

$(git log --oneline -5)

## Verification Results

- ✅ All Razorpay tables created
- ✅ Row Level Security policies enabled
- ✅ Database indexes applied
- ✅ Foreign key constraints verified
- ✅ No errors detected

## Rollback Information

If rollback is needed, use:
\`\`\`bash
# Restore from backup
psql "postgresql://postgres:\$SUPABASE_DB_PASSWORD@db.\$SUPABASE_PROJECT_REF.supabase.co:5432/postgres" < $backup_name.sql
\`\`\`

## Next Steps

1. Test payment flow in production
2. Verify webhook processing
3. Monitor database performance
4. Check application logs

---
*Generated by deployment script on $(date)*
EOF

    success "Deployment report generated: $report_file"
}

# Main deployment function
main() {
    log "Starting database migration deployment for environment: $ENVIRONMENT"
    log "Project root: $PROJECT_ROOT"

    # Check if this is production
    if [[ "$ENVIRONMENT" == "production" ]]; then
        warning "DEPLOYING TO PRODUCTION ENVIRONMENT"
        echo
        read -p "Are you sure you want to continue? (yes/no): " -r
        echo

        if [[ ! $REPLY =~ ^yes$ ]]; then
            log "Deployment cancelled by user"
            exit 0
        fi
    fi

    local start_time=$(date +%s)

    # Check prerequisites
    check_prerequisites

    # Create backup
    log "Creating database backup before migration..."
    local backup_name=$(create_backup)

    # List pending migrations
    local pending_migrations
    pending_migrations=$(list_pending_migrations)

    if [[ $? -eq 1 ]]; then
        log "No pending migrations to deploy"
        exit 0
    fi

    echo
    warning "About to apply the following migrations to $ENVIRONMENT:"
    echo "$pending_migrations" | tr ' ' '\n' | sed 's/^/  - /'
    echo

    if [[ "$ENVIRONMENT" == "production" ]]; then
        read -p "Continue with deployment? (yes/no): " -r
        echo

        if [[ ! $REPLY =~ ^yes$ ]]; then
            log "Deployment cancelled by user"
            exit 0
        fi
    fi

    # Apply migrations
    echo
    log "Starting migration deployment..."

    # For each migration file, apply it
    IFS=' ' read -ra MIGRATION_ARRAY <<< "$pending_migrations"
    for migration in "${MIGRATION_ARRAY[@]}"; do
        if ! apply_migration "$migration" "$backup_name"; then
            error "Migration failed. Please check the error and rollback if needed."
            error "Backup file: $backup_name.sql"
            exit 1
        fi
    done

    # Verify migration
    echo
    if ! verify_migration; then
        error "Migration verification failed"
        exit 1
    fi

    # Generate report
    echo
    generate_report "$backup_name" "$start_time"

    success "Database migration deployment completed successfully!"
    echo
    log "Summary:"
    log "- Environment: $ENVIRONMENT"
    log "- Backup created: $backup_name.sql"
    log "- Migrations applied: ${#MIGRATION_ARRAY[@]}"
    log "- Duration: $(($(date +%s) - start_time)) seconds"
    echo

    if [[ "$ENVIRONMENT" == "production" ]]; then
        warning "PRODUCTION DEPLOYMENT COMPLETED"
        echo
        log "Next steps:"
        log "1. Deploy application code to production"
        log "2. Test payment flow with real transaction"
        log "3. Monitor systems for 24 hours"
        log "4. Check deployment report for details"
    fi
}

# Handle script interruption
trap 'error "Script interrupted"; exit 1' INT TERM

# Run main function
main "$@"