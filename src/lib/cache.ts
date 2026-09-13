type CacheEntry = {
  value: unknown;
  expiresAt: number;
  tags: string[];
};

const store = new Map<string, CacheEntry>();

/**
 * Process-local cache for per-tutor read queries. Keys must include the
 * tutor's id (or another value scoped to them) — this cache has no RLS of
 * its own, it just remembers what a prior request already fetched.
 */
export async function cached<T>(
  key: string,
  tags: string[],
  ttlMs: number,
  fetcher: () => Promise<T>,
): Promise<T> {
  const now = Date.now();
  const hit = store.get(key);
  if (hit && hit.expiresAt > now) return hit.value as T;

  const value = await fetcher();
  store.set(key, { value, expiresAt: now + ttlMs, tags });
  return value;
}

/** Drops every cache entry carrying any of the given tags, e.g. after a mutation. */
export function invalidateTags(tags: string[]) {
  for (const [key, entry] of store) {
    if (entry.tags.some((tag) => tags.includes(tag))) store.delete(key);
  }
}
