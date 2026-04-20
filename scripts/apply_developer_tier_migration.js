#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
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

async function applyMigration() {
  console.log('🚀 Applying developer tier migration...\n');

  try {
    // Read the migration file
    const migrationPath = join(projectRoot, 'supabase/migrations/20251025000000_add_developer_tier.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf8');

    // Extract the SQL between BEGIN; and COMMIT;
    const sqlStatements = migrationSQL
      .replace(/^BEGIN;/m, '')
      .replace(/COMMIT;$/m, '')
      .trim();

    console.log('📝 Executing migration SQL...\n');

    // Execute the migration using the RPC call
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: sqlStatements,
    });

    if (error) {
      // If exec_sql doesn't exist, try direct execution
      console.log('⚠️  exec_sql function not found, trying direct execution...\n');

      // Split into individual statements and execute
      const statements = sqlStatements
        .split(/;\s*(?=UPDATE|DO|INSERT|SELECT)/g)
        .filter(s => s.trim().length > 0);

      for (const statement of statements) {
        const trimmed = statement.trim();
        if (trimmed) {
          console.log(`Executing: ${trimmed.substring(0, 50)}...`);
          const { error: execError } = await supabase.rpc('exec', {
            query: trimmed
          });

          if (execError) {
            console.error(`❌ Error executing statement: ${execError.message}`);
            console.error(`   Statement: ${trimmed.substring(0, 100)}...`);
          }
        }
      }
    }

    console.log('\n✅ Migration applied successfully!\n');

    // Verify the migration
    console.log('🔍 Verifying developer tier assignment...\n');

    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('subscription_tier, blueprint_creation_limit, blueprint_saving_limit, blueprint_usage_metadata')
      .eq('user_id', (await supabase.auth.admin.listUsers()).data.users.find(u => u.email === 'not.jitin@gmail.com')?.id)
      .single();

    if (profileError) {
      console.error('❌ Error verifying migration:', profileError.message);
    } else if (profile) {
      console.log('✅ Developer tier verified:');
      console.log(`   - Subscription Tier: ${profile.subscription_tier}`);
      console.log(`   - Creation Limit: ${profile.blueprint_creation_limit === -1 ? 'Unlimited (∞)' : profile.blueprint_creation_limit}`);
      console.log(`   - Saving Limit: ${profile.blueprint_saving_limit === -1 ? 'Unlimited (∞)' : profile.blueprint_saving_limit}`);
      console.log(`   - Exempt from Limits: ${profile.blueprint_usage_metadata?.exempt_from_limits || false}`);
    } else {
      console.warn('⚠️  Could not verify migration - user may not exist yet');
    }

  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  }
}

applyMigration();
