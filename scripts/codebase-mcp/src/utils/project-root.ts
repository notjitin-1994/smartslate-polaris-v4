import { existsSync } from 'fs';
import { join, dirname, resolve, normalize, relative } from 'path';

/**
 * Find the project root by looking for CLAUDE.md or package.json
 */
export function findProjectRoot(): string {
  // Try environment variable first
  if (process.env.PROJECT_ROOT && existsSync(process.env.PROJECT_ROOT)) {
    return process.env.PROJECT_ROOT;
  }

  // Try from current working directory
  let currentDir = process.cwd();

  // Walk up the directory tree
  for (let i = 0; i < 10; i++) {
    // Check for markers of project root
    if (
      existsSync(join(currentDir, 'CLAUDE.md')) ||
      existsSync(join(currentDir, 'package.json'))
    ) {
      return currentDir;
    }

    const parentDir = dirname(currentDir);
    if (parentDir === currentDir) {
      // Reached root of filesystem
      break;
    }
    currentDir = parentDir;
  }

  // Fallback to cwd
  return process.cwd();
}

/**
 * Validate that a path is within the project root (security check)
 * Prevents path traversal attacks using ../ or absolute paths
 *
 * @param projectRoot - The project root directory (must be absolute)
 * @param targetPath - The target path to validate (can be relative or absolute)
 * @returns true if the path is safe (within project root), false otherwise
 */
export function isPathSafe(projectRoot: string, targetPath: string): boolean {
  // Normalize and resolve both paths to absolute, canonical forms
  const normalizedRoot = resolve(normalize(projectRoot));
  const normalizedTarget = resolve(normalize(join(normalizedRoot, targetPath)));

  // Use path.relative to check if target is within root
  // If relative path starts with '..' or is absolute to different location, it's outside
  const relativePath = relative(normalizedRoot, normalizedTarget);

  // Safe if:
  // 1. Relative path doesn't start with '..' (not going up)
  // 2. Not an absolute path to different location
  const isSafe =
    relativePath.length > 0 &&
    !relativePath.startsWith('..') &&
    !relativePath.startsWith('/');

  return isSafe && normalizedTarget.startsWith(normalizedRoot);
}
