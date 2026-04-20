import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../frontend/.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const SOURCE_EMAIL = 'not.jitin@gmail.com';
const TARGET_EMAIL = 'jitin@smartslate.io';

async function runMigration() {
  console.log('🚀 Starting Blueprint Migration');
  console.log('━'.repeat(60));

  try {
    // STEP 1: Find User IDs
    console.log('\n📍 STEP 1: Finding user IDs...');
    const { data: allUsers } = await supabase.auth.admin.listUsers();

    const sourceUser = allUsers?.users.find((u) => u.email === SOURCE_EMAIL);
    const targetUser = allUsers?.users.find((u) => u.email === TARGET_EMAIL);

    if (!sourceUser) {
      throw new Error(`Source user not found: ${SOURCE_EMAIL}`);
    }
    if (!targetUser) {
      throw new Error(`Target user not found: ${TARGET_EMAIL}`);
    }

    console.log(`✓ Source User: ${SOURCE_EMAIL}`);
    console.log(`  ID: ${sourceUser.id}`);
    console.log(`✓ Target User: ${TARGET_EMAIL}`);
    console.log(`  ID: ${targetUser.id}`);

    // STEP 2: Count blueprints
    console.log('\n📊 STEP 2: Counting blueprints to migrate...');
    const { count: blueprintCount, error: countError } = await supabase
      .from('blueprint_generator')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', sourceUser.id)
      .is('deleted_at', null);

    if (countError) throw countError;

    console.log(`✓ Blueprints to migrate: ${blueprintCount || 0}`);

    if (!blueprintCount || blueprintCount === 0) {
      console.log('\n⚠️  No blueprints to migrate. Exiting.');
      return;
    }

    // STEP 3: Preview blueprints
    console.log('\n👀 STEP 3: Previewing blueprints...');
    const { data: blueprints, error: previewError } = await supabase
      .from('blueprint_generator')
      .select('id, title, status, created_at')
      .eq('user_id', sourceUser.id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(10);

    if (previewError) throw previewError;

    console.log(`✓ Found ${blueprints?.length || 0} blueprints (showing up to 10):`);
    blueprints?.forEach((bp, idx) => {
      console.log(
        `  ${idx + 1}. ${bp.title || 'Untitled'} (${bp.status}) - ${new Date(bp.created_at).toLocaleDateString()}`
      );
    });

    // STEP 4: Execute migration
    console.log('\n🔄 STEP 4: Executing migration...');
    console.log('⚠️  This will transfer all blueprints to the target user.');

    const { error: migrationError, count } = await supabase
      .from('blueprint_generator')
      .update({
        user_id: targetUser.id,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', sourceUser.id)
      .is('deleted_at', null)
      .select('id', { count: 'exact' });

    if (migrationError) throw migrationError;

    console.log(`✓ Successfully migrated ${count || 0} blueprints`);

    // STEP 5: Update target user counters
    console.log('\n🔢 STEP 5: Updating target user counters...');

    const { count: targetCreationCount } = await supabase
      .from('blueprint_generator')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', targetUser.id)
      .is('deleted_at', null);

    const { count: targetSavingCount } = await supabase
      .from('blueprint_generator')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', targetUser.id)
      .eq('status', 'completed')
      .is('deleted_at', null);

    const { error: updateTargetError } = await supabase
      .from('user_profiles')
      .update({
        blueprint_creation_count: targetCreationCount || 0,
        blueprint_saving_count: targetSavingCount || 0,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', targetUser.id);

    if (updateTargetError) throw updateTargetError;

    console.log(`✓ Target user counters updated:`);
    console.log(`  Creation count: ${targetCreationCount || 0}`);
    console.log(`  Saving count: ${targetSavingCount || 0}`);

    // STEP 6: Reset source user counters
    console.log('\n🔄 STEP 6: Resetting source user counters...');

    const { error: resetSourceError } = await supabase
      .from('user_profiles')
      .update({
        blueprint_creation_count: 0,
        blueprint_saving_count: 0,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', sourceUser.id);

    if (resetSourceError) throw resetSourceError;

    console.log(`✓ Source user counters reset to 0`);

    // STEP 7: Verification
    console.log('\n✅ STEP 7: Verifying migration...');

    const { count: sourceRemaining } = await supabase
      .from('blueprint_generator')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', sourceUser.id)
      .is('deleted_at', null);

    const { count: targetTotal } = await supabase
      .from('blueprint_generator')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', targetUser.id)
      .is('deleted_at', null);

    console.log('\nVerification Results:');
    console.log(`  Source user (${SOURCE_EMAIL}):`);
    console.log(`    Remaining blueprints: ${sourceRemaining || 0} ✓`);
    console.log(`  Target user (${TARGET_EMAIL}):`);
    console.log(`    Total blueprints: ${targetTotal || 0} ✓`);

    if (sourceRemaining === 0 && (targetTotal || 0) >= (blueprintCount || 0)) {
      console.log('\n🎉 Migration completed successfully!');
      console.log('━'.repeat(60));
    } else {
      console.warn('\n⚠️  Migration may have issues. Please verify manually.');
    }
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    throw error;
  }
}

// Run the migration
runMigration()
  .then(() => {
    console.log('\n✅ Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
