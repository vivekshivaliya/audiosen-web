type Bucket = {
  count: number;
  resetAt: number;
};

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 5;
const buckets = new Map<string, Bucket>();

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
  const windowMs = options.windowMs ?? WINDOW_MS;
  const maxRequests = options.maxRequests ?? MAX_REQUESTS;
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }

  if (existing.count >= maxRequests) {
    return true;
  }

  existing.count += 1;
  buckets.set(key, existing);
  return false;
}
