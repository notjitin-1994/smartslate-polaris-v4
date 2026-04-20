/**
 * Supabase Server Client with Automatic Logging
 * Wraps all database queries with comprehensive logging
 */

import { createClient } from './server';
import { createServiceLogger } from '@/lib/logging';
import type { SupabaseClient } from '@supabase/supabase-js';

const logger = createServiceLogger('database');

/**
 * Creates a Supabase client with automatic query logging
 * Logs all SELECT, INSERT, UPDATE, DELETE operations with duration and results
 */
export async function createClientWithLogging(): Promise<SupabaseClient> {
  const client = await createClient();

  // Wrap the from() method to log all queries
  const originalFrom = client.from.bind(client);

  client.from = (table: string) => {
    const builder = originalFrom(table);
    const startTime = Date.now();

    // Wrap query execution methods
    const originalSelect = builder.select.bind(builder);
    const originalInsert = builder.insert.bind(builder);
    const originalUpdate = builder.update.bind(builder);
    const originalDelete = builder.delete.bind(builder);
    const originalUpsert = builder.upsert.bind(builder);

    // Log SELECT queries
    builder.select = (...args: any[]) => {
      const query = originalSelect(...args);
      const originalThen = query.then.bind(query);

      query.then = (onFulfilled?: any, onRejected?: any) => {
        return originalThen(
          (result: any) => {
            const duration = Date.now() - startTime;
            logger.info('database.query.success', `SELECT from ${table}`, {
              table,
              operation: 'SELECT',
              duration,
              rowCount: result.data?.length || 0,
              hasError: !!result.error,
            });

            if (result.error) {
              logger.error('database.query.failure', `SELECT from ${table} failed`, {
                table,
                operation: 'SELECT',
                duration,
                error: result.error.message,
                errorCode: result.error.code,
              });
            }

            return onFulfilled ? onFulfilled(result) : result;
          },
          (error: any) => {
            const duration = Date.now() - startTime;
            logger.error('database.query.failure', `SELECT from ${table} failed`, {
              table,
              operation: 'SELECT',
              duration,
              error: error.message || String(error),
            });
            return onRejected ? onRejected(error) : Promise.reject(error);
          }
        );
      };

      return query;
    };

    // Log INSERT queries
    builder.insert = (values: any, options?: any) => {
      const query = originalInsert(values, options);
      const originalThen = query.then.bind(query);

      query.then = (onFulfilled?: any, onRejected?: any) => {
        return originalThen(
          (result: any) => {
            const duration = Date.now() - startTime;
            const rowCount = Array.isArray(values) ? values.length : 1;

            logger.info('database.save.success', `INSERT into ${table}`, {
              table,
              operation: 'INSERT',
              duration,
              rowCount,
              hasError: !!result.error,
            });

            if (result.error) {
              logger.error('database.save.failure', `INSERT into ${table} failed`, {
                table,
                operation: 'INSERT',
                duration,
                rowCount,
                error: result.error.message,
                errorCode: result.error.code,
              });
            }

            return onFulfilled ? onFulfilled(result) : result;
          },
          (error: any) => {
            const duration = Date.now() - startTime;
            logger.error('database.save.failure', `INSERT into ${table} failed`, {
              table,
              operation: 'INSERT',
              duration,
              error: error.message || String(error),
            });
            return onRejected ? onRejected(error) : Promise.reject(error);
          }
        );
      };

      return query;
    };

    // Log UPDATE queries
    builder.update = (values: any, options?: any) => {
      const query = originalUpdate(values, options);
      const originalThen = query.then.bind(query);

      query.then = (onFulfilled?: any, onRejected?: any) => {
        return originalThen(
          (result: any) => {
            const duration = Date.now() - startTime;

            logger.info('database.save.success', `UPDATE ${table}`, {
              table,
              operation: 'UPDATE',
              duration,
              rowCount: result.data?.length || 0,
              hasError: !!result.error,
            });

            if (result.error) {
              logger.error('database.save.failure', `UPDATE ${table} failed`, {
                table,
                operation: 'UPDATE',
                duration,
                error: result.error.message,
                errorCode: result.error.code,
              });
            }

            return onFulfilled ? onFulfilled(result) : result;
          },
          (error: any) => {
            const duration = Date.now() - startTime;
            logger.error('database.save.failure', `UPDATE ${table} failed`, {
              table,
              operation: 'UPDATE',
              duration,
              error: error.message || String(error),
            });
            return onRejected ? onRejected(error) : Promise.reject(error);
          }
        );
      };

      return query;
    };

    // Log DELETE queries
    builder.delete = (options?: any) => {
      const query = originalDelete(options);
      const originalThen = query.then.bind(query);

      query.then = (onFulfilled?: any, onRejected?: any) => {
        return originalThen(
          (result: any) => {
            const duration = Date.now() - startTime;

            logger.info('database.query.success', `DELETE from ${table}`, {
              table,
              operation: 'DELETE',
              duration,
              rowCount: result.data?.length || 0,
              hasError: !!result.error,
            });

            if (result.error) {
              logger.error('database.query.failure', `DELETE from ${table} failed`, {
                table,
                operation: 'DELETE',
                duration,
                error: result.error.message,
                errorCode: result.error.code,
              });
            }

            return onFulfilled ? onFulfilled(result) : result;
          },
          (error: any) => {
            const duration = Date.now() - startTime;
            logger.error('database.query.failure', `DELETE from ${table} failed`, {
              table,
              operation: 'DELETE',
              duration,
              error: error.message || String(error),
            });
            return onRejected ? onRejected(error) : Promise.reject(error);
          }
        );
      };

      return query;
    };

    // Log UPSERT queries
    builder.upsert = (values: any, options?: any) => {
      const query = originalUpsert(values, options);
      const originalThen = query.then.bind(query);

      query.then = (onFulfilled?: any, onRejected?: any) => {
        return originalThen(
          (result: any) => {
            const duration = Date.now() - startTime;
            const rowCount = Array.isArray(values) ? values.length : 1;

            logger.info('database.save.success', `UPSERT into ${table}`, {
              table,
              operation: 'UPSERT',
              duration,
              rowCount,
              hasError: !!result.error,
            });

            if (result.error) {
              logger.error('database.save.failure', `UPSERT into ${table} failed`, {
                table,
                operation: 'UPSERT',
                duration,
                rowCount,
                error: result.error.message,
                errorCode: result.error.code,
              });
            }

            return onFulfilled ? onFulfilled(result) : result;
          },
          (error: any) => {
            const duration = Date.now() - startTime;
            logger.error('database.save.failure', `UPSERT into ${table} failed`, {
              table,
              operation: 'UPSERT',
              duration,
              error: error.message || String(error),
            });
            return onRejected ? onRejected(error) : Promise.reject(error);
          }
        );
      };

      return query;
    };

    return builder;
  };

  return client;
}

/**
 * Helper function to create a logged Supabase client
 * Use this instead of createClient() to get automatic logging
 */
export const getSupabaseWithLogging = createClientWithLogging;
