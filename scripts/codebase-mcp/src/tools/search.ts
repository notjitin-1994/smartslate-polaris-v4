import { glob } from 'glob';
import { readFileSync } from 'fs';
import { join } from 'path';
import { safeJoin } from '../utils/pathSecurity.js';

export interface SearchResult {
  file: string;
  line: number;
  content: string;
  context?: string;
}

/**
 * Search for files matching a pattern
 */
export async function searchFiles(
  projectRoot: string,
  pattern: string
): Promise<string[]> {
  const results = await glob(pattern, {
    cwd: projectRoot,
    ignore: [
      '**/node_modules/**',
      '**/.git/**',
      '**/.next/**',
      '**/build/**',
      '**/dist/**',
      '**/.cache/**',
    ],
  });

  // Validate paths to prevent traversal attacks
  return results.map((file) => safeJoin(projectRoot, file));
}

/**
 * Search file contents for a term
 */
export function searchContent(
  projectRoot: string,
  searchTerm: string,
  filePattern: string = '**/*.{ts,tsx,js,jsx,md}'
): SearchResult[] {
  const results: SearchResult[] = [];

  try {
    const files = glob.sync(filePattern, {
      cwd: projectRoot,
      ignore: [
        '**/node_modules/**',
        '**/.git/**',
        '**/.next/**',
        '**/build/**',
        '**/dist/**',
      ],
    });

    const { safeRegExp } = await import('../utils/safeRegex.js');
    const searchRegex = safeRegExp(searchTerm, 'gi');
    if (!searchRegex) {
      console.warn('Invalid search pattern');
      return [];
    }

    for (const file of files) {
      // Validate path to prevent traversal attacks
      const fullPath = safeJoin(projectRoot, file);

      try {
        const content = readFileSync(fullPath, 'utf-8');
        const lines = content.split('\n');

        lines.forEach((line, index) => {
          if (searchRegex.test(line)) {
            results.push({
              file: file,
              line: index + 1,
              content: line.trim(),
              context: getContextLines(lines, index),
            });
          }
        });
      } catch (error) {
        // Skip files we can't read
        continue;
      }
    }
  } catch (error) {
    // Silently handle glob errors
  }

  return results.slice(0, 50); // Limit to 50 results
}

/**
 * Get context lines around a match
 */
function getContextLines(lines: string[], matchIndex: number): string {
  const start = Math.max(0, matchIndex - 2);
  const end = Math.min(lines.length, matchIndex + 3);

  return lines
    .slice(start, end)
    .map((line, i) => {
      const lineNum = start + i + 1;
      const prefix = lineNum === matchIndex + 1 ? '→ ' : '  ';
      return `${prefix}${lineNum}: ${line}`;
    })
    .join('\n');
}
