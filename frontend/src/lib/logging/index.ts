/**
 * Logging Module Exports
 */

import { getLogger as getLoggerInternal } from './logger';
import type { LogService } from './types';

export { getLogger, logger } from './logger';
export { LogStore } from './logStore';
export { clientErrorTracker } from './clientErrorTracker';
export * from './types';

// Convenience function to create a logger for a specific service
export function createServiceLogger(service: LogService) {
  return getLoggerInternal(service);
}
