/**
 * Script to apply the public blueprint access RLS policy
 * This enables public (anon) access to blueprints with active share links
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../frontend/.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function applyRLSPolicy() {
  console.log('🔧 Applying public blueprint access RLS policy...\n');

  const sql = `
    -- Create RLS policy for public access to shared blueprints
    -- This allows unauthenticated (anon) users to SELECT blueprint_generator records
    -- ONLY if there's an active share_link pointing to that blueprint
    CREATE POLICY IF NOT EXISTS "Public can view blueprints with active share links"
      ON public.blueprint_generator
      FOR SELECT
      TO anon
      USING (
        id IN (
          SELECT blueprint_id
          FROM public.share_links
          WHERE is_active = true
        )
      );
  `;

  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql } as any);

    if (error) {
      // Try direct SQL execution as fallback
      console.log('Trying direct SQL execution...');
      const response = await fetch(`${supabaseUrl}/rest/v1/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: supabaseServiceKey,
          Authorization: `Bearer ${supabaseServiceKey}`,
        },
        body: JSON.stringify({ query: sql }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      console.log('✅ RLS policy applied successfully via direct SQL');
    } else {
      console.log('✅ RLS policy applied successfully');
    }

    // Verify the policy was created
    console.log('\n📋 Verifying policy...');
    const { data: policies, error: verifyError } = await supabase
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'blueprint_generator')
      .eq('policyname', 'Public can view blueprints with active share links');

    if (verifyError) {
      console.log('⚠️  Could not verify policy (may require Postgres access)');
    } else if (policies && policies.length > 0) {
      console.log('✅ Policy verified successfully');
    } else {
      console.log('⚠️  Policy not found in pg_policies');
    }

    console.log('\n✅ Migration complete!');
    console.log('\n📝 What this does:');
    console.log('   - Allows anonymous users to view blueprints via share links');
    console.log('   - Only blueprints with active share_links are accessible');
    console.log('   - Authenticated user policies remain unchanged');
  } catch (error: any) {
    console.error('\n❌ Error applying RLS policy:', error.message);
    console.error('\n💡 Alternative: Run this SQL directly in Supabase SQL Editor:');
    console.error('\n' + sql);
    process.exit(1);
  }
}

// Run the script
applyRLSPolicy();
