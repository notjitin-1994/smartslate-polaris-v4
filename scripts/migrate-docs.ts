#!/usr/bin/env tsx

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

interface DocMetadata {
  title: string;
  type: 'prd' | 'implementation' | 'guide' | 'architecture' | 'archived';
  status: 'active' | 'draft' | 'superseded' | 'archived';
  created: Date;
  lastUpdated: Date;
  author: string;
  tags: string[];
}

interface MigrationResult {
  file: string;
  originalPath: string;
  newPath: string;
  category: DocMetadata['type'];
  metadata: DocMetadata;
}

/**
 * Categorizes a document based on filename and content analysis
 */
function categorizeDocument(filename: string, content: string): DocMetadata['type'] {
  const lowerName = filename.toLowerCase();
  const lowerContent = content.toLowerCase();

  // PRD patterns
  if (lowerName.includes('prd') ||
      lowerName.includes('product-requirements') ||
      lowerContent.includes('product requirements') ||
      lowerName.includes('requirements-document')) {
    return 'prd';
  }

  // Implementation patterns
  if (lowerName.includes('implementation') ||
      lowerName.includes('bugfix') ||
      lowerName.includes('bug-fix') ||
      lowerName.includes('fix') ||
      lowerName.includes('complete') ||
      lowerName.includes('summary') ||
      lowerContent.includes('implementation complete') ||
      lowerContent.includes('completed implementation')) {
    return 'implementation';
  }

  // Architecture patterns
  if (lowerName.includes('architecture') ||
      lowerName.includes('system-design') ||
      lowerName.includes('design-system') ||
      lowerContent.includes('system architecture') ||
      lowerContent.includes('technical design')) {
    return 'architecture';
  }

  // Guide patterns
  if (lowerName.includes('guide') ||
      lowerName.includes('setup') ||
      lowerName.includes('tutorial') ||
      lowerName.includes('installation') ||
      lowerName.includes('quick-start') ||
      lowerName.includes('testing-guide') ||
      lowerName.includes('developer-guide')) {
    return 'guide';
  }

  // Default to archived for files that don't match other categories
  return 'archived';
}

/**
 * Extracts metadata from document content
 */
function extractMetadata(filename: string, content: string): Partial<DocMetadata> {
  const metadata: Partial<DocMetadata> = {
    title: filename.replace(/\.md$/, '').replace(/[_-]/g, ' '),
    type: categorizeDocument(filename, content),
    status: 'active',
    lastUpdated: new Date(),
    author: 'System',
    tags: []
  };

  // Try to extract creation date from content
  const datePatterns = [
    /(\d{4}-\d{2}-\d{2})/g,
    /(\d{1,2}\/\d{1,2}\/\d{4})/g,
    /Date:\s*(\d{4}-\d{2}-\d{2})/gi,
    /Created:\s*(\d{4}-\d{2}-\d{2})/gi
  ];

  for (const pattern of datePatterns) {
    const matches = content.match(pattern);
    if (matches && matches[1]) {
      const dateStr = matches[1];
      try {
        metadata.created = new Date(dateStr);
        break;
      } catch (e) {
        // Continue trying other patterns
      }
    }
  }

  // If no creation date found, use last updated date
  if (!metadata.created) {
    metadata.created = metadata.lastUpdated;
  }

  // Extract tags from content
  const tagPatterns = [
    /Tags?:\s*([^\n\r]+)/gi,
    /#\w+/g
  ];

  for (const pattern of tagPatterns) {
    const matches = content.match(pattern);
    if (matches) {
      const extractedTags = matches
        .flatMap(match => match.split(/[,;]/))
        .map(tag => tag.trim().replace(/^#/, ''))
        .filter(tag => tag.length > 0);
      metadata.tags = [...new Set([...metadata.tags || [], ...extractedTags])];
    }
  }

  return metadata;
}

/**
 * Creates metadata header in YAML format
 */
function createMetadataHeader(metadata: DocMetadata): string {
  return `---
title: "${metadata.title}"
type: "${metadata.type}"
status: "${metadata.status}"
created: "${metadata.created.toISOString()}"
lastUpdated: "${metadata.lastUpdated.toISOString()}"
author: "${metadata.author}"
tags: [${metadata.tags.map(tag => `"${tag}"`).join(', ')}]
---

`;
}

/**
 * Gets the target directory for a category
 */
function getTargetDirectory(category: DocMetadata['type']): string {
  const baseDir = 'docs';
  switch (category) {
    case 'prd':
      return `${baseDir}/prds`;
    case 'implementation':
      return `${baseDir}/implementation-notes`;
    case 'architecture':
      return `${baseDir}/architecture`;
    case 'guide':
      return `${baseDir}/guides`;
    case 'archived':
      return `${baseDir}/archived`;
    default:
      return `${baseDir}/archived`;
  }
}

/**
 * Updates internal links in content
 */
function updateInternalLinks(content: string, oldPath: string, newPath: string): string {
  // Update relative links that point to other markdown files
  return content.replace(
    /\[([^\]]+)\]\(([^)]+\.md)\)/g,
    (match, text, link) => {
      // If it's a relative link, we need to handle it
      if (!link.startsWith('http') && !link.includes('/') && link.endsWith('.md')) {
        // For now, keep relative links as-is since we're moving everything to organized structure
        // In a more sophisticated implementation, we'd calculate relative paths
        return match;
      }
      return match;
    }
  );
}

/**
 * Migrates a single file
 */
async function migrateFile(file: string): Promise<MigrationResult> {
  const content = fs.readFileSync(file, 'utf-8');
  const metadata = extractMetadata(file, content) as DocMetadata;

  const targetDir = getTargetDirectory(metadata.type);
  const newFilename = `${targetDir}/${file}`;

  // Create metadata header
  const metadataHeader = createMetadataHeader(metadata);

  // Update internal links
  const updatedContent = updateInternalLinks(content, file, newFilename);

  // Write file with metadata header
  fs.writeFileSync(newFilename, metadataHeader + updatedContent);

  return {
    file,
    originalPath: file,
    newPath: newFilename,
    category: metadata.type,
    metadata
  };
}

/**
 * Main migration function
 */
async function migrateAllMarkdownFiles(): Promise<MigrationResult[]> {
  const rootDir = process.cwd();
  const markdownFiles = await glob('*.md', { cwd: rootDir });

  console.log(`Found ${markdownFiles.length} markdown files to migrate`);

  const results: MigrationResult[] = [];

  for (const file of markdownFiles) {
    try {
      const result = await migrateFile(file);
      results.push(result);
      console.log(`✓ Migrated: ${file} → ${result.newPath}`);
    } catch (error) {
      console.error(`✗ Failed to migrate ${file}:`, error);
    }
  }

  return results;
}

/**
 * Remove original files after migration
 */
function cleanupOriginalFiles(): void {
  const rootDir = process.cwd();
  const markdownFiles = fs.readdirSync(rootDir).filter(f => f.endsWith('.md'));

  for (const file of markdownFiles) {
    try {
      fs.unlinkSync(file);
      console.log(`✓ Removed original: ${file}`);
    } catch (error) {
      console.error(`✗ Failed to remove ${file}:`, error);
    }
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Starting documentation migration...');

  try {
    // Migrate files
    const results = await migrateAllMarkdownFiles();

    // Group by category
    const byCategory = results.reduce((acc, result) => {
      acc[result.category] = (acc[result.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log('\n📊 Migration Summary:');
    Object.entries(byCategory).forEach(([category, count]) => {
      console.log(`  ${category}: ${count} files`);
    });

    // Cleanup original files
    console.log('\n🧹 Cleaning up original files...');
    cleanupOriginalFiles();

    console.log(`\n✅ Successfully migrated ${results.length} files`);
    console.log('\nNext steps:');
    console.log('1. Review migrated files in docs/ directories');
    console.log('2. Test internal links and navigation');
    console.log('3. Update any hardcoded paths in code');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { categorizeDocument, extractMetadata, createMetadataHeader, getTargetDirectory, migrateAllMarkdownFiles };
