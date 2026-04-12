import { getSafeAdminClient } from './registry';

/**
 * Legacy wrapper for getSafeAdminClient to maintain import compatibility.
 */
export function createAdminClient() {
  return getSafeAdminClient();
}
