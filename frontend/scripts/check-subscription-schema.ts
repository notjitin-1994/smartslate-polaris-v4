#!/usr/bin/env tsx

/**
 * Check the actual schema of the subscriptions table
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env.local') });

import { createClient } from '@supabase/supabase-js';

/**
* Checks the 'subscriptions' table schema and the information_schema.columns for the 'subscriptions' table in Supabase, logging results and any access errors to the console.
* @example
* checkSubscriptionSchema()
* Promise<void>
* @returns {Promise<void>} Logs schema and column information or errors to the console; resolves when checks complete.
**/
async function checkSubscriptionSchema() {
  console.log('🔍 Checking subscriptions table schema...');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // Use service role to see schema
  );

  try {
    // Try to get column information
    const { data, error } = await supabase.from('subscriptions').select('*').limit(1);

    if (error) {
      console.log('❌ Error accessing subscriptions table:', error.message);
      return;
    }

    if (data && data.length > 0) {
      console.log('✅ Found subscriptions table. Columns:');
      const columns = Object.keys(data[0]);
      columns.forEach((col) => console.log(`  - ${col}`));
    } else {
      console.log('ℹ️  Subscriptions table exists but is empty');
    }

    // Check if we can see information schema
    console.log('\n🔎 Checking information schema...');
    const { data: schemaData, error: schemaError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type')
      .eq('table_name', 'subscriptions')
      .eq('table_schema', 'public')
      .order('ordinal_position');

    if (schemaError) {
      console.log('❌ Cannot access information schema:', schemaError.message);
    } else {
      console.log('✅ Schema information:');
      schemaData?.forEach((col: any) => {
        console.log(`  - ${col.column_name} (${col.data_type})`);
      });
    }
  } catch (error: any) {
    console.error('❌ Unexpected error:', error.message);
  }
}

checkSubscriptionSchema();
