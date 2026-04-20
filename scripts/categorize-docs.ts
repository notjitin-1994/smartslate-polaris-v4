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

interface CategorizationResult {
  file: string;
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
 * Main categorization function
 */
async function categorizeAllMarkdownFiles(): Promise<CategorizationResult[]> {
  const rootDir = process.cwd();
  const markdownFiles = await glob('*.md', { cwd: rootDir });

  console.log(`Found ${markdownFiles.length} markdown files to categorize`);

  const results: CategorizationResult[] = [];

  for (const file of markdownFiles) {
    try {
      const content = fs.readFileSync(file, 'utf-8');
      const metadata = extractMetadata(file, content) as DocMetadata;

      results.push({
        file,
        category: metadata.type,
        metadata
      });

      console.log(`✓ Categorized: ${file} → ${metadata.type}`);
    } catch (error) {
      console.error(`✗ Failed to categorize ${file}:`, error);
    }
  }

  return results;
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Starting documentation categorization...');

  try {
    const results = await categorizeAllMarkdownFiles();

    // Group by category
    const byCategory = results.reduce((acc, result) => {
      acc[result.category] = (acc[result.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log('\n📊 Categorization Summary:');
    Object.entries(byCategory).forEach(([category, count]) => {
      console.log(`  ${category}: ${count} files`);
    });

    console.log(`\n✅ Successfully categorized ${results.length} files`);
    console.log('\nNext steps:');
    console.log('1. Review categorization results');
    console.log('2. Run migration script to move files');
    console.log('3. Update internal links');

  } catch (error) {
    console.error('❌ Categorization failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { categorizeDocument, extractMetadata, createMetadataHeader, categorizeAllMarkdownFiles };
