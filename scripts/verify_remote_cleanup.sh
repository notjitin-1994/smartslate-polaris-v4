#!/bin/bash
# Verify Remote Database Cleanup
# This script connects to your remote Supabase database and lists all tables

echo "🔍 Checking remote database tables..."
echo "========================================"
echo ""

# Use Supabase CLI to run a query on remote database
npx supabase db remote exec \
  --query "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;" \
  2>&1 | grep -v "WARN:" | grep -v "Initialising" | grep -v "Connecting"

echo ""
echo "========================================"
echo "Expected result: Only 3 tables should be listed:"
echo "  1. blueprint_generator"
echo "  2. role_audit_log"
echo "  3. user_profiles"
echo ""
echo "If you see more tables, they still exist in the database."
echo "If you see only 3 tables, the cleanup was successful!"
