import { getSafeBrowserClient } from './client-registry';

/**
 * Legacy wrapper for getSafeBrowserClient to maintain import compatibility.
 */
export function createClient() {
  return getSafeBrowserClient();
}
