import { cookies } from 'next/headers';
import { createServerClient, CookieOptions } from '@supabase/ssr';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createServiceLogger } from '@/lib/logging';

const logger = createServiceLogger('database');

/**
 * Returns a Supabase server client configured for SSR using Next.js cookies().
 */
export async function getSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({
            name,
            value,
            httpOnly: options.httpOnly,
            sameSite: options.sameSite,
            secure: options.secure,
            path: options.path,
            maxAge: options.maxAge,
            domain: options.domain,
            expires: options.expires,
          });
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({
            name,
            value: '',
            httpOnly: options.httpOnly,
            sameSite: options.sameSite,
            secure: options.secure,
            path: options.path,
            maxAge: 0,
            domain: options.domain,
            expires: new Date(0),
          });
        },
      },
    }
  );
}

/**
 * Returns a Supabase server client with automatic query logging
 * Use this instead of getSupabaseServerClient() for comprehensive logging
 */
export async function getSupabaseServerClientWithLogging(): Promise<SupabaseClient<Database>> {
  const client = await getSupabaseServerClient();

  // Wrap the from() method to log all queries
  const originalFrom = client.from.bind(client);

  client.from = (table: any) => {
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
 * Returns a Supabase admin client with service role key that bypasses RLS.
 * WARNING: Only use this for admin operations where you need to access all data.
 * This client has elevated privileges and should NEVER be exposed to the client side.
 */
export function getSupabaseAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('Missing Supabase admin credentials');
  }

  return createSupabaseClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function getServerSession() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();
  if (error) return { session: null, error } as const;
  return { session, error: null as null } as const;
}

// Alias for backward compatibility
export const createClient = getSupabaseServerClient;

// Recommended: Use logged version for comprehensive monitoring
export const createClientWithLogging = getSupabaseServerClientWithLogging;
