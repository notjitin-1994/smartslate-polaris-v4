#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');
dotenv.config({ path: join(projectRoot, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   - NEXT_PUBLIC_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifyDeveloperRole() {
  console.log('🔍 Verifying developer role for not.jitin@gmail.com...\n');

  try {
    // Use a direct SQL query to get user profile with email
    const { data: profiles, error: profileError } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT 
            up.user_id,
            up.subscription_tier,
            up.user_role,
            up.blueprint_creation_limit,
            up.blueprint_saving_limit,
            up.blueprint_usage_metadata,
            up.subscription_metadata,
            au.email
          FROM user_profiles up
          JOIN auth.users au ON up.user_id = au.id
          WHERE au.email = 'not.jitin@gmail.com'
          LIMIT 1;
        `
      });

    if (profileError) {
      console.error('❌ Error fetching user profile:', profileError.message);
      return;
    }

    if (!profiles || profiles.length === 0) {
      console.error('❌ User profile not found for: not.jitin@gmail.com');
      return;
    }

    const profile = profiles[0];
    console.log(`✅ Found user profile for: ${profile.email} (ID: ${profile.user_id})\n`);
    console.log('📋 User Profile Details:');
    console.log(`   - Subscription Tier: ${profile.subscription_tier}`);
    console.log(`   - User Role: ${profile.user_role}`);
    console.log(`   - Blueprint Creation Limit: ${profile.blueprint_creation_limit === -1 ? 'Unlimited (∞)' : profile.blueprint_creation_limit}`);
    console.log(`   - Blueprint Saving Limit: ${profile.blueprint_saving_limit === -1 ? 'Unlimited (∞)' : profile.blueprint_saving_limit}`);
    
    if (profile.blueprint_usage_metadata) {
      console.log(`   - Exempt from Limits: ${profile.blueprint_usage_metadata.exempt_from_limits || false}`);
      console.log(`   - Exemption Reason: ${profile.blueprint_usage_metadata.exemption_reason || 'N/A'}`);
    }

    if (profile.subscription_metadata) {
      const limits = profile.subscription_metadata.limits || {};
      console.log(`   - Max Generations Monthly: ${limits.max_generations_monthly === -1 ? 'Unlimited (∞)' : limits.max_generations_monthly}`);
      console.log(`   - Max Saved Starmaps: ${limits.max_saved_starmaps === -1 ? 'Unlimited (∞)' : limits.max_saved_starmaps}`);
    }

    // Test the get_user_limits function
    console.log('\n🔧 Testing get_user_limits function:');
    const { data: limits, error: limitsError } = await supabase.rpc('get_user_limits', {
      p_user_id: profile.user_id
    });

    if (limitsError) {
      console.error('❌ Error calling get_user_limits:', limitsError.message);
    } else if (limits && limits.length > 0) {
      const limit = limits[0];
      console.log(`   - Role: ${limit.role}`);
      console.log(`   - Tier: ${limit.tier}`);
      console.log(`   - Max Generations: ${limit.max_generations_monthly === -1 ? 'Unlimited (∞)' : limit.max_generations_monthly}`);
      console.log(`   - Max Saved: ${limit.max_saved_starmaps === -1 ? 'Unlimited (∞)' : limit.max_saved_starmaps}`);
      console.log(`   - Is Exempt: ${limit.is_exempt}`);
    }

    // Test the check_blueprint_creation_limits function
    console.log('\n🔧 Testing check_blueprint_creation_limits function:');
    const { data: creationLimits, error: creationError } = await supabase.rpc('check_blueprint_creation_limits', {
      p_user_id: profile.user_id
    });

    if (creationError) {
      console.error('❌ Error calling check_blueprint_creation_limits:', creationError.message);
    } else if (creationLimits && creationLimits.length > 0) {
      const limit = creationLimits[0];
      console.log(`   - Can Create: ${limit.can_create}`);
      console.log(`   - Current Count: ${limit.current_count}`);
      console.log(`   - Limit Count: ${limit.limit_count === -1 ? 'Unlimited (∞)' : limit.limit_count}`);
      console.log(`   - Remaining: ${limit.remaining === -1 ? 'Unlimited (∞)' : limit.remaining}`);
      console.log(`   - Reason: ${limit.reason}`);
    }

    // Test the check_blueprint_saving_limits function
    console.log('\n🔧 Testing check_blueprint_saving_limits function:');
    const { data: savingLimits, error: savingError } = await supabase.rpc('check_blueprint_saving_limits', {
      p_user_id: profile.user_id
    });

    if (savingError) {
      console.error('❌ Error calling check_blueprint_saving_limits:', savingError.message);
    } else if (savingLimits && savingLimits.length > 0) {
      const limit = savingLimits[0];
      console.log(`   - Can Save: ${limit.can_save}`);
      console.log(`   - Current Count: ${limit.current_count}`);
      console.log(`   - Limit Count: ${limit.limit_count === -1 ? 'Unlimited (∞)' : limit.limit_count}`);
      console.log(`   - Remaining: ${limit.remaining === -1 ? 'Unlimited (∞)' : limit.remaining}`);
      console.log(`   - Reason: ${limit.reason}`);
    }

    console.log('\n✅ Verification complete!');

  } catch (err) {
    console.error('❌ Verification failed:', err.message);
    process.exit(1);
  }
}

verifyDeveloperRole();