import { readFileCached } from '../utils/file-reader.js';
import { join, relative } from 'path';
import { existsSync, statSync } from 'fs';
import { isPathSafe } from '../utils/project-root.js';

/**
 * Get file content with metadata
 */
export function getFileContent(
  projectRoot: string,
  filePath: string
): {
  path: string;
  content: string;
  size: number;
  extension: string;
} {
  // Ensure path is safe
  const fullPath = filePath.startsWith('/')
    ? filePath
    : join(projectRoot, filePath);

  if (!isPathSafe(projectRoot, fullPath)) {
    throw new Error('Path is outside project root');
  }

  if (!existsSync(fullPath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  const content = readFileCached(fullPath);
  const stats = statSync(fullPath);
  const extension = fullPath.split('.').pop() || '';

  return {
    path: relative(projectRoot, fullPath),
    content,
    size: stats.size,
    extension,
  };
}

/**
 * Get component information
 */
export function getComponentInfo(
  projectRoot: string,
  componentName: string
): {
  name: string;
  path: string;
  content: string;
  imports: string[];
  exports: string[];
} {
  // Security: Validate componentName doesn't contain path traversal
  if (componentName.includes('..') || componentName.includes('/') || componentName.includes('\\')) {
    throw new Error('Invalid component name: path traversal not allowed');
  }

  // Try to find the component
  const possiblePaths = [
    join(projectRoot, 'frontend', 'components', `${componentName}.tsx`),
    join(projectRoot, 'frontend', 'components', componentName, 'index.tsx'),
    join(projectRoot, 'frontend', 'components', componentName, `${componentName}.tsx`),
    join(projectRoot, 'frontend', 'app', `${componentName}.tsx`),
  ];

  let componentPath: string | null = null;

  for (const path of possiblePaths) {
    // Security check: ensure path is within project root
    if (!isPathSafe(projectRoot, path)) {
      continue;
    }

    if (existsSync(path)) {
      componentPath = path;
      break;
    }
  }

  if (!componentPath) {
    throw new Error(`Component not found: ${componentName}`);
  }

  const content = readFileCached(componentPath);

  // Extract imports
  const importMatches = content.matchAll(/import\s+.*\s+from\s+['"](.*)['"];?/g);
  const imports = Array.from(importMatches, (m) => m[1]);

  // Extract exports
  const exportMatches = content.matchAll(/export\s+(?:default\s+)?(?:function|const|class)\s+(\w+)/g);
  const exports = Array.from(exportMatches, (m) => m[1]);

  return {
    name: componentName,
    path: relative(projectRoot, componentPath),
    content,
    imports,
    exports,
  };
}

/**
 * Get API route details
 */
export function getAPIRouteInfo(
  projectRoot: string,
  routePath: string
): {
  path: string;
  filePath: string;
  content: string;
  methods: string[];
} {
  // Security: Validate routePath doesn't contain path traversal
  if (routePath.includes('..')) {
    throw new Error('Invalid route path: path traversal not allowed');
  }

  // Convert /api/foo/bar to frontend/app/api/foo/bar/route.ts
  const cleanPath = routePath.replace(/^\/api\//, '');
  const routeFilePath = join(
    projectRoot,
    'frontend',
    'app',
    'api',
    cleanPath,
    'route.ts'
  );

  // Security check: ensure path is within project root
  if (!isPathSafe(projectRoot, routeFilePath)) {
    throw new Error('Invalid route path: outside project root');
  }

  if (!existsSync(routeFilePath)) {
    throw new Error(`API route not found: ${routePath}`);
  }

  const content = readFileCached(routeFilePath);

  // Extract exported methods
  const methodMatches = content.matchAll(
    /export\s+async\s+function\s+(GET|POST|PUT|DELETE|PATCH)/g
  );
  const methods = Array.from(methodMatches, (m) => m[1]);

  return {
    path: routePath,
    filePath: relative(projectRoot, routeFilePath),
    content,
    methods,
  };
}
