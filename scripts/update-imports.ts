#!/usr/bin/env tsx

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

interface ImportMapping {
  oldPath: string;
  newPath: string;
}

const importMappings: ImportMapping[] = [
  // Components mappings
  { oldPath: '@/components/ui/', newPath: '@/src/components/ui/' },
  { oldPath: '@/components/auth/', newPath: '@/src/components/features/auth/' },
  { oldPath: '@/components/blueprint/', newPath: '@/src/components/features/blueprint/' },
  { oldPath: '@/components/dashboard/', newPath: '@/src/components/features/dashboard/' },
  { oldPath: '@/components/dynamic-form/', newPath: '@/src/components/features/dynamic-form/' },
  { oldPath: '@/components/wizard/', newPath: '@/src/components/features/wizard/' },
  { oldPath: '@/components/conflict/', newPath: '@/src/components/features/conflict/' },
  { oldPath: '@/components/export/', newPath: '@/src/components/features/export/' },
  { oldPath: '@/components/logs/', newPath: '@/src/components/features/logs/' },
  { oldPath: '@/components/resume/', newPath: '@/src/components/features/resume/' },
  { oldPath: '@/components/theme/', newPath: '@/src/components/features/theme/' },
  { oldPath: '@/components/undo-redo/', newPath: '@/src/components/features/undo-redo/' },
  { oldPath: '@/components/error/', newPath: '@/src/components/features/error/' },
  { oldPath: '@/components/debug/', newPath: '@/src/components/features/debug/' },
  { oldPath: '@/components/layout/', newPath: '@/src/components/layouts/' },
  { oldPath: '@/components/', newPath: '@/src/components/' },

  // Lib mappings
  { oldPath: '@/lib/auth/', newPath: '@/src/lib/auth/' },
  { oldPath: '@/lib/db/', newPath: '@/src/lib/db/' },
  { oldPath: '@/lib/hooks/', newPath: '@/src/lib/hooks/' },
  { oldPath: '@/lib/services/', newPath: '@/src/lib/services/' },
  { oldPath: '@/lib/stores/', newPath: '@/src/lib/stores/' },
  { oldPath: '@/lib/claude/', newPath: '@/src/lib/claude/' },
  { oldPath: '@/lib/dashboard/', newPath: '@/src/lib/dashboard/' },
  { oldPath: '@/lib/dynamic-form/', newPath: '@/src/lib/dynamic-form/' },
  { oldPath: '@/lib/export/', newPath: '@/src/lib/export/' },
  { oldPath: '@/lib/fallbacks/', newPath: '@/src/lib/fallbacks/' },
  { oldPath: '@/lib/logging/', newPath: '@/src/lib/logging/' },
  { oldPath: '@/lib/ollama/', newPath: '@/src/lib/ollama/' },
  { oldPath: '@/lib/prompts/', newPath: '@/src/lib/prompts/' },
  { oldPath: '@/lib/queue/', newPath: '@/src/lib/queue/' },
  { oldPath: '@/lib/supabase/', newPath: '@/src/lib/supabase/' },
  { oldPath: '@/lib/cache/', newPath: '@/src/lib/cache/' },

  // Other mappings
  { oldPath: '@/contexts/', newPath: '@/src/lib/' },
  { oldPath: '@/hooks/', newPath: '@/src/lib/hooks/' },
  { oldPath: '@/store/', newPath: '@/src/lib/stores/' },
  { oldPath: '@/types/', newPath: '@/src/types/' },

  // Test mappings
  { oldPath: '@/__tests__/', newPath: '@/tests/' },
];

/**
 * Escape special regex characters to prevent ReDoS
 */
function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Updates import paths in a file content
 */
function updateImportsInFile(content: string, mappings: ImportMapping[]): string {
  let updatedContent = content;

  for (const mapping of mappings) {
    // Escape oldPath to prevent ReDoS attacks
    const escapedOldPath = escapeRegExp(mapping.oldPath);

    // Handle different import patterns
    const patterns = [
      // import from '@/path/'
      new RegExp(`from ['"]@${escapedOldPath}(?!/)['"]`, 'g'),
      // import from '@/path/file'
      new RegExp(`from ['"]@${escapedOldPath}([^'"]*)['"]`, 'g'),
      // import '@/path/'
      new RegExp(`import ['"]@${escapedOldPath}(?!/)['"]`, 'g'),
      // import '@/path/file'
      new RegExp(`import ['"]@${escapedOldPath}([^'"]*)['"]`, 'g'),
    ];

    for (const pattern of patterns) {
      updatedContent = updatedContent.replace(pattern, (match, filePart) => {
        return match.replace(mapping.oldPath, mapping.newPath);
      });
    }
  }

  return updatedContent;
}

/**
 * Processes a single file to update imports
 */
async function processFile(filePath: string): Promise<boolean> {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const originalContent = content;

    const updatedContent = updateImportsInFile(content, importMappings);

    if (updatedContent !== originalContent) {
      fs.writeFileSync(filePath, updatedContent);
      console.log(`✓ Updated imports in: ${filePath}`);
      return true;
    }

    return false;
  } catch (error) {
    console.error(`✗ Failed to process ${filePath}:`, error);
    return false;
  }
}

/**
 * Main function to update imports across the codebase
 */
async function updateAllImports(): Promise<void> {
  console.log('🔄 Starting import path updates...');

  const frontendDir = path.join(process.cwd(), 'frontend');

  // Find all TypeScript and JavaScript files
  const files = await glob('**/*.{ts,tsx,js,jsx}', {
    cwd: frontendDir,
    ignore: ['node_modules/**', '.next/**', 'dist/**']
  });

  console.log(`Found ${files.length} files to process`);

  let updatedCount = 0;

  for (const file of files) {
    const fullPath = path.join(frontendDir, file);
    const wasUpdated = await processFile(fullPath);
    if (wasUpdated) {
      updatedCount++;
    }
  }

  console.log(`\n✅ Updated imports in ${updatedCount} files`);
  console.log('\nNext steps:');
  console.log('1. Run TypeScript compiler to check for errors');
  console.log('2. Run ESLint to check for issues');
  console.log('3. Test the application functionality');
}

/**
 * Validates that imports are working correctly
 */
async function validateImports(): Promise<void> {
  console.log('🔍 Validating import paths...');

  const frontendDir = path.join(process.cwd(), 'frontend');

  try {
    // Try to run TypeScript compiler
    const { execSync } = await import('child_process');
    execSync('cd frontend && npm run typecheck', { stdio: 'inherit' });
    console.log('✅ TypeScript compilation successful');
  } catch (error) {
    console.error('❌ TypeScript compilation failed');
    throw error;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const command = process.argv[2];

  if (command === 'validate') {
    validateImports().catch(console.error);
  } else {
    updateAllImports().catch(console.error);
  }
}

export { updateImportsInFile, processFile, updateAllImports, validateImports };
