#!/usr/bin/env node
/**
 * Fix User Usage Counters - One-Click Script
 *
 * This script diagnoses and fixes incorrect usage counts in the admin users page.
 * It calls the /api/admin/users/fix-counters endpoint to reset all counters.
 *
 * Usage:
 *   node scripts/fix-user-counters.js [--dry-run]
 *
 * Options:
 *   --dry-run    Only diagnose, don't fix (default: false)
 *   --help       Show this help message
 */

const https = require('https');
const http = require('http');

// Parse command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const showHelp = args.includes('--help') || args.includes('-h');

if (showHelp) {
  console.log(`
Fix User Usage Counters - One-Click Script

This script diagnoses and fixes incorrect usage counts in the admin users page.
It resets all user counters to match actual blueprint data.

Usage:
  node scripts/fix-user-counters.js [options]

Options:
  --dry-run    Only diagnose, don't fix (default: false)
  --help       Show this help message

Examples:
  node scripts/fix-user-counters.js --dry-run    # Diagnose only
  node scripts/fix-user-counters.js              # Fix all counters

Environment Variables:
  APP_URL      Base URL of your app (default: http://localhost:3000)
  `);
  process.exit(0);
}

// Get base URL from environment or use default
const baseUrl = process.env.APP_URL || 'http://localhost:3000';
const apiUrl = `${baseUrl}/api/admin/users/fix-counters`;

console.log('┌─────────────────────────────────────────────┐');
console.log('│  Fix User Usage Counters - One-Click Fix  │');
console.log('└─────────────────────────────────────────────┘\n');

console.log(`📍 API URL: ${apiUrl}`);
console.log(`🔧 Mode: ${isDryRun ? 'DRY RUN (diagnosis only)' : 'FIX (will update database)'}\n`);

// Make HTTP request
function makeRequest(url, method, body) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const protocol = urlObj.protocol === 'https:' ? https : http;

    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = protocol.request(urlObj, options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          reject(new Error(`Failed to parse response: ${e.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

// Main execution
async function main() {
  try {
    console.log('⏳ Running diagnosis...\n');

    // Call the API
    const response = await makeRequest(apiUrl, 'POST', {
      action: isDryRun ? 'diagnose' : 'fix',
      dryRun: isDryRun,
    });

    if (response.status !== 200) {
      console.error('❌ Error:', response.data.error || 'Unknown error');
      console.error('Details:', response.data.details || 'No details available');
      process.exit(1);
    }

    const { summary, mismatches, message } = response.data;

    // Display summary
    console.log('📊 SUMMARY');
    console.log('─────────────────────────────────────────────');
    console.log(`  Total Users:            ${summary.totalUsers}`);
    console.log(`  Users with Mismatches:  ${summary.usersWithMismatches}`);
    console.log(`  Creation Mismatches:    ${summary.creationMismatches}`);
    console.log(`  Saving Mismatches:      ${summary.savingMismatches}`);
    console.log(`  Total Creation Delta:   ${summary.totalCreationDelta > 0 ? '+' : ''}${summary.totalCreationDelta}`);
    console.log(`  Total Saving Delta:     ${summary.totalSavingDelta > 0 ? '+' : ''}${summary.totalSavingDelta}`);

    if (!isDryRun && summary.updatedCount > 0) {
      console.log(`  ✅ Updated Count:        ${summary.updatedCount}`);
    }

    console.log('─────────────────────────────────────────────\n');

    // Display mismatches (top 10)
    if (mismatches && mismatches.length > 0) {
      console.log('🔍 TOP MISMATCHES (sample)');
      console.log('─────────────────────────────────────────────');

      const displayCount = Math.min(10, mismatches.length);
      for (let i = 0; i < displayCount; i++) {
        const m = mismatches[i];
        console.log(`\n  User ${i + 1}: ${m.user_id.substring(0, 8)}...`);
        console.log(`    Tier: ${m.subscription_tier}`);
        console.log(`    Creation: ${m.current_creation_count} → ${m.correct_creation_count} (Δ ${m.creation_delta})`);
        console.log(`    Saving:   ${m.current_saving_count} → ${m.correct_saving_count} (Δ ${m.saving_delta})`);
      }

      if (mismatches.length > displayCount) {
        console.log(`\n  ... and ${mismatches.length - displayCount} more users`);
      }

      console.log('\n─────────────────────────────────────────────\n');
    }

    // Display message and next steps
    console.log('💬 MESSAGE');
    console.log('─────────────────────────────────────────────');
    console.log(`  ${message}`);
    console.log('─────────────────────────────────────────────\n');

    if (isDryRun && summary.usersWithMismatches > 0) {
      console.log('🔧 NEXT STEPS');
      console.log('─────────────────────────────────────────────');
      console.log('  To fix these counters, run:');
      console.log('    node scripts/fix-user-counters.js');
      console.log('─────────────────────────────────────────────\n');
    } else if (!isDryRun && summary.updatedCount > 0) {
      console.log('✅ SUCCESS');
      console.log('─────────────────────────────────────────────');
      console.log(`  Updated ${summary.updatedCount} users successfully!`);
      console.log('  The admin users page should now show correct counts.');
      console.log('─────────────────────────────────────────────\n');
    } else if (summary.usersWithMismatches === 0) {
      console.log('✅ ALL GOOD');
      console.log('─────────────────────────────────────────────');
      console.log('  All user counters are already accurate!');
      console.log('  No action needed.');
      console.log('─────────────────────────────────────────────\n');
    }

    process.exit(0);
  } catch (error) {
    console.error('\n❌ FATAL ERROR');
    console.error('─────────────────────────────────────────────');
    console.error(`  ${error.message}`);

    if (error.code === 'ECONNREFUSED') {
      console.error('\n  💡 TIP: Make sure your dev server is running');
      console.error('     Run: npm run dev');
    }

    console.error('─────────────────────────────────────────────\n');
    process.exit(1);
  }
}

main();
