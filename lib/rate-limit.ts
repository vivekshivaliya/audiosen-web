type Bucket = {
  count: number;
  resetAt: number;
};

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 5;
const MAX_BUCKETS = 10_000;
const buckets = new Map<string, Bucket>();
let operationsSincePrune = 0;

type RateLimitOptions = {
  windowMs?: number;
  maxRequests?: number;
};

export function getClientKey(ip: string | null | undefined): string {
  if (!ip) return "unknown";
  return ip.split(",")[0]?.trim() || "unknown";
}

export function getNamespacedClientKey(namespace: string, key: string): string {
  return `${namespace}:${key}`;
}

export function isRateLimited(key: string, options: RateLimitOptions = {}): boolean {
  return consumeRateLimit(key, options).limited;
}

export type RateLimitResult = {
  limited: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

function pruneExpiredBuckets(now: number): void {
  operationsSincePrune += 1;
  if (operationsSincePrune < 100 && buckets.size < MAX_BUCKETS) return;
  operationsSincePrune = 0;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

function enforceBucketBound(): void {
  while (buckets.size >= MAX_BUCKETS) {
    const oldestKey = buckets.keys().next().value as string | undefined;
    if (!oldestKey) break;
    buckets.delete(oldestKey);
  }
}

export function consumeRateLimit(
  key: string,
  options: RateLimitOptions = {},
): RateLimitResult {
  const windowMs = options.windowMs ?? WINDOW_MS;
  const maxRequests = options.maxRequests ?? MAX_REQUESTS;
  const now = Date.now();
  pruneExpiredBuckets(now);
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    if (!existing) enforceBucketBound();
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return {
      limited: false,
      remaining: Math.max(0, maxRequests - 1),
      retryAfterSeconds: Math.ceil(windowMs / 1000),
    };
  }

  if (existing.count >= maxRequests) {
    return {
      limited: true,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }

  existing.count += 1;
  buckets.set(key, existing);
  return {
    limited: false,
    remaining: Math.max(0, maxRequests - existing.count),
    retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
  };
}
