/**
 * Path Security Utilities for Codebase MCP
 * Prevents path traversal attacks in file operations
 */

import { join, resolve, relative, normalize, isAbsolute, sep } from 'path';
import { existsSync, statSync, readFileSync } from 'fs';

/**
 * Validates and resolves a file path safely within a base directory
 * Prevents path traversal attacks
 *
 * @param basePath - The base directory that contains allowed files
 * @param userPath - The path to validate (potentially unsafe)
 * @returns The safe, resolved absolute path
 * @throws Error if the path attempts to escape the base directory
 */
export function validatePath(basePath: string, userPath: string): string {
  // Reject null bytes
  if (userPath.includes('\0')) {
    throw new Error('Invalid path: Contains null bytes');
  }

  // Normalize and resolve
  const resolvedBase = resolve(basePath);
  const resolvedPath = resolve(resolvedBase, userPath);
  const normalizedPath = normalize(resolvedPath);

  // Check if path is within base directory
  const relativePath = relative(resolvedBase, normalizedPath);

  if (
    relativePath.startsWith('..') ||
    isAbsolute(relativePath) ||
    relativePath.startsWith(sep)
  ) {
    throw new Error(`Path traversal detected: ${userPath}`);
  }

  return normalizedPath;
}

/**
 * Safely joins paths and validates the result stays within base directory
 *
 * @param basePath - The base directory
 * @param relativePath - Path to join (from glob or other source)
 * @returns Safe absolute path
 */
export function safeJoin(basePath: string, relativePath: string): string {
  return validatePath(basePath, relativePath);
}

/**
 * Safely reads a file ensuring it's within the allowed directory
 *
 * @param basePath - The base directory
 * @param relativePath - Relative path to the file
 * @param encoding - File encoding
 * @returns File contents
 */
export function safeReadFile(
  basePath: string,
  relativePath: string,
  encoding: BufferEncoding = 'utf-8'
): string {
  const safePath = validatePath(basePath, relativePath);

  if (!existsSync(safePath)) {
    throw new Error(`File not found: ${relativePath}`);
  }

  const stats = statSync(safePath);
  if (!stats.isFile()) {
    throw new Error(`Not a file: ${relativePath}`);
  }

  return readFileSync(safePath, encoding);
}
