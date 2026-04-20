import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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

async function verifyMigration() {
  console.log('🔍 Verifying Blueprint Migration');
  console.log('━'.repeat(60));

  try {
    // Get user IDs
    const { data: allUsers } = await supabase.auth.admin.listUsers();
    const sourceUser = allUsers?.users.find((u) => u.email === SOURCE_EMAIL);
    const targetUser = allUsers?.users.find((u) => u.email === TARGET_EMAIL);

    if (!sourceUser || !targetUser) {
      throw new Error('Users not found');
    }

    // Get blueprints for source user
    const { data: sourceBlueprints, count: sourceCount } = await supabase
      .from('blueprint_generator')
      .select('id, title, status, created_at', { count: 'exact' })
      .eq('user_id', sourceUser.id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    // Get blueprints for target user
    const { data: targetBlueprints, count: targetCount } = await supabase
      .from('blueprint_generator')
      .select('id, title, status, created_at', { count: 'exact' })
      .eq('user_id', targetUser.id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    // Get user profile counters
    const { data: sourceProfile } = await supabase
      .from('user_profiles')
      .select('blueprint_creation_count, blueprint_saving_count, user_role, subscription_tier')
      .eq('user_id', sourceUser.id)
      .single();

    const { data: targetProfile } = await supabase
      .from('user_profiles')
      .select('blueprint_creation_count, blueprint_saving_count, user_role, subscription_tier')
      .eq('user_id', targetUser.id)
      .single();

    console.log('\n📊 SOURCE USER:', SOURCE_EMAIL);
    console.log('━'.repeat(60));
    console.log('User ID:', sourceUser.id);
    console.log('Role:', sourceProfile?.user_role);
    console.log('Tier:', sourceProfile?.subscription_tier);
    console.log('Actual Blueprints:', sourceCount || 0);
    console.log('Creation Counter:', sourceProfile?.blueprint_creation_count || 0);
    console.log('Saving Counter:', sourceProfile?.blueprint_saving_count || 0);

    if (sourceBlueprints && sourceBlueprints.length > 0) {
      console.log('\nBlueprints:');
      sourceBlueprints.forEach((bp, idx) => {
        console.log(`  ${idx + 1}. ${bp.title} (${bp.status})`);
      });
    } else {
      console.log('\n✓ No blueprints remaining (as expected)');
    }

    console.log('\n📊 TARGET USER:', TARGET_EMAIL);
    console.log('━'.repeat(60));
    console.log('User ID:', targetUser.id);
    console.log('Role:', targetProfile?.user_role);
    console.log('Tier:', targetProfile?.subscription_tier);
    console.log('Actual Blueprints:', targetCount || 0);
    console.log('Creation Counter:', targetProfile?.blueprint_creation_count || 0);
    console.log('Saving Counter:', targetProfile?.blueprint_saving_count || 0);

    if (targetBlueprints && targetBlueprints.length > 0) {
      console.log('\nBlueprints:');
      targetBlueprints.forEach((bp, idx) => {
        console.log(
          `  ${idx + 1}. ${bp.title} (${bp.status}) - ${new Date(bp.created_at).toLocaleDateString()}`
        );
      });
    }

    console.log('\n✅ VERIFICATION SUMMARY');
    console.log('━'.repeat(60));

    const sourceOk = (sourceCount || 0) === 0;
    const targetOk = (targetCount || 0) > 0;
    const sourceCountersOk =
      sourceProfile?.blueprint_creation_count === 0 && sourceProfile?.blueprint_saving_count === 0;
    const targetCountersOk =
      targetProfile?.blueprint_creation_count === targetCount &&
      targetProfile?.blueprint_saving_count === targetCount;

    console.log(`Source user has 0 blueprints: ${sourceOk ? '✓' : '✗'}`);
    console.log(`Target user has blueprints: ${targetOk ? '✓' : '✗'}`);
    console.log(`Source counters reset: ${sourceCountersOk ? '✓' : '✗'}`);
    console.log(`Target counters updated: ${targetCountersOk ? '✓' : '✗'}`);

    if (sourceOk && targetOk && sourceCountersOk && targetCountersOk) {
      console.log('\n🎉 Migration verified successfully!');
    } else {
      console.log('\n⚠️  Some issues detected. Please review above.');
    }
  } catch (error) {
    console.error('\n❌ Verification failed:', error);
    throw error;
  }
}

verifyMigration()
  .then(() => {
    console.log('\n✅ Verification complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Verification failed:', error);
    process.exit(1);
  });
