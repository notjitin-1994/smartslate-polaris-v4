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
    // Get all user profiles and find the one with the matching email
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('*');

    if (profilesError) {
      console.error('❌ Error fetching user profiles:', profilesError.message);
      return;
    }

    if (!profiles || profiles.length === 0) {
      console.error('❌ No user profiles found');
      return;
    }

    // Find the user with the matching email by checking auth.users
    let targetProfile = null;
    for (const profile of profiles) {
      const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
      
      if (!authError && users) {
        const user = users.find(u => u.id === profile.user_id && u.email === 'not.jitin@gmail.com');
        if (user) {
          targetProfile = { ...profile, email: user.email };
          break;
        }
      }
    }

    if (!targetProfile) {
      console.error('❌ User profile not found for: not.jitin@gmail.com');
      return;
    }

    console.log(`✅ Found user profile for: ${targetProfile.email} (ID: ${targetProfile.user_id})\n`);
    console.log('📋 User Profile Details:');
    console.log(`   - Subscription Tier: ${targetProfile.subscription_tier}`);
    console.log(`   - User Role: ${targetProfile.user_role}`);
    console.log(`   - Blueprint Creation Limit: ${targetProfile.blueprint_creation_limit === -1 ? 'Unlimited (∞)' : targetProfile.blueprint_creation_limit}`);
    console.log(`   - Blueprint Saving Limit: ${targetProfile.blueprint_saving_limit === -1 ? 'Unlimited (∞)' : targetProfile.blueprint_saving_limit}`);
    
    if (targetProfile.blueprint_usage_metadata) {
      console.log(`   - Exempt from Limits: ${targetProfile.blueprint_usage_metadata.exempt_from_limits || false}`);
      console.log(`   - Exemption Reason: ${targetProfile.blueprint_usage_metadata.exemption_reason || 'N/A'}`);
    }

    if (targetProfile.subscription_metadata) {
      const limits = targetProfile.subscription_metadata.limits || {};
      console.log(`   - Max Generations Monthly: ${limits.max_generations_monthly === -1 ? 'Unlimited (∞)' : limits.max_generations_monthly}`);
      console.log(`   - Max Saved Starmaps: ${limits.max_saved_starmaps === -1 ? 'Unlimited (∞)' : limits.max_saved_starmaps}`);
    }

    // Test the get_user_limits function
    console.log('\n🔧 Testing get_user_limits function:');
    const { data: limits, error: limitsError } = await supabase.rpc('get_user_limits', {
      p_user_id: targetProfile.user_id
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
      p_user_id: targetProfile.user_id
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
      p_user_id: targetProfile.user_id
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