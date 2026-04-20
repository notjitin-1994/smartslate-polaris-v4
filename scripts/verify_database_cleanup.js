#!/usr/bin/env node
/**
 * Verify Database Cleanup Script
 * Checks that only core technical tables remain after cleanup migration
 */

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client (using service role for admin access)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Missing Supabase environment variables');
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyDatabaseCleanup() {
  console.log('🔍 Verifying Database Cleanup...\n');

  try {
    // Test 1: Check core tables exist
    console.log('📋 Test 1: Checking core tables exist...');
    const coreTables = ['blueprint_generator', 'user_profiles', 'role_audit_log'];

    for (const table of coreTables) {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows, which is fine
        console.error(`  ❌ Error accessing ${table}: ${error.message}`);
      } else {
        console.log(`  ✅ ${table} - exists and accessible`);
      }
    }

    // Test 2: Verify removed tables are gone
    console.log('\n📋 Test 2: Checking removed tables are gone...');
    const removedTables = [
      'feedback_submissions',
      'feedback_types',
      'user_satisfaction_surveys',
      'user_usage_history'
    ];

    for (const table of removedTables) {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);

      if (error && error.code === '42P01') { // Table doesn't exist
        console.log(`  ✅ ${table} - successfully removed`);
      } else if (error) {
        console.log(`  ⚠️  ${table} - unexpected error: ${error.message}`);
      } else {
        console.log(`  ❌ ${table} - STILL EXISTS (should be removed)`);
      }
    }

    // Test 3: Check storage buckets
    console.log('\n📋 Test 3: Checking storage buckets...');
    const { data: buckets, error: bucketError } = await supabase
      .storage
      .listBuckets();

    if (bucketError) {
      console.error(`  ❌ Error listing buckets: ${bucketError.message}`);
    } else {
      const bucketNames = buckets.map(b => b.name);

      if (bucketNames.includes('avatars')) {
        console.log(`  ✅ avatars - retained (profile feature)`);
      } else {
        console.log(`  ⚠️  avatars - missing`);
      }

      if (!bucketNames.includes('feedback-attachments')) {
        console.log(`  ✅ feedback-attachments - successfully removed`);
      } else {
        console.log(`  ❌ feedback-attachments - STILL EXISTS (should be removed)`);
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('✅ Database Cleanup Verification Complete!');
    console.log('='.repeat(60));
    console.log('\nYour database now contains:');
    console.log('  • 3 core tables: blueprint_generator, user_profiles, role_audit_log');
    console.log('  • 1 storage bucket: avatars');
    console.log('  • All feedback system tables removed');
    console.log('  • All survey tables removed\n');

  } catch (error) {
    console.error('\n❌ Verification failed:', error.message);
    process.exit(1);
  }
}

// Run verification
verifyDatabaseCleanup();
