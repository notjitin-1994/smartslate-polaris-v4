#!/usr/bin/env tsx

/**
 * Script to clean up duplicate blueprint generations
 * This script finds blueprints with multiple generations and keeps only the latest completed one
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables:');
  console.error('- NEXT_PUBLIC_SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface BlueprintVersion {
  id: string;
  user_id: string;
  version: number;
  status: string;
  created_at: string;
}

/**
* Find blueprints that have multiple generations per user.
* @example
* findDuplicates()
* // Promise resolves to:
* // {
* //   "user_123": [
* //     { id: "1", user_id: "user_123", version: "v2", status: "completed", created_at: "2025-01-02T12:34:56Z" },
* //     { id: "2", user_id: "user_123", version: "v1", status: "completed", created_at: "2024-12-01T11:22:33Z" }
* //   ],
* //   "user_456": [
* //     { id: "3", user_id: "user_456", version: "v3", status: "failed", created_at: "2025-02-03T09:08:07Z" },
* //     { id: "4", user_id: "user_456", version: "v2", status: "completed", created_at: "2025-01-15T10:00:00Z" }
* //   ]
* // }
* @returns {Promise<{ [userId: string]: BlueprintVersion[] }>} Promise resolving to a mapping of user IDs to arrays of blueprint versions where the user has more than one generation.
*/
async function findDuplicates(): Promise<{ [userId: string]: BlueprintVersion[] }> {
  console.log('🔍 Finding blueprints with multiple generations...');

  const { data: blueprints, error } = await supabase
    .from('blueprint_generator')
    .select('id, user_id, version, status, created_at')
    .order('user_id')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Error fetching blueprints:', error);
    throw error;
  }

  // Group by user_id to find duplicates
  const duplicates: { [userId: string]: BlueprintVersion[] } = {};

  blueprints?.forEach((blueprint) => {
    if (!duplicates[blueprint.user_id]) {
      duplicates[blueprint.user_id] = [];
    }
    duplicates[blueprint.user_id].push(blueprint);
  });

  // Filter to only include users with multiple generations
  const usersWithDuplicates: { [userId: string]: BlueprintVersion[] } = {};
  Object.entries(duplicates).forEach(([userId, versions]) => {
    if (versions.length > 1) {
      usersWithDuplicates[userId] = versions;
    }
  });

  return usersWithDuplicates;
}

/**
* Clean up duplicate blueprint versions for a user by keeping the latest completed version and deleting the rest.
* @example
* cleanupUserDuplicates('user_123', [{ id: 'v1', version: '1.0', status: 'completed', created_at: '2025-01-02' }, { id: 'v2', version: '0.9', status: 'completed', created_at: '2024-12-31' }])
* 1
* @param {string} userId - The ID of the user whose blueprint generations will be deduplicated.
* @param {BlueprintVersion[]} versions - Array of blueprint versions (expected sorted by created_at desc) to evaluate and delete duplicates from.
* @returns {Promise<number>} Number of duplicate versions deleted.
**/
async function cleanupUserDuplicates(
  userId: string,
  versions: BlueprintVersion[]
): Promise<number> {
  console.log(`\n👤 User ${userId}: Found ${versions.length} generations`);

  // Find the latest completed version
  const completedVersions = versions.filter((v) => v.status === 'completed');
  if (completedVersions.length === 0) {
    console.log(`   ⚠️  No completed versions found, skipping cleanup`);
    return 0;
  }

  const latestCompleted = completedVersions[0]; // Already sorted by created_at desc
  console.log(`   ✅ Keeping version ${latestCompleted.version} (${latestCompleted.status})`);

  // Delete all other versions
  const versionsToDelete = versions.filter((v) => v.id !== latestCompleted.id).map((v) => v.id);

  if (versionsToDelete.length === 0) {
    console.log(`   ℹ️  No duplicates to remove`);
    return 0;
  }

  console.log(`   🗑️  Deleting ${versionsToDelete.length} duplicate(s)...`);

  const { error } = await supabase.from('blueprint_generator').delete().in('id', versionsToDelete);

  if (error) {
    console.error(`   ❌ Error deleting duplicates:`, error);
    throw error;
  }

  console.log(`   ✅ Successfully removed ${versionsToDelete.length} duplicate(s)`);
  return versionsToDelete.length;
}

/**
* Run the duplicate cleanup process for blueprint generations, finding and removing duplicate generations per user.
* @example
* await main()
* undefined
* @returns {Promise<void>} Resolves when the cleanup completes successfully; rejects on error.
*/
async function main() {
  try {
    console.log('🚀 Starting duplicate cleanup process...\n');

    const duplicates = await findDuplicates();
    const userIds = Object.keys(duplicates);

    if (userIds.length === 0) {
      console.log('✅ No duplicates found! All blueprints have only one generation.');
      return;
    }

    console.log(`📊 Found ${userIds.length} user(s) with duplicate generations\n`);

    let totalRemoved = 0;
    for (const userId of userIds) {
      const removed = await cleanupUserDuplicates(userId, duplicates[userId]);
      totalRemoved += removed;
    }

    console.log(`\n🎉 Cleanup complete!`);
    console.log(`📈 Total duplicates removed: ${totalRemoved}`);
    console.log(`👥 Users affected: ${userIds.length}`);
  } catch (error) {
    console.error('💥 Cleanup failed:', error);
    process.exit(1);
  }
}

// Run the script
main();
