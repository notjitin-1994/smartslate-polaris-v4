import { getDirectoryTree, FileNode } from '../utils/file-reader.js';
import { join } from 'path';
import { readdirSync, existsSync, statSync } from 'fs';
import { safeJoin } from '../utils/pathSecurity.js';

/**
 * Get directory tree for the entire project
 */
export function getProjectTree(projectRoot: string, maxDepth: number = 3): FileNode {
  return getDirectoryTree(projectRoot, maxDepth);
}

/**
 * Format file tree as readable text
 */
export function formatFileTree(node: FileNode, indent: string = ''): string {
  let result = `${indent}${node.name}${node.type === 'directory' ? '/' : ''}\n`;

  if (node.children) {
    const sortedChildren = [...node.children].sort((a, b) => {
      if (a.type === b.type) return a.name.localeCompare(b.name);
      return a.type === 'directory' ? -1 : 1;
    });

    for (let i = 0; i < sortedChildren.length; i++) {
      const child = sortedChildren[i];
      const isLast = i === sortedChildren.length - 1;
      const prefix = isLast ? '└── ' : '├── ';
      const childIndent = indent + (isLast ? '    ' : '│   ');

      result += `${indent}${prefix}${child.name}${
        child.type === 'directory' ? '/' : ''
      }\n`;

      if (child.children && child.children.length > 0) {
        result += formatFileTree(
          { ...child, name: '' },
          childIndent
        ).replace(/^.*\n/, '');
      }
    }
  }

  return result;
}

/**
 * List all React components in the project
 */
export function listComponents(projectRoot: string): string[] {
  // Validate path to prevent traversal attacks
  const componentsDir = safeJoin(projectRoot, join('frontend', 'components'));

  if (!existsSync(componentsDir)) {
    return [];
  }

  const components: string[] = [];

  function scanDirectory(dir: string, prefix: string = ''): void {
    const entries = readdirSync(dir);

    for (const entry of entries) {
      // Validate path to prevent traversal attacks
      const fullPath = safeJoin(dir, entry);
      const stats = statSync(fullPath);

      if (stats.isDirectory()) {
        scanDirectory(fullPath, prefix ? `${prefix}/${entry}` : entry);
      } else if (entry.endsWith('.tsx') || entry.endsWith('.ts')) {
        const componentName = entry.replace(/\.(tsx?|jsx?)$/, '');
        components.push(prefix ? `${prefix}/${componentName}` : componentName);
      }
    }
  }

  try {
    scanDirectory(componentsDir);
  } catch (error) {
    // Silently handle errors
  }

  return components.sort();
}

/**
 * List all API routes
 */
export function listAPIRoutes(projectRoot: string): Array<{
  path: string;
  methods: string[];
  file: string;
}> {
  // Validate path to prevent traversal attacks
  const apiDir = safeJoin(projectRoot, join('frontend', 'app', 'api'));

  if (!existsSync(apiDir)) {
    return [];
  }

  const routes: Array<{ path: string; methods: string[]; file: string }> = [];

  function scanAPIDirectory(dir: string, basePath: string = '/api'): void {
    const entries = readdirSync(dir);

    for (const entry of entries) {
      // Validate path to prevent traversal attacks
      const fullPath = safeJoin(dir, entry);
      const stats = statSync(fullPath);

      if (stats.isDirectory()) {
        // Dynamic route like [id]
        const routeSegment = entry.startsWith('[') ? `:${entry.slice(1, -1)}` : entry;
        scanAPIDirectory(fullPath, `${basePath}/${routeSegment}`);
      } else if (entry === 'route.ts' || entry === 'route.js') {
        // This is an API route
        routes.push({
          path: basePath,
          methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'], // Assume all for now
          file: fullPath.replace(projectRoot, ''),
        });
      }
    }
  }

  try {
    scanAPIDirectory(apiDir);
  } catch (error) {
    // Silently handle errors
  }

  return routes.sort((a, b) => a.path.localeCompare(b.path));
}

/**
 * Get technology stack information
 */
export function getTechStack(_projectRoot: string): {
  framework: string;
  language: string;
  database: string;
  ai: string[];
  styling: string[];
  testing: string[];
} {
  return {
    framework: 'Next.js 15 (App Router, React 19)',
    language: 'TypeScript 5.7 (strict mode)',
    database: 'Supabase PostgreSQL 15+',
    ai: ['Claude Sonnet 4.5', 'Claude Sonnet 4 (fallback)'],
    styling: ['Tailwind CSS v4', 'Radix UI', 'Framer Motion'],
    testing: ['Vitest', 'React Testing Library', 'Playwright (planned)'],
  };
}
