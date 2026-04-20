#!/usr/bin/env node
 import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import fs from "fs";
import path from "path";
import { glob } from "glob";

const server = new Server({
  name: "codebase-understanding",
  version: "0.1.0",
}, {
  capabilities: {
    tools: {},
    resources: {},
  },
});

// Helper function to get project root
function getProjectRoot(): string {
  return path.resolve(process.cwd(), '..');
}

// Helper function to read file content
function readFileContent(filePath: string): string {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error);
    return '';
  }
}

// Helper function to find files by pattern
async function findFiles(pattern: string, root: string = getProjectRoot()): Promise<string[]> {
  try {
    return await glob(pattern, { cwd: root, absolute: true });
  } catch (error) {
    console.error(`Error finding files with pattern ${pattern}:`, error);
    return [];
  }
}

// Database Schema Tools
server.tool("get_database_schema", {
  description: "Get complete database schema including tables, columns, and relationships",
  inputSchema: {
    type: "object",
    properties: {
      includeMigrations: { type: "boolean", default: true }
    }
  }
}, async ({ includeMigrations = true }) => {
  const projectRoot = getProjectRoot();
  const migrationsPath = path.join(projectRoot, 'supabase/migrations');
  
  if (!fs.existsSync(migrationsPath)) {
    return { error: "Migrations directory not found" };
  }

  const migrationFiles = fs.readdirSync(migrationsPath)
    .filter(file => file.endsWith('.sql') && !file.startsWith('ROLLBACK_'))
    .sort();

  const schema: any = {
    tables: {},
    relationships: []
  };

  if (includeMigrations) {
    schema.migrations = [];
  }

  for (const file of migrationFiles) {
    const filePath = path.join(migrationsPath, file);
    const content = readFileContent(filePath);
    
    if (includeMigrations) {
      schema.migrations.push({
        file,
        content: content.substring(0, 1000) + (content.length > 1000 ? '...' : ''),
        tables: extractTableNames(content)
      });
    }

    // Extract table definitions
    const tableMatches = content.match(/create table if not exists ([^\s]+)\s*\(([\s\S]*?)\);/gi);
    if (tableMatches) {
      for (const match of tableMatches) {
        const tableNameMatch = match.match(/create table if not exists ([^\s]+)/i);
        if (tableNameMatch) {
          const tableName = tableNameMatch[1];
          const columnsMatch = match.match(/\(([\s\S]*?)\);/);
          if (columnsMatch) {
            schema.tables[tableName] = {
              columns: parseTableColumns(columnsMatch[1]),
              constraints: parseTableConstraints(columnsMatch[1])
            };
          }
        }
      }
    }
  }

  return schema;
});

server.tool("analyze_table_relationships", {
  description: "Analyze foreign key relationships between database tables",
  inputSchema: {
    type: "object",
    properties: {}
  }
}, async () => {
  const projectRoot = getProjectRoot();
  const migrationsPath = path.join(projectRoot, 'supabase/migrations');
  
  const relationships: any[] = [];
  const migrationFiles = fs.readdirSync(migrationsPath)
    .filter(file => file.endsWith('.sql') && !file.startsWith('ROLLBACK_'))
    .sort();

  for (const file of migrationFiles) {
    const filePath = path.join(migrationsPath, file);
    const content = readFileContent(filePath);
    
    // Extract foreign key relationships
    const fkMatches = content.match(/foreign key\s*\(([^)]+)\)\s*references\s+([^\s]+)\s*\(([^)]+)\)/gi);
    if (fkMatches) {
      for (const match of fkMatches) {
        const fkMatch = match.match(/foreign key\s*\(([^)]+)\)\s*references\s+([^\s]+)\s*\(([^)]+)\)/i);
        if (fkMatch) {
          relationships.push({
            fromTable: extractTableNameFromMigration(content),
            fromColumn: fkMatch[1].trim(),
            toTable: fkMatch[2].trim(),
            toColumn: fkMatch[3].trim(),
            migration: file
          });
        }
      }
    }
  }

  return { relationships };
});

// Service Architecture Tools
server.tool("list_services", {
  description: "List all services with their descriptions and locations",
  inputSchema: {
    type: "object",
    properties: {
      category: { type: "string", enum: ["all", "core", "utility", "integration"], default: "all" }
    }
  }
}, async ({ category = "all" }) => {
  const projectRoot = getProjectRoot();
  const servicesPath = path.join(projectRoot, 'frontend/lib/services');
  
  if (!fs.existsSync(servicesPath)) {
    return { error: "Services directory not found" };
  }

  const serviceFiles = await findFiles('*.ts', servicesPath);
  const services: any[] = [];

  for (const filePath of serviceFiles) {
    const content = readFileContent(filePath);
    const serviceName = path.basename(filePath, '.ts');
    
    // Extract class/function definitions and descriptions
    const classMatch = content.match(/export\s+(class|function)\s+(\w+)/);
    const descriptionMatch = content.match(/\/\*\*\s*\n\s*\*\s*(.+?)\s*\n/);
    
    const service: any = {
      name: serviceName,
      path: path.relative(projectRoot, filePath),
      type: classMatch ? classMatch[1] : 'unknown',
      identifier: classMatch ? classMatch[2] : serviceName,
      description: descriptionMatch ? descriptionMatch[1] : '',
      exports: extractExports(content),
      dependencies: extractDependencies(content)
    };

    if (category === "all" || getServiceCategory(service) === category) {
      services.push(service);
    }
  }

  return { services };
});

server.tool("analyze_service_dependencies", {
  description: "Analyze dependencies between services",
  inputSchema: {
    type: "object",
    properties: {
      serviceName: { type: "string" }
    }
  }
}, async ({ serviceName }) => {
  const projectRoot = getProjectRoot();
  const servicesPath = path.join(projectRoot, 'frontend/lib/services');
  
  if (!fs.existsSync(servicesPath)) {
    return { error: "Services directory not found" };
  }

  const serviceFiles = await findFiles('*.ts', servicesPath);
  const dependencies: any[] = [];

  for (const filePath of serviceFiles) {
    const content = readFileContent(filePath);
    const currentServiceName = path.basename(filePath, '.ts');
    
    if (!serviceName || currentServiceName === serviceName) {
      const imports = extractImports(content);
      const serviceDependencies = imports.filter(imp => 
        imp.startsWith('@/lib/services/') || imp.includes('Service')
      );
      
      dependencies.push({
        service: currentServiceName,
        dependencies: serviceDependencies,
        path: path.relative(projectRoot, filePath)
      });
    }
  }

  return { dependencies };
});

// Component Structure Tools
server.tool("get_component_hierarchy", {
  description: "Get Next.js App Router component hierarchy",
  inputSchema: {
    type: "object",
    properties: {
      includeLayouts: { type: "boolean", default: true },
      maxDepth: { type: "number", default: 3 }
    }
  }
}, async ({ includeLayouts = true, maxDepth = 3 }) => {
  const projectRoot = getProjectRoot();
  const appPath = path.join(projectRoot, 'frontend/app');
  
  if (!fs.existsSync(appPath)) {
    return { error: "App directory not found" };
  }

  const hierarchy = buildComponentHierarchy(appPath, includeLayouts, maxDepth);
  
  return { hierarchy };
});

server.tool("find_components_by_feature", {
  description: "Find components related to specific features",
  inputSchema: {
    type: "object",
    properties: {
      feature: { 
        type: "string", 
        enum: ["auth", "blueprint", "questionnaire", "dashboard", "pricing", "admin", "all"],
        default: "all"
      }
    }
  }
}, async ({ feature = "all" }) => {
  const projectRoot = getProjectRoot();
  const appPath = path.join(projectRoot, 'frontend/app');
  const componentsPath = path.join(projectRoot, 'frontend/components');
  
  const featureComponents: any = {
    auth: [],
    blueprint: [],
    questionnaire: [],
    dashboard: [],
    pricing: [],
    admin: []
  };

  // Search in app directory
  const appFiles = await findFiles('**/*.{tsx,ts}', appPath);
  for (const filePath of appFiles) {
    const relativePath = path.relative(projectRoot, filePath);
    const category = categorizeComponentByPath(relativePath);
    if (category && featureComponents[category]) {
      featureComponents[category].push({
        path: relativePath,
        type: 'route',
        description: extractComponentDescription(readFileContent(filePath))
      });
    }
  }

  // Search in components directory
  const componentFiles = await findFiles('**/*.{tsx,ts}', componentsPath);
  for (const filePath of componentFiles) {
    const relativePath = path.relative(projectRoot, filePath);
    const category = categorizeComponentByPath(relativePath);
    if (category && featureComponents[category]) {
      featureComponents[category].push({
        path: relativePath,
        type: 'component',
        description: extractComponentDescription(readFileContent(filePath))
      });
    }
  }

  return feature === "all" ? featureComponents : { [feature]: featureComponents[feature] };
});

// API Analysis Tools
server.tool("list_api_endpoints", {
  description: "List all API endpoints with methods and descriptions",
  inputSchema: {
    type: "object",
    properties: {
      route: { type: "string" }
    }
  }
}, async ({ route }) => {
  const projectRoot = getProjectRoot();
  const apiPath = path.join(projectRoot, 'frontend/app/api');
  
  if (!fs.existsSync(apiPath)) {
    return { error: "API directory not found" };
  }

  const apiFiles = await findFiles('**/route.ts', apiPath);
  const endpoints: any[] = [];

  for (const filePath of apiFiles) {
    const relativePath = path.relative(projectRoot, filePath);
    const routePath = relativePath
      .replace('frontend/app/api/', '')
      .replace('/route.ts', '')
      .replace(/\[([^\]]+)\]/g, ':$1');

    if (!route || routePath.includes(route)) {
      const content = readFileContent(filePath);
      const methods = extractHTTPMethods(content);
      
      endpoints.push({
        path: `/${routePath}`,
        methods,
        file: relativePath,
        description: extractComponentDescription(content),
        auth: extractAuthRequirements(content)
      });
    }
  }

  return { endpoints };
});

// AI Integration Tools
server.tool("get_ai_configuration", {
  description: "Get AI integration configuration and workflow",
  inputSchema: {
    type: "object",
    properties: {}
  }
}, async () => {
  const projectRoot = getProjectRoot();
  const claudePath = path.join(projectRoot, 'frontend/lib/claude');
  
  if (!fs.existsSync(claudePath)) {
    return { error: "Claude integration directory not found" };
  }

  const claudeFiles = await findFiles('*.ts', claudePath);
  const config: any = {
    client: null,
    config: null,
    prompts: null,
    validation: null,
    fallback: null
  };

  for (const filePath of claudeFiles) {
    const fileName = path.basename(filePath, '.ts');
    const content = readFileContent(filePath);
    
    if (fileName === 'client') {
      config.client = {
        path: path.relative(projectRoot, filePath),
        exports: extractExports(content),
        description: extractComponentDescription(content)
      };
    } else if (fileName === 'config') {
      config.config = {
        path: path.relative(projectRoot, filePath),
        exports: extractExports(content),
        description: extractComponentDescription(content)
      };
    } else if (fileName === 'prompts') {
      config.prompts = {
        path: path.relative(projectRoot, filePath),
        exports: extractExports(content),
        description: extractComponentDescription(content)
      };
    } else if (fileName === 'validation') {
      config.validation = {
        path: path.relative(projectRoot, filePath),
        exports: extractExports(content),
        description: extractComponentDescription(content)
      };
    } else if (fileName === 'fallback') {
      config.fallback = {
        path: path.relative(projectRoot, filePath),
        exports: extractExports(content),
        description: extractComponentDescription(content)
      };
    }
  }

  return config;
});

server.tool("trace_ai_workflow", {
  description: "Trace AI workflow for blueprint generation",
  inputSchema: {
    type: "object",
    properties: {}
  }
}, async () => {
  const projectRoot = getProjectRoot();
  const blueprintServicePath = path.join(projectRoot, 'frontend/lib/services/blueprintGenerationService.ts');
  
  if (!fs.existsSync(blueprintServicePath)) {
    return { error: "Blueprint generation service not found" };
  }

  const content = readFileContent(blueprintServicePath);
  
  const workflow = {
    entryPoint: 'BlueprintGenerationService.generate()',
    steps: extractWorkflowSteps(content),
    fallbackMechanism: extractFallbackLogic(content),
    errorHandling: extractErrorHandling(content),
    validation: extractValidationSteps(content)
  };

  return workflow;
});

// Business Logic Tools
server.tool("analyze_subscription_system", {
  description: "Analyze subscription system and tier limits",
  inputSchema: {
    type: "object",
    properties: {}
  }
}, async () => {
  const projectRoot = getProjectRoot();
  const usageServicePath = path.join(projectRoot, 'frontend/lib/services/blueprintUsageService.ts');
  
  if (!fs.existsSync(usageServicePath)) {
    return { error: "Blueprint usage service not found" };
  }

  const content = readFileContent(usageServicePath);
  
  const subscriptionSystem = {
    tiers: extractSubscriptionTiers(content),
    limits: extractLimitTypes(content),
    enforcement: extractLimitEnforcement(content),
    tracking: extractUsageTracking(content),
    exemptions: extractExemptionLogic(content)
  };

  return subscriptionSystem;
});

server.tool("trace_blueprint_lifecycle", {
  description: "Trace complete blueprint lifecycle from questionnaire to generation",
  inputSchema: {
    type: "object",
    properties: {}
  }
}, async () => {
  const projectRoot = getProjectRoot();
  
  const lifecycle = {
    phases: [
      {
        name: "Static Questionnaire",
        description: "User completes initial 3-section assessment",
        components: await findComponentsByFeature("questionnaire"),
        apiEndpoints: await listApiEndpoints({ route: "questionnaire" }),
        databaseTables: ["blueprint_generator", "user_profiles"]
      },
      {
        name: "Dynamic Question Generation",
        description: "AI generates personalized questions based on static answers",
        services: ["questionGenerationService", "claude"],
        apiEndpoints: await listApiEndpoints({ route: "generate-dynamic-questions" })
      },
      {
        name: "Dynamic Questionnaire",
        description: "User completes AI-generated questions",
        components: await findComponentsByFeature("questionnaire")
      },
      {
        name: "Blueprint Generation",
        description: "AI generates comprehensive learning blueprint",
        services: ["blueprintGenerationService", "claude"],
        apiEndpoints: await listApiEndpoints({ route: "blueprints" }),
        fallbackMechanism: "Claude Sonnet 4.5 → Claude Sonnet 4"
      },
      {
        name: "Export & Sharing",
        description: "User exports blueprint or creates shareable link",
        components: await findComponentsByFeature("blueprint")
      }
    ]
  };

  return lifecycle;
});

// Helper functions
function extractTableNames(sql: string): string[] {
  const matches = sql.match(/create table if not exists ([^\s]+)/gi);
  return matches ? matches.map(m => m.replace(/create table if not exists /i, '').trim()) : [];
}

function parseTableColumns(columnDef: string): any[] {
  const lines = columnDef.split('\n').map(line => line.trim()).filter(line => line && !line.startsWith('--'));
  const columns: any[] = [];
  
  for (const line of lines) {
    if (line.includes('primary key') || line.includes('foreign key') || line.includes('constraint')) continue;
    
    const match = line.match(/(\w+)\s+([^,\s]+(?:\([^)]+\))?)/);
    if (match) {
      columns.push({
        name: match[1],
        type: match[2],
        nullable: line.toLowerCase().includes('null'),
        default: line.includes('default') ? line.match(/default\s+([^,\s]+)/)?.[1] : null
      });
    }
  }
  
  return columns;
}

function parseTableConstraints(constraintDef: string): any[] {
  const constraints: any[] = [];
  const lines = constraintDef.split('\n').map(line => line.trim()).filter(line => line);
  
  for (const line of lines) {
    if (line.includes('primary key')) {
      constraints.push({ type: 'primary_key', definition: line });
    } else if (line.includes('foreign key')) {
      constraints.push({ type: 'foreign_key', definition: line });
    } else if (line.includes('check')) {
      constraints.push({ type: 'check', definition: line });
    }
  }
  
  return constraints;
}

function extractTableNameFromMigration(sql: string): string {
  const match = sql.match(/create table if not exists ([^\s]+)/i);
  return match ? match[1].trim() : '';
}

function extractExports(content: string): string[] {
  const exports: string[] = [];
  const matches = content.match(/export\s+(?:const|function|class|interface|type)\s+(\w+)/g);
  if (matches) {
    for (const match of matches) {
      const name = match.replace(/export\s+(?:const|function|class|interface|type)\s+/, '');
      exports.push(name);
    }
  }
  return exports;
}

function extractDependencies(content: string): string[] {
  const dependencies: string[] = [];
  const importMatches = content.match(/import\s+.*?\s+from\s+['"]([^'"]+)['"]/g);
  if (importMatches) {
    for (const match of importMatches) {
      const pathMatch = match.match(/from\s+['"]([^'"]+)['"]/);
      if (pathMatch) {
        dependencies.push(pathMatch[1]);
      }
    }
  }
  return dependencies;
}

function extractImports(content: string): string[] {
  const imports: string[] = [];
  const matches = content.match(/import\s+.*?\s+from\s+['"]([^'"]+)['"]/g);
  if (matches) {
    for (const match of matches) {
      const pathMatch = match.match(/from\s+['"]([^'"]+)['"]/);
      if (pathMatch) {
        imports.push(pathMatch[1]);
      }
    }
  }
  return imports;
}

function getServiceCategory(service: any): string {
  if (service.name.includes('Generation') || service.name.includes('Service')) return 'core';
  if (service.name.includes('Utils') || service.name.includes('Helper')) return 'utility';
  return 'integration';
}

function buildComponentHierarchy(dir: string, includeLayouts: boolean, maxDepth: number, currentDepth: number = 0): any {
  if (currentDepth >= maxDepth) return null;
  
  const items: any = {};
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    if (file.startsWith('.') || file === 'node_modules') continue;
    
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      const children = buildComponentHierarchy(filePath, includeLayouts, maxDepth, currentDepth + 1);
      if (children) {
        items[file] = { type: 'directory', children };
      }
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      if (!includeLayouts && file === 'layout.tsx') continue;
      
      items[file] = {
        type: 'file',
        description: extractComponentDescription(readFileContent(filePath))
      };
    }
  }
  
  return Object.keys(items).length > 0 ? items : null;
}

function categorizeComponentByPath(filePath: string): string | null {
  if (filePath.includes('auth') || filePath.includes('login') || filePath.includes('signup')) return 'auth';
  if (filePath.includes('blueprint') || filePath.includes('starmap')) return 'blueprint';
  if (filePath.includes('questionnaire') || filePath.includes('wizard')) return 'questionnaire';
  if (filePath.includes('dashboard') || filePath.includes('my-')) return 'dashboard';
  if (filePath.includes('pricing') || filePath.includes('subscription')) return 'pricing';
  if (filePath.includes('admin')) return 'admin';
  return null;
}

function extractComponentDescription(content: string): string {
  const match = content.match(/\/\*\*\s*\n\s*\*\s*(.+?)\s*\n/);
  return match ? match[1] : '';
}

function extractHTTPMethods(content: string): string[] {
  const methods: string[] = [];
  const methodMatches = content.match(/export\s+async\s+function\s+(GET|POST|PUT|DELETE|PATCH)\s*\(/g);
  if (methodMatches) {
    for (const match of methodMatches) {
      const method = match.match(/(GET|POST|PUT|DELETE|PATCH)/);
      if (method) methods.push(method[1]);
    }
  }
  return methods;
}

function extractAuthRequirements(content: string): any {
  const auth: any = {
    required: false,
    methods: [],
    roles: []
  };
  
  if (content.includes('auth.uid()') || content.includes('authenticated')) {
    auth.required = true;
  }
  
  if (content.includes('admin') || content.includes('role')) {
    auth.methods.push('role_based');
    const roleMatch = content.match(/role\s*=\s*['"]([^'"]+)['"]/);
    if (roleMatch) auth.roles.push(roleMatch[1]);
  }
  
  return auth;
}

function extractWorkflowSteps(content: string): any[] {
  const steps: any[] = [];
  const lines = content.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.includes('//') && (line.includes('Step') || line.includes('Phase'))) {
      steps.push({
        step: line.replace(/.*\/\//, '').trim(),
        line: i + 1
      });
    }
  }
  
  return steps;
}

function extractFallbackLogic(content: string): any {
  const fallback: any = {
    enabled: false,
    primary: null,
    fallback: null,
    trigger: null
  };
  
  if (content.includes('fallback') || content.includes('secondary')) {
    fallback.enabled = true;
    
    const primaryMatch = content.match(/primary[:\s]+['"]([^'"]+)['"]/);
    if (primaryMatch) fallback.primary = primaryMatch[1];
    
    const fallbackMatch = content.match(/fallback[:\s]+['"]([^'"]+)['"]/);
    if (fallbackMatch) fallback.fallback = fallbackMatch[1];
  }
  
  return fallback;
}

function extractErrorHandling(content: string): any[] {
  const errorHandling: any[] = [];
  const tryCatchMatches = content.match(/try\s*{[\s\S]*?}\s*catch\s*\([^)]*\)\s*{[\s\S]*?}/g);
  
  if (tryCatchMatches) {
    for (let i = 0; i < tryCatchMatches.length; i++) {
      errorHandling.push({
        type: 'try_catch',
        pattern: tryCatchMatches[i].substring(0, 100) + '...'
      });
    }
  }
  
  return errorHandling;
}

function extractValidationSteps(content: string): any[] {
  const validation: any[] = [];
  const lines = content.split('\n');
  
  for (const line of lines) {
    if (line.includes('validate') || line.includes('check')) {
      validation.push({
        step: line.trim(),
        type: line.includes('validate') ? 'validation' : 'check'
      });
    }
  }
  
  return validation;
}

function extractSubscriptionTiers(content: string): any[] {
  const tiers: any[] = [];
  const tierMatches = content.match(/tier[:\s]*['"]([^'"]+)['"]/gi);
  
  if (tierMatches) {
    for (const match of tierMatches) {
      const tier = match.match(/['"]([^'"]+)['"]/);
      if (tier) tiers.push({ name: tier[1] });
    }
  }
  
  return tiers;
}

function extractLimitTypes(content: string): any[] {
  const limits: any[] = [];
  const limitMatches = content.match(/limit[:\s]*['"]([^'"]+)['"]/gi);
  
  if (limitMatches) {
    for (const match of limitMatches) {
      const limit = match.match(/['"]([^'"]+)['"]/);
      if (limit) limits.push({ type: limit[1] });
    }
  }
  
  return limits;
}

function extractLimitEnforcement(content: string): any {
  const enforcement: any = {
    failClosed: false,
    methods: []
  };
  
  if (content.includes('FAIL-CLOSED') || content.includes('fail_closed')) {
    enforcement.failClosed = true;
  }
  
  const methodMatches = content.match(/(check_|increment_|can_)/gi);
  if (methodMatches) {
    enforcement.methods = [...new Set(methodMatches)];
  }
  
  return enforcement;
}

function extractUsageTracking(content: string): any {
  const tracking: any = {
    counters: [],
    metrics: [],
    storage: []
  };
  
  const counterMatches = content.match(/count[:\s]*['"]([^'"]+)['"]/gi);
  if (counterMatches) {
    for (const match of counterMatches) {
      const counter = match.match(/['"]([^'"]+)['"]/);
      if (counter) tracking.counters.push(counter[1]);
    }
  }
  
  return tracking;
}

function extractExemptionLogic(content: string): any {
  const exemption: any = {
    enabled: false,
    reasons: [],
    implementation: null
  };
  
  if (content.includes('exempt') || content.includes('exemption')) {
    exemption.enabled = true;
    
    const reasonMatches = content.match(/reason[:\s]*['"]([^'"]+)['"]/gi);
    if (reasonMatches) {
      for (const match of reasonMatches) {
        const reason = match.match(/['"]([^'"]+)['"]/);
        if (reason) exemption.reasons.push(reason[1]);
      }
    }
  }
  
  return exemption;
}

// Helper functions for async calls
async function findComponentsByFeature(feature: string) {
  const projectRoot = getProjectRoot();
  const appPath = path.join(projectRoot, 'frontend/app');
  const componentsPath = path.join(projectRoot, 'frontend/components');
  
  const featureComponents: any = {
    auth: [],
    blueprint: [],
    questionnaire: [],
    dashboard: [],
    pricing: [],
    admin: []
  };

  // Search in app directory
  const appFiles = await findFiles('**/*.{tsx,ts}', appPath);
  for (const filePath of appFiles) {
    const relativePath = path.relative(projectRoot, filePath);
    const category = categorizeComponentByPath(relativePath);
    if (category && featureComponents[category]) {
      featureComponents[category].push({
        path: relativePath,
        type: 'route',
        description: extractComponentDescription(readFileContent(filePath))
      });
    }
  }

  // Search in components directory
  const componentFiles = await findFiles('**/*.{tsx,ts}', componentsPath);
  for (const filePath of componentFiles) {
    const relativePath = path.relative(projectRoot, filePath);
    const category = categorizeComponentByPath(relativePath);
    if (category && featureComponents[category]) {
      featureComponents[category].push({
        path: relativePath,
        type: 'component',
        description: extractComponentDescription(readFileContent(filePath))
      });
    }
  }

  return feature === "all" ? featureComponents : { [feature]: featureComponents[feature] };
}

async function listApiEndpoints({ route }: { route?: string }) {
  const projectRoot = getProjectRoot();
  const apiPath = path.join(projectRoot, 'frontend/app/api');
  
  if (!fs.existsSync(apiPath)) {
    return { endpoints: [] };
  }

  const apiFiles = await findFiles('**/route.ts', apiPath);
  const endpoints: any[] = [];

  for (const filePath of apiFiles) {
    const relativePath = path.relative(projectRoot, filePath);
    const routePath = relativePath
      .replace('frontend/app/api/', '')
      .replace('/route.ts', '')
      .replace(/\[([^\]]+)\]/g, ':$1');

    if (!route || routePath.includes(route)) {
      const content = readFileContent(filePath);
      const methods = extractHTTPMethods(content);
      
      endpoints.push({
        path: `/${routePath}`,
        methods,
        file: relativePath,
        description: extractComponentDescription(content),
        auth: extractAuthRequirements(content)
      });
    }
  }

  return { endpoints };
}

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Codebase Understanding MCP server running on stdio');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});