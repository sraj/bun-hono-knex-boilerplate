import type { MiddlewareHandler } from 'hono';
import { HTTPException } from 'hono/http-exception';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

function createStore() {
  const store = new Map<string, RateLimitEntry>();
  const interval = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
      if (entry.resetAt < now) store.delete(key);
    }
  }, 60_000);
  if (typeof interval.unref === 'function') interval.unref();
  return store;
}

export function rateLimiter(opts: {
  windowMs: number;
  max: number;
}): MiddlewareHandler {
  const store = createStore();

  return async (c, next) => {
    const ip =
      c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ??
      c.req.header('x-real-ip') ??
      'unknown';
    const now = Date.now();
    const entry = store.get(ip);

    if (!entry || entry.resetAt < now) {
      store.set(ip, { count: 1, resetAt: now + opts.windowMs });
      return next();
    }

    entry.count++;
    if (entry.count > opts.max) {
      throw new HTTPException(429, { message: 'Too many requests' });
    }

    return next();
  };
}
