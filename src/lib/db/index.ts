import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

function createDb() {
  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

  if (!connectionString) {
    throw new Error('DATABASE_URL or POSTGRES_URL environment variable is required');
  }

  const client = postgres(connectionString, { prepare: false });
  return drizzle(client, { schema });
}

// Lazy initialization to avoid build-time errors
let _db: ReturnType<typeof createDb> | null = null;

export function getDb() {
  if (!_db) {
    _db = createDb();
  }
  return _db;
}

// Export a db instance for convenience (lazily initialized)
export const db = new Proxy({} as ReturnType<typeof createDb>, {
  get(target, prop) {
    return getDb()[prop as keyof ReturnType<typeof createDb>];
  },
});
