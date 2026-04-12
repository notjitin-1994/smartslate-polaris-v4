import { getSafeServerClient } from './registry';

/**
 * Legacy wrapper for getSafeServerClient to maintain import compatibility.
 */
export async function createClient() {
  return getSafeServerClient();
}
