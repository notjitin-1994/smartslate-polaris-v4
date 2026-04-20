import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import { safeJoin } from './pathSecurity.js';

/**
 * Simple in-memory cache for file reads
 */
const fileCache = new Map<string, { content: string; timestamp: number }>();
const CACHE_TTL = 60000; // 1 minute

/**
 * Read a file with caching
 */
export function readFileCached(filePath: string): string {
  const cached = fileCache.get(filePath);
  const now = Date.now();

  if (cached && now - cached.timestamp < CACHE_TTL) {
    return cached.content;
  }

  if (!existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  const content = readFileSync(filePath, 'utf-8');
  fileCache.set(filePath, { content, timestamp: now });

  return content;
}

/**
 * Get directory tree structure
 */
export interface FileNode {
  name: string;
  type: 'file' | 'directory';
  path: string;
  children?: FileNode[];
}

const IGNORE_PATTERNS = [
  'node_modules',
  '.git',
  '.next',
  'build',
  'dist',
  '.cache',
  'coverage',
  '.env',
  '.env.local',
  '.DS_Store',
];

export function getDirectoryTree(
  rootPath: string,
  maxDepth: number = 3,
  currentDepth: number = 0
): FileNode {
  const name = rootPath.split('/').pop() || rootPath;
  const stats = statSync(rootPath);

  if (stats.isFile()) {
    return { name, type: 'file', path: rootPath };
  }

  const node: FileNode = {
    name,
    type: 'directory',
    path: rootPath,
    children: [],
  };

  if (currentDepth >= maxDepth) {
    return node;
  }

  try {
    const entries = readdirSync(rootPath);

    for (const entry of entries) {
      if (IGNORE_PATTERNS.includes(entry)) {
        continue;
      }

      try {
        // Validate path to prevent traversal attacks
        const fullPath = safeJoin(rootPath, entry);
        const childNode = getDirectoryTree(fullPath, maxDepth, currentDepth + 1);
        node.children!.push(childNode);
      } catch (error) {
        // Skip entries we can't read or invalid paths
        continue;
      }
    }

    // Sort: directories first, then files
    node.children!.sort((a, b) => {
      if (a.type === b.type) {
        return a.name.localeCompare(b.name);
      }
      return a.type === 'directory' ? -1 : 1;
    });
  } catch (error) {
    // If we can't read the directory, return it without children
  }

  return node;
}
