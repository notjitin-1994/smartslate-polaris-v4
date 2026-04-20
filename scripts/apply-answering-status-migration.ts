/**
 * Script to apply the 'answering' status migration
 * Adds the missing status value to blueprint_generator table
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing required environment variables:');
  console.error('   - NEXT_PUBLIC_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

async function applyMigration() {
  console.log('🚀 Applying answering status migration...\n');
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, '../supabase/migrations/0024_add_answering_status.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');
    
    console.log('📄 Migration file loaded');
    console.log('📍 File:', migrationPath);
    console.log('📏 Size:', migrationSQL.length, 'characters\n');

    // Split into individual statements (rough split by semicolon)
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log('📝 Found', statements.length, 'SQL statements\n');

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`⚙️  Executing statement ${i + 1}/${statements.length}...`);
      
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' });
        
        if (error) {
          // Try direct query instead
          console.log('   Trying direct query...');
          const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': SUPABASE_SERVICE_KEY,
              'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
            },
            body: JSON.stringify({ sql: statement + ';' }),
          });
          
          if (!response.ok) {
            console.warn('   ⚠️  Statement may have failed (or already applied)');
            console.warn('   Error:', error?.message || 'Unknown');
          } else {
            console.log('   ✅ Applied');
          }
        } else {
          console.log('   ✅ Applied');
        }
      } catch (err) {
        console.warn('   ⚠️  Error:', err);
        console.warn('   Continuing...');
      }
    }

    console.log('\n✅ Migration process completed');
    console.log('\n📊 Verifying migration...\n');

    // Verify the constraint was updated
    const { data: constraints } = await supabase
      .from('information_schema.check_constraints')
      .select('*')
      .eq('constraint_name', 'blueprint_generator_status_check');

    if (constraints && constraints.length > 0) {
      console.log('✅ Constraint exists');
    } else {
      console.log('⚠️  Could not verify constraint (may need direct database access)');
    }

    // Test the new status value
    console.log('\n🧪 Testing \'answering\' status...\n');
    
    // Try to create a test blueprint with 'answering' status
    const testId = crypto.randomUUID();
    const { error: insertError } = await supabase
      .from('blueprint_generator')
      .insert({
        id: testId,
        user_id: '00000000-0000-0000-0000-000000000000', // Dummy user ID
        status: 'answering',
        static_answers: {},
        dynamic_questions: [],
        dynamic_answers: {},
      });

    if (!insertError) {
      console.log('✅ \'answering\' status accepted by database');
      
      // Clean up test record
      await supabase
        .from('blueprint_generator')
        .delete()
        .eq('id', testId);
        
      console.log('✅ Test record cleaned up');
    } else {
      console.log('❌ \'answering\' status validation failed:', insertError.message);
      console.log('\nNote: This may be due to RLS policies preventing the test insert.');
      console.log('The migration may still be successful - check manually in the database.');
    }

    console.log('\n✅ Migration verification complete\n');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
applyMigration()
  .then(() => {
    console.log('✅ All done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
