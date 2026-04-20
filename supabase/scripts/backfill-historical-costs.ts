#!/usr/bin/env tsx
/**
 * Backfill Historical Costs Script
 *
 * This script backfills cost estimates for blueprints and dynamic questionnaires
 * that were generated before the cache token cost tracking was implemented.
 *
 * Usage:
 *   npm run backfill:costs -- --dry-run           # Preview without making changes
 *   npm run backfill:costs -- --execute           # Execute backfill
 *   npm run backfill:costs -- --blueprint-id=XXX  # Backfill specific blueprint
 *   npm run backfill:costs -- --help              # Show help
 */

import { createClient } from '@supabase/supabase-js';
import * as readline from 'readline';

interface BackfillResult {
  blueprint_id: string;
  logs_created: number;
  estimated_cost_cents: number;
  status: string;
}

interface EstimateResult {
  blueprint_id: string;
  estimated_cost_cents: number;
  estimated_input_tokens: number;
  estimated_output_tokens: number;
  estimation_method: string;
}

interface BackfillOptions {
  dryRun: boolean;
  blueprintId?: string;
  execute: boolean;
  skipConfirmation: boolean;
}

const parseArgs = (): BackfillOptions => {
  const args = process.argv.slice(2);

  const options: BackfillOptions = {
    dryRun: true,
    execute: false,
    skipConfirmation: false,
  };

  for (const arg of args) {
    if (arg === '--help' || arg === '-h') {
      printHelp();
      process.exit(0);
    } else if (arg === '--dry-run' || arg === '--preview') {
      options.dryRun = true;
      options.execute = false;
    } else if (arg === '--execute' || arg === '--run') {
      options.dryRun = false;
      options.execute = true;
    } else if (arg === '--yes' || arg === '-y') {
      options.skipConfirmation = true;
    } else if (arg.startsWith('--blueprint-id=')) {
      options.blueprintId = arg.split('=')[1];
    }
  }

  return options;
};

const printHelp = () => {
  console.log(\`
Backfill Historical Costs Script

This script estimates and backfills cost data for blueprints generated before
cache token cost tracking was implemented.

USAGE:
  npm run backfill:costs -- [OPTIONS]

OPTIONS:
  --dry-run, --preview     Preview what will be backfilled (default)
  --execute, --run         Execute the backfill (creates actual logs)
  --blueprint-id=<id>      Backfill specific blueprint only
  --yes, -y                Skip confirmation prompt
  --help, -h               Show this help message

EXAMPLES:
  # Preview backfill for all blueprints
  npm run backfill:costs -- --dry-run

  # Execute backfill with confirmation
  npm run backfill:costs -- --execute

  # Execute backfill without confirmation
  npm run backfill:costs -- --execute --yes

  # Backfill specific blueprint
  npm run backfill:costs -- --execute --blueprint-id=abc-123

NOTES:
  - Estimated logs are marked with metadata indicating they are estimates
  - Cost estimates are based on content length (1 token ≈ 4 characters)
  - Cache tokens are set to 0 for historical data (not available)
  - Creates 2 logs per blueprint: dynamic questions + blueprint generation
\`);
};

const confirmExecution = async (): Promise<boolean> => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(
      '\n⚠️  This will create estimated cost logs in the database. Continue? (yes/no): ',
      (answer) => {
        rl.close();
        resolve(answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y');
      }
    );
  });
};

const formatCost = (cents: number): string => {
  return \`$\${(cents / 100).toFixed(2)}\`;
};

const main = async () => {
  console.log('🔄 Historical Cost Backfill Script\n');

  const options = parseArgs();

  // Initialize Supabase client
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Error: Missing Supabase credentials');
    console.error('   Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('📊 Mode:', options.dryRun ? 'DRY RUN (preview only)' : 'EXECUTE (will modify database)');

  if (options.blueprintId) {
    console.log('🎯 Target: Specific blueprint', options.blueprintId);
  } else {
    console.log('🎯 Target: All blueprints without cost logs');
  }

  console.log('');

  // Step 1: Get estimates
  console.log('1️⃣  Fetching cost estimates...');

  const { data: estimates, error: estimateError} = await supabase.rpc('estimate_blueprint_costs');

  if (estimateError) {
    console.error('❌ Error fetching estimates:', estimateError.message);
    process.exit(1);
  }

  const estimatesData = estimates as EstimateResult[];

  if (!estimatesData || estimatesData.length === 0) {
    console.log('✅ No blueprints found that need backfilling!');
    console.log('   All blueprints already have cost logs.');
    process.exit(0);
  }

  // Filter by blueprint ID if specified
  const filteredEstimates = options.blueprintId
    ? estimatesData.filter((e) => e.blueprint_id === options.blueprintId)
    : estimatesData;

  if (filteredEstimates.length === 0) {
    console.log(\`❌ No blueprints found matching ID: \${options.blueprintId}\`);
    process.exit(1);
  }

  console.log(\`✅ Found \${filteredEstimates.length} blueprint(s) to process\n\`);

  // Show summary
  console.log('📈 Cost Summary:');
  console.log('─'.repeat(80));

  const totalCostCents = filteredEstimates.reduce((sum, e) => sum + e.estimated_cost_cents, 0);
  const totalInputTokens = filteredEstimates.reduce((sum, e) => sum + e.estimated_input_tokens, 0);
  const totalOutputTokens = filteredEstimates.reduce(
    (sum, e) => sum + e.estimated_output_tokens,
    0
  );

  console.log(\`Total Blueprints:    \${filteredEstimates.length}\`);
  console.log(\`Total Estimated Cost: \${formatCost(totalCostCents)}\`);
  console.log(\`Total Input Tokens:   \${totalInputTokens.toLocaleString()}\`);
  console.log(\`Total Output Tokens:  \${totalOutputTokens.toLocaleString()}\`);
  console.log(\`Avg Cost/Blueprint:   \${formatCost(totalCostCents / filteredEstimates.length)}\`);
  console.log('─'.repeat(80));
  console.log('');

  // Show breakdown if <= 10 blueprints
  if (filteredEstimates.length <= 10) {
    console.log('📋 Detailed Breakdown:');
    console.log('─'.repeat(80));
    for (const estimate of filteredEstimates) {
      console.log(
        \`Blueprint: \${estimate.blueprint_id.substring(0, 8)}... | \` +
          \`Cost: \${formatCost(estimate.estimated_cost_cents)} | \` +
          \`Tokens: \${estimate.estimated_input_tokens + estimate.estimated_output_tokens}\`
      );
    }
    console.log('─'.repeat(80));
    console.log('');
  }

  // Step 2: Execute or dry run
  if (options.execute && !options.dryRun) {
    console.log('⚠️  EXECUTE MODE - This will create actual cost logs in the database');

    if (!options.skipConfirmation) {
      const confirmed = await confirmExecution();
      if (!confirmed) {
        console.log('❌ Backfill cancelled by user');
        process.exit(0);
      }
    }

    console.log('\n2️⃣  Executing backfill...');
  } else {
    console.log('2️⃣  Running dry-run (no changes will be made)...');
  }

  // Execute backfill
  const { data: results, error: backfillError } = await supabase.rpc('backfill_blueprint_costs', {
    p_dry_run: options.dryRun,
    p_blueprint_id: options.blueprintId || null,
  });

  if (backfillError) {
    console.error('❌ Error during backfill:', backfillError.message);
    process.exit(1);
  }

  const resultsData = results as BackfillResult[];

  console.log(\`✅ Processed \${resultsData.length} blueprint(s)\n\`);

  // Show results
  if (options.execute && !options.dryRun) {
    const totalLogsCreated = resultsData.reduce((sum, r) => sum + r.logs_created, 0);

    console.log('✅ BACKFILL COMPLETE!');
    console.log('─'.repeat(80));
    console.log(\`Blueprints Processed: \${resultsData.length}\`);
    console.log(\`Cost Logs Created:    \${totalLogsCreated}\`);
    console.log(\`Total Estimated Cost: \${formatCost(totalCostCents)}\`);
    console.log('─'.repeat(80));
    console.log('');
    console.log('💡 Notes:');
    console.log('   - Estimated logs are marked with {"is_backfilled": true}');
    console.log('   - Cache tokens are set to 0 (not available for historical data)');
    console.log('   - Costs are estimates based on content length');
    console.log('');
    console.log('🔍 To verify, check the admin dashboard at:');
    console.log('   https://polaris.smartslate.io/admin/costs');
  } else {
    console.log('✅ DRY RUN COMPLETE - No changes made');
    console.log('─'.repeat(80));
    console.log('To execute the backfill, run:');
    console.log('  npm run backfill:costs -- --execute');
    console.log('─'.repeat(80));
  }

  process.exit(0);
};

// Run the script
main().catch((error) => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});
