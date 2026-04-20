/**
 * Next.js Instrumentation Hook
 *
 * This file is automatically called by Next.js when the server starts.
 * It's the perfect place to validate environment variables and initialize logging.
 *
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

import { validateEnvironmentOrExit } from './lib/utils/environmentValidation';

/**
 * Register function called once when Next.js initializes
 * Validates required environment variables and exits if validation fails
 * Initializes comprehensive logging system
 */
export async function register() {
  // Only run on server-side
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    console.log('\n🔍 Validating environment variables...\n');

    // Validate environment or exit with detailed error message
    validateEnvironmentOrExit();

    console.log('\n✅ Application startup validation complete\n');

    // Initialize logging system
    console.log('📝 Initializing comprehensive logging system...\n');

    try {
      // Import logger and persistence worker
      const { logger } = await import('@/lib/logging');
      const { startLogPersistence, isLogPersistenceRunning } = await import(
        '@/lib/logging/dbPersistence'
      );

      // Start database persistence worker if not already running
      if (!isLogPersistenceRunning()) {
        console.log('[Logging] Starting database persistence worker...');
        startLogPersistence(logger.getStore());
        console.log('[Logging] Database persistence worker started (flush every 10s)');
      } else {
        console.log('[Logging] Database persistence worker already running');
      }

      // Initialize global error handlers
      const { initializeGlobalErrorHandlers } = await import('@/lib/logging/globalErrorHandlers');
      initializeGlobalErrorHandlers();

      // Log successful initialization
      logger.info('system.startup', 'Smartslate Polaris server initialized', {
        nodeVersion: process.version,
        platform: process.platform,
        env: process.env.NODE_ENV,
        runtime: process.env.NEXT_RUNTIME,
      });

      console.log('✅ Logging system initialized successfully\n');
    } catch (error) {
      console.error('❌ Failed to initialize logging system:', error);
      // Don't exit - logging failure shouldn't prevent app from running
    }
  }
}
