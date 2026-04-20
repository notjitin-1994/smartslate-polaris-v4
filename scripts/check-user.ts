#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../frontend/.env.local') });

async function checkUser(email: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing environment variables');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  // First get the user from auth.users by email
  const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();

  if (authError) {
    console.error('Error fetching auth users:', authError.message);
    return;
  }

  const authUser = authUsers.users.find(u => u.email === email);

  if (!authUser) {
    console.log('User not found in auth.users with email:', email);
    return;
  }

  console.log('\nAuth User Found:');
  console.log('Email:', authUser.email);
  console.log('User ID:', authUser.id);
  console.log('Created:', authUser.created_at);

  // Now get the user profile
  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', authUser.id)
    .single();

  if (profileError || !profile) {
    console.log('\n❌ User profile not found!');
    console.log('Error:', profileError?.message || 'No profile data');
    console.log('\nThe user exists in auth but has no profile.');
    console.log('A profile should have been auto-created on signup.');
    return;
  }

  console.log('\n✅ User Profile Found:');
  console.log('======================');
  console.log('User ID:', profile.user_id);
  console.log('Full Name:', profile.full_name || 'Not set');
  console.log('User Role:', profile.user_role);
  console.log('Subscription Tier:', profile.subscription_tier);
  console.log('Creation Count:', profile.blueprint_creation_count);
  console.log('Creation Limit:', profile.blueprint_creation_limit);
  console.log('Saving Count:', profile.blueprint_saving_count);
  console.log('Saving Limit:', profile.blueprint_saving_limit);
  console.log('Created:', profile.created_at);
  console.log('Updated:', profile.updated_at);

  console.log('\n📊 Access Status:');
  console.log('================');
  if (profile.user_role === 'developer') {
    console.log('✅ HAS ADMIN ACCESS - Role is developer');
  } else {
    console.log('❌ NO ADMIN ACCESS - Role is', profile.user_role);
    console.log('   Run: npm run admin:grant-access not.jitin@gmail.com');
  }
}

const email = process.argv[2] || 'not.jitin@gmail.com';
checkUser(email);
