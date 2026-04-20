#!/usr/bin/env tsx

import * as fs from 'fs';
import * as path from 'path';

/**
 * Simple migration script that doesn't rely on complex date parsing
 */
async function migrateRemainingFiles(): Promise<void> {
  console.log('🔄 Migrating remaining markdown files...');

  // Find all markdown files in root that aren't already in docs/
  const allFiles = fs.readdirSync('.');
  const markdownFiles = allFiles.filter(f => f.endsWith('.md'));

  console.log(`Found ${markdownFiles.length} markdown files in root`);

  for (const file of markdownFiles) {
    if (file.startsWith('.')) continue; // Skip hidden files

    try {
      const content = fs.readFileSync(file, 'utf-8');

      // Simple categorization based on filename
      let category = 'archived';
      const lowerName = file.toLowerCase();

      if (lowerName.includes('prd') || lowerName.includes('product-requirements')) {
        category = 'prd';
      } else if (lowerName.includes('implementation') || lowerName.includes('complete') || lowerName.includes('summary')) {
        category = 'implementation';
      } else if (lowerName.includes('guide') || lowerName.includes('testing') || lowerName.includes('setup')) {
        category = 'guide';
      }

      // Determine target directory
      let targetDir = `docs/${category}s`;
      if (category === 'implementation') {
        targetDir = 'docs/implementation-notes';
      }

      // Ensure target directory exists
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      const targetPath = `${targetDir}/${file}`;

      // Create simple metadata header
      const metadata = `---
title: "${file.replace(/\.md$/, '').replace(/[_-]/g, ' ')}"
type: "${category}"
status: "active"
lastUpdated: "${new Date().toISOString()}"
author: "System"
tags: []
---

`;

      // Write file with metadata
      fs.writeFileSync(targetPath, metadata + content);

      // Remove original
      fs.unlinkSync(file);

      console.log(`✓ Migrated: ${file} → ${targetPath}`);

    } catch (error) {
      console.error(`✗ Failed to migrate ${file}:`, error);
    }
  }

  console.log('✅ Migration completed');
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateRemainingFiles().catch(console.error);
}
