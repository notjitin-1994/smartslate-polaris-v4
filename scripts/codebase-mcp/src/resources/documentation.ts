import { readFileCached } from '../utils/file-reader.js';
import { join } from 'path';
import { readdirSync, existsSync } from 'fs';
import { isPathSafe } from '../utils/project-root.js';

/**
 * Get CLAUDE.md content
 */
export function getClaudeMd(projectRoot: string): string {
  const filePath = join(projectRoot, 'CLAUDE.md');
  return readFileCached(filePath);
}

/**
 * List all PRD files
 */
export function listPRDs(projectRoot: string): string[] {
  const prdsDir = join(projectRoot, 'docs', 'prds');

  if (!existsSync(prdsDir)) {
    return [];
  }

  return readdirSync(prdsDir)
    .filter((file) => file.endsWith('.md'))
    .map((file) => file.replace('.md', ''));
}

/**
 * Get specific PRD content
 */
export function getPRD(projectRoot: string, prdName: string): string {
  // Security: Validate prdName doesn't contain path traversal attempts
  if (prdName.includes('..') || prdName.includes('/') || prdName.includes('\\')) {
    throw new Error('Invalid PRD name: path traversal not allowed');
  }

  const filePath = join(projectRoot, 'docs', 'prds', `${prdName}.md`);

  // Additional security check
  if (!isPathSafe(projectRoot, join('docs', 'prds', `${prdName}.md`))) {
    throw new Error('Invalid PRD name: outside project root');
  }

  if (!existsSync(filePath)) {
    throw new Error(`PRD not found: ${prdName}`);
  }

  return readFileCached(filePath);
}

/**
 * List all Cursor rule files
 */
export function listCursorRules(projectRoot: string): string[] {
  const rulesDir = join(projectRoot, '.cursor', 'rules');

  if (!existsSync(rulesDir)) {
    return [];
  }

  return readdirSync(rulesDir)
    .filter((file) => file.endsWith('.mdc'))
    .map((file) => file.replace('.mdc', ''));
}

/**
 * Get specific Cursor rule content
 */
export function getCursorRule(projectRoot: string, ruleName: string): string {
  // Security: Validate ruleName doesn't contain path traversal attempts
  if (ruleName.includes('..') || ruleName.includes('/') || ruleName.includes('\\')) {
    throw new Error('Invalid rule name: path traversal not allowed');
  }

  const filePath = join(projectRoot, '.cursor', 'rules', `${ruleName}.mdc`);

  // Additional security check
  if (!isPathSafe(projectRoot, join('.cursor', 'rules', `${ruleName}.mdc`))) {
    throw new Error('Invalid rule name: outside project root');
  }

  if (!existsSync(filePath)) {
    throw new Error(`Cursor rule not found: ${ruleName}`);
  }

  return readFileCached(filePath);
}

/**
 * Get project overview (generated summary)
 */
export function getProjectOverview(projectRoot: string): string {
  try {
    const claudeMd = getClaudeMd(projectRoot);

    // Extract the "Project Overview" section
    const overviewMatch = claudeMd.match(
      /## Project Overview\n([\s\S]*?)(?=\n##|$)/
    );

    if (overviewMatch) {
      return overviewMatch[1].trim();
    }

    // Fallback: return first few paragraphs
    return claudeMd.split('\n\n').slice(0, 5).join('\n\n');
  } catch (error) {
    return 'SmartSlate Polaris v3: AI-powered learning blueprint generation platform using Next.js 15, TypeScript, Supabase, and Claude AI.';
  }
}
