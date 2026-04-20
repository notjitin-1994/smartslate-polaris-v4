#!/usr/bin/env node

/**
 * SmartSlate Polaris v3 - Dependency Scanner Script
 *
 * This script scans all application files and extracts import/export relationships,
 * generating a raw dependency map for each app to identify dependencies before removal.
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

interface DependencyMap {
  file: string;
  imports: string[];
  exports: string[];
  relativePath: string;
  app: string;
}

interface AppDependencyData {
  app: string;
  totalFiles: number;
  dependencyMap: DependencyMap[];
  externalDependencies: Set<string>;
  internalDependencies: Set<string>;
  crossAppReferences: string[];
}

interface CrossAppDependency {
  from: { app: string; file: string };
  to: { app: string; import: string };
  type: 'import' | 'export';
}

/**
 * Extract imports and exports from a single file
 */
function extractDependencies(filePath: string, content: string): { imports: string[]; exports: string[] } {
  const imports: string[] = [];
  const exports: string[] = [];

  // Match ES6 import statements
  const importRegex = /import\s+(?:[\w\s{},*]+\s+from\s+)?['"]([^'"]+)['"]/g;
  let importMatch;
  while ((importMatch = importRegex.exec(content)) !== null) {
    imports.push(importMatch[1]);
  }

  // Match ES6 export statements
  const exportRegex = /export\s+(?:[\w\s{},*]+\s+from\s+)?['"]([^'"]+)['"]/g;
  let exportMatch;
  while ((exportMatch = exportRegex.exec(content)) !== null) {
    exports.push(exportMatch[1]);
  }

  // Match dynamic imports
  const dynamicImportRegex = /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
  let dynamicMatch;
  while ((dynamicMatch = dynamicImportRegex.exec(content)) !== null) {
    imports.push(dynamicMatch[1]);
  }

  // Match require statements
  const requireRegex = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
  let requireMatch;
  while ((requireMatch = requireRegex.exec(content)) !== null) {
    imports.push(requireMatch[1]);
  }

  return { imports, exports };
}

/**
 * Resolve relative imports to absolute paths
 */
function resolveImportPath(baseFile: string, importPath: string): string {
  // Handle absolute imports (starting with @, ~, or external packages)
  if (importPath.startsWith('@/') || importPath.startsWith('~/') || !importPath.includes('/')) {
    return importPath;
  }

  // Handle relative imports
  const baseDir = path.dirname(baseFile);
  const resolvedPath = path.resolve(baseDir, importPath);

  // Convert back to relative path from project root for consistency
  const projectRoot = process.cwd();
  const relativePath = path.relative(projectRoot, resolvedPath);

  return relativePath;
}

/**
 * Scan a single application directory
 */
async function scanApp(appPath: string, appName: string): Promise<AppDependencyData> {
  console.log(`🔍 Scanning ${appName} (${appPath})...`);

  const files = await glob(`${appPath}/**/*.{ts,tsx,js,jsx}`, {
    ignore: ['**/node_modules/**', '**/*.d.ts', '**/dist/**', '**/build/**']
  });

  console.log(`📁 Found ${files.length} files in ${appName}`);

  const dependencyMap: DependencyMap[] = [];
  const externalDependencies = new Set<string>();
  const internalDependencies = new Set<string>();

  for (const file of files) {
    try {
      const content = fs.readFileSync(file, 'utf-8');
      const { imports, exports } = extractDependencies(file, content);

      // Resolve import paths
      const resolvedImports = imports.map(imp => resolveImportPath(file, imp));
      const resolvedExports = exports.map(exp => resolveImportPath(file, exp));

      // Categorize dependencies
      resolvedImports.forEach(imp => {
        if (imp.startsWith('@/') || imp.startsWith('~/') || !imp.includes('/')) {
          externalDependencies.add(imp);
        } else {
          internalDependencies.add(imp);
        }
      });

      dependencyMap.push({
        file,
        imports: resolvedImports,
        exports: resolvedExports,
        relativePath: path.relative(process.cwd(), file),
        app: appName
      });
    } catch (error) {
      console.warn(`⚠️  Failed to process ${file}:`, error);
    }
  }

  return {
    app: appName,
    totalFiles: files.length,
    dependencyMap,
    externalDependencies,
    internalDependencies,
    crossAppReferences: []
  };
}

/**
 * Find cross-app dependencies
 */
function findCrossAppDependencies(appData: AppDependencyData[]): CrossAppDependency[] {
  const crossAppDeps: CrossAppDependency[] = [];

  for (const sourceApp of appData) {
    for (const dep of sourceApp.dependencyMap) {
      for (const importPath of dep.imports) {
        // Check if this import references another app
        for (const targetApp of appData) {
          if (sourceApp.app !== targetApp.app && importPath.startsWith(targetApp.app + '/')) {
            crossAppDeps.push({
              from: { app: sourceApp.app, file: dep.relativePath },
              to: { app: targetApp.app, import: importPath },
              type: 'import'
            });
          }
        }
      }

      for (const exportPath of dep.exports) {
        // Check if this export is used by another app
        for (const targetApp of appData) {
          if (sourceApp.app !== targetApp.app && exportPath.startsWith(targetApp.app + '/')) {
            crossAppDeps.push({
              from: { app: sourceApp.app, file: dep.relativePath },
              to: { app: targetApp.app, import: exportPath },
              type: 'export'
            });
          }
        }
      }
    }
  }

  return crossAppDeps;
}

/**
 * Generate dependency report
 */
function generateDependencyReport(appData: AppDependencyData[], crossAppDeps: CrossAppDependency[]): void {
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalApps: appData.length,
      totalFiles: appData.reduce((sum, app) => sum + app.totalFiles, 0),
      totalCrossAppDependencies: crossAppDeps.length,
      apps: appData.map(app => ({
        name: app.app,
        files: app.totalFiles,
        externalDeps: app.externalDependencies.size,
        internalDeps: app.internalDependencies.size
      }))
    },
    applications: appData.map(app => ({
      name: app.app,
      totalFiles: app.totalFiles,
      externalDependencies: Array.from(app.externalDependencies),
      internalDependencies: Array.from(app.internalDependencies),
      files: app.dependencyMap.map(dep => ({
        file: dep.relativePath,
        imports: dep.imports,
        exports: dep.exports,
        importCount: dep.imports.length,
        exportCount: dep.exports.length
      }))
    })),
    crossAppDependencies: crossAppDeps.map(dep => ({
      from: `${dep.from.app}/${dep.from.file}`,
      to: `${dep.to.app}/${dep.to.import}`,
      type: dep.type
    }))
  };

  // Save detailed report
  fs.writeFileSync('dependency-report.json', JSON.stringify(report, null, 2));
  console.log('📊 Detailed dependency report saved to dependency-report.json');

  // Generate summary report
  console.log('\n📋 DEPENDENCY AUDIT SUMMARY');
  console.log('==============================');

  appData.forEach(app => {
    console.log(`\n🔍 ${app.app}:`);
    console.log(`   Files: ${app.totalFiles}`);
    console.log(`   External Dependencies: ${app.externalDependencies.size}`);
    console.log(`   Internal Dependencies: ${app.internalDependencies.size}`);
  });

  console.log(`\n🔗 Cross-App Dependencies: ${crossAppDeps.length}`);

  if (crossAppDeps.length > 0) {
    console.log('\n🚨 CROSS-APP DEPENDENCIES FOUND:');
    crossAppDeps.forEach(dep => {
      console.log(`   ${dep.from.app} → ${dep.to.app} (${dep.type})`);
      console.log(`     ${dep.from.file} imports ${dep.to.import}`);
    });
  }

  // Check for unused apps
  const appsWithNoIncomingDeps = appData.filter(app => {
    return !crossAppDeps.some(dep => dep.to.app === app.app);
  });

  if (appsWithNoIncomingDeps.length > 0) {
    console.log('\n✅ SAFE TO REMOVE (No incoming dependencies):');
    appsWithNoIncomingDeps.forEach(app => {
      console.log(`   ${app.app} (${app.totalFiles} files)`);
    });
  }

  const appsWithIncomingDeps = appData.filter(app => {
    return crossAppDeps.some(dep => dep.to.app === app.app);
  });

  if (appsWithIncomingDeps.length > 0) {
    console.log('\n⚠️  REQUIRES CAREFUL REVIEW (Has incoming dependencies):');
    appsWithIncomingDeps.forEach(app => {
      const incoming = crossAppDeps.filter(dep => dep.to.app === app.app);
      console.log(`   ${app.app} (${incoming.length} incoming dependencies)`);
      incoming.forEach(dep => {
        console.log(`     ← ${dep.from.app}/${dep.from.file}`);
      });
    });
  }
}

/**
 * Main execution function
 */
async function main() {
  console.log('🚀 Starting Comprehensive Dependency Audit...');
  console.log('=============================================\n');

  try {
    // Define applications to scan
    const apps = [
      { path: 'frontend', name: 'frontend' },
      { path: 'smartslate-app', name: 'smartslate-app' },
      { path: 'frontend/smartslate-polaris', name: 'frontend/smartslate-polaris' }
    ];

    // Scan each application
    const appData: AppDependencyData[] = [];

    for (const app of apps) {
      if (fs.existsSync(app.path)) {
        const data = await scanApp(app.path, app.name);
        appData.push(data);
      } else {
        console.log(`⚠️  App directory not found: ${app.path}`);
      }
    }

    // Find cross-app dependencies
    const crossAppDeps = findCrossAppDependencies(appData);

    // Generate report
    generateDependencyReport(appData, crossAppDeps);

    console.log('\n✅ Dependency audit completed successfully!');

  } catch (error) {
    console.error('❌ Error during dependency audit:', error);
    process.exit(1);
  }
}

// Run the script if called directly
main().catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});

export { scanApp, findCrossAppDependencies, generateDependencyReport };
