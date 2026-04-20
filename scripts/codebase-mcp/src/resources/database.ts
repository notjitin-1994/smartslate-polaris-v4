import { readFileCached } from '../utils/file-reader.js';
import { join } from 'path';
import { readdirSync, existsSync } from 'fs';

/**
 * Get database schema from migrations
 */
export function getDatabaseSchema(projectRoot: string): string {
  const migrationsDir = join(projectRoot, 'supabase', 'migrations');

  if (!existsSync(migrationsDir)) {
    return 'No migrations directory found.';
  }

  try {
    const migrations = readdirSync(migrationsDir)
      .filter((file) => file.endsWith('.sql'))
      .sort();

    if (migrations.length === 0) {
      return 'No migration files found.';
    }

    // Read the most recent migrations to get current schema
    const recentMigrations = migrations.slice(-5); // Last 5 migrations

    let schemaContent = '# Database Schema (from recent migrations)\n\n';

    for (const migration of recentMigrations) {
      const filePath = join(migrationsDir, migration);
      const content = readFileCached(filePath);

      schemaContent += `## Migration: ${migration}\n\n`;
      schemaContent += '```sql\n';
      schemaContent += content;
      schemaContent += '\n```\n\n';
    }

    return schemaContent;
  } catch (error) {
    return `Error reading migrations: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
}

/**
 * Extract table information from migration files
 */
export function listDatabaseTables(projectRoot: string): string[] {
  const migrationsDir = join(projectRoot, 'supabase', 'migrations');

  if (!existsSync(migrationsDir)) {
    return [];
  }

  const tables = new Set<string>();

  try {
    const migrations = readdirSync(migrationsDir)
      .filter((file) => file.endsWith('.sql'))
      .sort();

    for (const migration of migrations) {
      const filePath = join(migrationsDir, migration);
      const content = readFileCached(filePath);

      // Extract table names from CREATE TABLE statements
      const createTableMatches = content.matchAll(
        /CREATE TABLE\s+(?:IF NOT EXISTS\s+)?(?:public\.)?(\w+)/gi
      );

      for (const match of createTableMatches) {
        tables.add(match[1]);
      }
    }
  } catch (error) {
    // Silently handle errors
  }

  return Array.from(tables).sort();
}

/**
 * Get RLS policies overview
 */
export function getRLSPolicies(projectRoot: string): string {
  const migrationsDir = join(projectRoot, 'supabase', 'migrations');

  if (!existsSync(migrationsDir)) {
    return 'No migrations directory found.';
  }

  try {
    const migrations = readdirSync(migrationsDir)
      .filter((file) => file.endsWith('.sql'))
      .sort();

    let rlsContent = '# Row Level Security (RLS) Policies\n\n';
    let foundPolicies = false;

    for (const migration of migrations) {
      const filePath = join(migrationsDir, migration);
      const content = readFileCached(filePath);

      // Extract RLS-related statements
      const rlsStatements = [];

      // ALTER TABLE ... ENABLE ROW LEVEL SECURITY
      const enableRLS = content.matchAll(
        /ALTER TABLE\s+(?:public\.)?(\w+)\s+ENABLE ROW LEVEL SECURITY/gi
      );
      for (const match of enableRLS) {
        rlsStatements.push(`- Table \`${match[1]}\`: RLS enabled`);
      }

      // CREATE POLICY statements
      const policies = content.matchAll(
        /CREATE POLICY\s+"([^"]+)"\s+ON\s+(?:public\.)?(\w+)/gi
      );
      for (const match of policies) {
        rlsStatements.push(`- Policy \`${match[1]}\` on table \`${match[2]}\``);
      }

      if (rlsStatements.length > 0) {
        foundPolicies = true;
        rlsContent += `## ${migration}\n\n`;
        rlsContent += rlsStatements.join('\n') + '\n\n';
      }
    }

    if (!foundPolicies) {
      return 'No RLS policies found in migrations.';
    }

    return rlsContent;
  } catch (error) {
    return `Error reading RLS policies: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
}

/**
 * Get key database tables info
 */
export function getKeyTablesInfo(): string {
  return `# Key Database Tables

## blueprint_generator
Primary table for all questionnaire and blueprint data:
- \`static_answers\` (JSONB) - Phase 1 questionnaire responses
- \`dynamic_questions\` (JSONB) - AI-generated dynamic questions
- \`dynamic_answers\` (JSONB) - Phase 2 questionnaire responses
- \`blueprint_json\` (JSONB) - Generated blueprint content
- \`blueprint_markdown\` (TEXT) - Markdown version of blueprint
- \`status\` - Workflow state: 'draft' | 'generating' | 'completed' | 'error'

## user_profiles
Subscription and usage tracking:
- \`subscription_tier\` - Tier level (explorer/navigator/voyager/etc.)
- \`user_role\` - Permission level matching tier
- \`blueprint_creation_count\` - Usage counter for creating blueprints
- \`blueprint_saving_count\` - Usage counter for saving blueprints
- \`blueprint_creation_limit\` - Tier-based limit for creations
- \`blueprint_saving_limit\` - Tier-based limit for saves
- \`usage_metadata\` (JSONB) - Additional flexible usage data

## Security
All tables use Row Level Security (RLS) policies to enforce data isolation.
Users can only access their own data through auth.uid() checks.
`;
}
