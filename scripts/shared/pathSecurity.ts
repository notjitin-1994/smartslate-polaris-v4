/**
 * Path Security Utilities
 * Prevents path traversal attacks in file operations
 */

import * as path from 'path';
import * as fs from 'fs';

/**
 * Validates and resolves a user-provided file path safely
 * Prevents path traversal attacks by ensuring the resolved path stays within the base directory
 *
 * @param basePath - The base directory that contains allowed files
 * @param userPath - The user-provided path (potentially unsafe)
 * @returns The safe, resolved absolute path
 * @throws Error if the path attempts to escape the base directory
 */
export function securePath(basePath: string, userPath: string): string {
  // Reject absolute paths
  if (path.isAbsolute(userPath)) {
    throw new Error('Security: Absolute paths are not allowed');
  }

  // Reject paths with null bytes (can bypass security checks)
  if (userPath.includes('\0')) {
    throw new Error('Security: Null bytes in path are not allowed');
  }

  // Normalize and resolve to get canonical absolute path
  const resolvedBase = path.resolve(basePath);
  const resolvedPath = path.resolve(resolvedBase, userPath);
  const normalizedPath = path.normalize(resolvedPath);

  // Ensure resolved path is within the base directory
  // Use path.relative to check - if it starts with "..", it's outside
  const relativePath = path.relative(resolvedBase, normalizedPath);

  if (
    relativePath.startsWith('..') ||
    path.isAbsolute(relativePath) ||
    relativePath.startsWith(path.sep)
  ) {
    throw new Error('Security: Path traversal attempt detected');
  }

  return normalizedPath;
}

/**
 * Safely reads a file ensuring it's within the allowed base directory
 *
 * @param basePath - The base directory
 * @param userPath - User-provided path (relative to basePath)
 * @param encoding - File encoding (default: 'utf-8')
 * @returns File contents
 */
export function secureReadFile(
  basePath: string,
  userPath: string,
  encoding: BufferEncoding = 'utf-8'
): string {
  const safePath = securePath(basePath, userPath);

  // Additional check: verify file exists and is actually a file
  const stats = fs.statSync(safePath);
  if (!stats.isFile()) {
    throw new Error('Security: Path must point to a file');
  }

  return fs.readFileSync(safePath, encoding);
}

/**
 * Safely checks if a file exists within the allowed base directory
 *
 * @param basePath - The base directory
 * @param userPath - User-provided path (relative to basePath)
 * @returns True if file exists and is accessible
 */
export function secureFileExists(basePath: string, userPath: string): boolean {
  try {
    const safePath = securePath(basePath, userPath);
    return fs.existsSync(safePath);
  } catch {
    return false;
  }
}

/**
 * Validates a path pattern for glob operations
 * Removes potentially dangerous patterns
 *
 * @param pattern - The glob pattern to validate
 * @returns Sanitized pattern or throws error
 */
export function validateGlobPattern(pattern: string): string {
  // Reject patterns with null bytes
  if (pattern.includes('\0')) {
    throw new Error('Security: Null bytes in pattern are not allowed');
  }

  // Reject patterns trying to escape with absolute paths
  if (path.isAbsolute(pattern)) {
    throw new Error('Security: Absolute paths in glob patterns are not allowed');
  }

  // Reject patterns with parent directory references outside allowed scope
  const normalized = path.normalize(pattern);
  if (normalized.startsWith('..')) {
    throw new Error('Security: Glob patterns cannot traverse outside the base directory');
  }

  return pattern;
}
