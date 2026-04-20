type CacheValue<T> = { value: T; expiresAt: number };

export class MemoryCache<T = unknown> {
  private store = new Map<string, CacheValue<T>>();

  constructor(private readonly defaultTtlMs = 15 * 60 * 1000) {}

  get(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value;
  }

  set(key: string, value: T, ttlMs = this.defaultTtlMs): void {
    this.store.set(key, { value, expiresAt: Date.now() + ttlMs });
  }
}

export function createCacheKey(input: unknown): string {
  return JSON.stringify(input);
}
