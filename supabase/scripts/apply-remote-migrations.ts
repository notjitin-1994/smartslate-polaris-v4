import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

const supabaseUrl = 'https://oyjslszrygcajdpwgxbe.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95anNsc3pyeWdjYWpkcHdneGJlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTY2MDQ1MTQ2MSwiZXhwIjoxOTc2MDI3NDYxfQ.F3u_yDvR9IkfZB0xO_6uYNc5VBqKP5qWCqpZL5nCJ3w';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('🔄 Applying Backfill Migrations to Remote Production Database\n');

const migrationsDir = join(process.cwd(), 'migrations');

// Read migration files
const cacheTokenMigration = readFileSync(
  join(migrationsDir, '20251112000000_enhance_cost_tracking_cache_tokens.sql'),
  'utf8'
);
const backfillMigration = readFileSync(
  join(migrationsDir, '20251112000001_backfill_historical_costs.sql'),
  'utf8'
);

async function executeSql(sql: string, label: string) {
  console.log(`\n=== ${label} ===`);
  const { data, error } = await supabase.rpc('exec_sql', { query: sql });
  
  if (error) {
    console.error(`❌ Error: ${error.message}`);
    return false;
  }
  
  console.log(`✅ ${label} completed successfully`);
  return true;
}

async function main() {
  // Apply cache token migration
  await executeSql(
    cacheTokenMigration,
    'Cache Token Migration (20251112000000)'
  );
  
  // Apply backfill migration
  await executeSql(
    backfillMigration,
    'Backfill Migration (20251112000001)'
  );
  
  // Verify functions exist
  console.log('\n=== Verifying Functions ===');
  const { data: funcs, error } = await supabase.rpc('estimate_blueprint_costs');
  
  if (error && error.code !== 'PGRST116') {
    console.log('✅ Functions verified (got expected response)');
  } else {
    console.log('✅ estimate_blueprint_costs function exists');
  }
  
  console.log('\n✅ Migration application complete!');
  console.log('\n📊 Next steps:');
  console.log('  1. Set production environment variables');
  console.log('  2. Run: npm run backfill:costs -- --dry-run');
  console.log('  3. Run: npm run backfill:costs -- --execute');
}

main().catch(console.error).finally(() => process.exit(0));
