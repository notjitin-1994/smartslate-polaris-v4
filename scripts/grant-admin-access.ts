#!/usr/bin/env tsx

/**
 * Grant Admin Access Script
 *
 * This script grants developer tier access to a user by email.
 * It directly updates the database using Supabase service role credentials.
 *
 * Usage:
 *   npm run admin:grant-access <email>
 *   npm run admin:grant-access not.jitin@gmail.com
 *
 * Or with tsx directly:
 *   tsx scripts/grant-admin-access.ts not.jitin@gmail.com
 *
 * Environment Variables Required:
 *   - NEXT_PUBLIC_SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from frontend/.env.local
dotenv.config({ path: path.resolve(__dirname, '../frontend/.env.local') });

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message: string, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSuccess(message: string) {
  log(`✓ ${message}`, colors.green);
}

function logError(message: string) {
  log(`✗ ${message}`, colors.red);
}

function logInfo(message: string) {
  log(`ℹ ${message}`, colors.cyan);
}

function logWarning(message: string) {
  log(`⚠ ${message}`, colors.yellow);
}

async function grantAdminAccess(email: string) {
  log('\n==========================================', colors.bright);
  log('   Grant Admin Access Script', colors.bright);
  log('==========================================\n', colors.bright);

  // Validate environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    logError('Missing required environment variables!');
    logInfo('Please ensure the following are set in frontend/.env.local:');
    logInfo('  - NEXT_PUBLIC_SUPABASE_URL');
    logInfo('  - SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    logError(`Invalid email format: ${email}`);
    process.exit(1);
  }

  logInfo(`Target email: ${email}`);
  logInfo(`Supabase URL: ${supabaseUrl}\n`);

  // Create Supabase client with service role key (bypasses RLS)
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  try {
    // Step 1: Check if user exists
    log('Step 1: Looking up user...', colors.blue);

    // First, find user in auth.users by email
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();

    if (authError) {
      logError('Failed to fetch auth users!');
      logError(authError.message);
      process.exit(1);
    }

    const authUser = authUsers.users.find(u => u.email === email);

    if (!authUser) {
      logError('User not found!');
      logInfo(`No user found with email: ${email}`);
      logInfo('The user must sign up to the platform first.');
      logInfo('Ask the user to visit the platform and create an account, then run this script again.');
      process.exit(1);
    }

    // Now get the user profile
    const { data: existingProfile, error: fetchError } = await supabase
      .from('user_profiles')
      .select('user_id, user_role, subscription_tier, full_name, created_at')
      .eq('user_id', authUser.id)
      .single();

    if (fetchError || !existingProfile) {
      logError('User not found!');
      logInfo(
        `No user found with email: ${email}`
      );
      logInfo('The user must sign up to the platform first.');
      logInfo(
        'Ask the user to visit the platform and create an account, then run this script again.'
      );
      process.exit(1);
    }

    logSuccess('User found!');
    logInfo(`  User ID: ${existingProfile.user_id}`);
    logInfo(`  Name: ${existingProfile.full_name || 'Not set'}`);
    logInfo(`  Current Role: ${existingProfile.user_role}`);
    logInfo(`  Current Tier: ${existingProfile.subscription_tier}`);
    logInfo(`  Account Created: ${new Date(existingProfile.created_at).toLocaleString()}`);

    // Step 2: Check if already admin
    if (
      existingProfile.user_role === 'developer' &&
      existingProfile.subscription_tier === 'developer'
    ) {
      logWarning('\nUser already has developer access!');
      logInfo('No changes needed.');
      process.exit(0);
    }

    // Step 3: Grant admin access
    log('\nStep 2: Granting developer access...', colors.blue);

    const oldRole = existingProfile.user_role;
    const oldTier = existingProfile.subscription_tier;

    const { data: updatedProfile, error: updateError } = await supabase
      .from('user_profiles')
      .update({
        user_role: 'developer',
        subscription_tier: 'developer',
        blueprint_creation_limit: -1, // Unlimited
        blueprint_saving_limit: -1, // Unlimited
        role_assigned_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', existingProfile.user_id)
      .select()
      .single();

    if (updateError) {
      logError('Failed to update user profile!');
      logError(updateError.message);
      process.exit(1);
    }

    logSuccess('User profile updated!');

    // Step 4: Log to audit trail
    log('\nStep 3: Creating audit log entry...', colors.blue);

    const { error: auditError } = await supabase.from('role_audit_log').insert({
      admin_user_id: existingProfile.user_id, // Self-assignment
      target_user_id: existingProfile.user_id,
      old_role: oldRole,
      new_role: 'developer',
      reason: `Developer access granted via admin script - tier changed from ${oldTier} to developer`,
      metadata: {
        old_tier: oldTier,
        new_tier: 'developer',
        granted_at: new Date().toISOString(),
        method: 'CLI_SCRIPT',
        script: 'grant-admin-access.ts',
      },
    });

    if (auditError) {
      logWarning('Failed to create audit log entry');
      logWarning(auditError.message);
      // Don't fail the script if audit log fails
    } else {
      logSuccess('Audit log entry created!');
    }

    // Step 5: Display summary
    log('\n==========================================', colors.bright);
    log('   SUCCESS!', colors.green + colors.bright);
    log('==========================================\n', colors.bright);

    logSuccess(`Developer access granted to: ${email}`);
    logInfo('\nChanges made:');
    logInfo(`  Role: ${oldRole} → developer`);
    logInfo(`  Tier: ${oldTier} → developer`);
    logInfo(`  Blueprint Creation Limit: → Unlimited (-1)`);
    logInfo(`  Blueprint Saving Limit: → Unlimited (-1)`);
    logInfo('\nCapabilities granted:');
    logInfo('  ✓ Full access to /admin dashboard');
    logInfo('  ✓ Unlimited blueprint creation');
    logInfo('  ✓ Unlimited blueprint saving');
    logInfo('  ✓ User management capabilities');
    logInfo('  ✓ System monitoring and analytics');

    log('\n==========================================\n', colors.bright);
    logInfo('Next steps:');
    logInfo(`1. Ask ${email} to log out and log back in`);
    logInfo('2. They should now see the Admin Dashboard link');
    logInfo('3. Navigate to /admin to access the dashboard');
    log('');
  } catch (error) {
    logError('\nUnexpected error occurred!');
    console.error(error);
    process.exit(1);
  }
}

// Main execution
const email = process.argv[2];

if (!email) {
  logError('Email argument is required!');
  logInfo('\nUsage:');
  logInfo('  npm run admin:grant-access <email>');
  logInfo('  npm run admin:grant-access not.jitin@gmail.com');
  logInfo('\nOr with tsx:');
  logInfo('  tsx scripts/grant-admin-access.ts not.jitin@gmail.com');
  log('');
  process.exit(1);
}

grantAdminAccess(email).catch((error) => {
  logError('Fatal error:');
  console.error(error);
  process.exit(1);
});
