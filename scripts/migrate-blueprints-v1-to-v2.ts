/**
 * Migration Script: Convert V1 blueprint static_answers to V2 format
 * 
 * This script migrates existing blueprints from V1 (5 simple questions) 
 * to V2 (8 structured questions) format using the database migration function.
 * 
 * Usage:
 *   npx tsx scripts/migrate-blueprints-v1-to-v2.ts [--dry-run]
 * 
 * Options:
 *   --dry-run: Preview changes without applying them
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '../frontend/types/supabase';

// Initialize Supabase client with service role key for admin operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   - NEXT_PUBLIC_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

interface MigrationStats {
  total: number;
  alreadyV2: number;
  migrated: number;
  failed: number;
  errors: Array<{ id: string; error: string }>;
}

async function migrateBlueprints(dryRun: boolean = false): Promise<void> {
  console.log('🚀 Starting blueprint migration from V1 to V2...\n');
  console.log(`Mode: ${dryRun ? 'DRY RUN (no changes will be applied)' : 'LIVE MIGRATION'}\n`);

  const stats: MigrationStats = {
    total: 0,
    alreadyV2: 0,
    migrated: 0,
    failed: 0,
    errors: [],
  };

  try {
    // Fetch all blueprints that need migration
    const { data: blueprints, error: fetchError } = await supabase
      .from('blueprint_generator')
      .select('id, static_answers, questionnaire_version')
      .order('created_at', { ascending: true });

    if (fetchError) {
      console.error('❌ Error fetching blueprints:', fetchError);
      process.exit(1);
    }

    if (!blueprints || blueprints.length === 0) {
      console.log('✅ No blueprints found in database.');
      return;
    }

    stats.total = blueprints.length;
    console.log(`📊 Found ${stats.total} total blueprints\n`);

    // Process each blueprint
    for (const blueprint of blueprints) {
      const staticAnswers = blueprint.static_answers as any;
      const currentVersion = blueprint.questionnaire_version || 1;

      // Check if already V2
      if (currentVersion === 2 || (staticAnswers && staticAnswers.version === 2)) {
        stats.alreadyV2++;
        console.log(`⏭️  Blueprint ${blueprint.id}: Already V2, skipping`);
        continue;
      }

      // Check if V1 format
      const isV1 =
        !staticAnswers ||
        !staticAnswers.version ||
        staticAnswers.version === 1 ||
        (typeof staticAnswers === 'object' &&
          'role' in staticAnswers &&
          'organization' in staticAnswers &&
          typeof staticAnswers.organization === 'string');

      if (!isV1) {
        console.log(`⚠️  Blueprint ${blueprint.id}: Unknown format, skipping`);
        continue;
      }

      console.log(`🔄 Migrating blueprint ${blueprint.id}...`);

      if (dryRun) {
        console.log(`   [DRY RUN] Would migrate V1 → V2`);
        stats.migrated++;
        continue;
      }

      try {
        // Use the database migration function
        const { data: migratedData, error: migrationError } = await supabase.rpc(
          'migrate_static_answers_v1_to_v2',
          { v1_data: staticAnswers }
        );

        if (migrationError) {
          throw migrationError;
        }

        // Update the blueprint with migrated data
        const { error: updateError } = await supabase
          .from('blueprint_generator')
          .update({
            static_answers: migratedData,
            questionnaire_version: 2,
          })
          .eq('id', blueprint.id);

        if (updateError) {
          throw updateError;
        }

        stats.migrated++;
        console.log(`   ✅ Successfully migrated`);
      } catch (error) {
        stats.failed++;
        const errorMessage = error instanceof Error ? error.message : String(error);
        stats.errors.push({ id: blueprint.id, error: errorMessage });
        console.error(`   ❌ Failed: ${errorMessage}`);
      }
    }

    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('📈 MIGRATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total blueprints:        ${stats.total}`);
    console.log(`Already V2:              ${stats.alreadyV2}`);
    console.log(`Successfully migrated:   ${stats.migrated}`);
    console.log(`Failed:                  ${stats.failed}`);

    if (stats.errors.length > 0) {
      console.log('\n❌ ERRORS:');
      stats.errors.forEach(({ id, error }) => {
        console.log(`   - Blueprint ${id}: ${error}`);
      });
    }

    if (dryRun) {
      console.log('\n💡 This was a DRY RUN. No changes were applied.');
      console.log('   Run without --dry-run flag to apply migrations.');
    } else {
      console.log('\n✅ Migration complete!');
    }
  } catch (error) {
    console.error('\n❌ Fatal error during migration:', error);
    process.exit(1);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');

// Run migration
migrateBlueprints(dryRun).catch((error) => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});
