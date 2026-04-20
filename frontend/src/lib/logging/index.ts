/**
 * Logging Module Exports
 */

import { getLogger as getLoggerInternal } from './logger';

export { getLogger, logger } from './logger';
export { LogStore } from './logStore';
export * from './types';

// Convenience function to create a logger for a specific service
export function createServiceLogger(service: import('./types').LogService) {
  return getLoggerInternal(service);
}
