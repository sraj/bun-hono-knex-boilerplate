import type { MiddlewareHandler } from 'hono';

declare module 'hono' {
  interface ContextVariableMap {
    requestId: string;
  }
}

export function requestId(): MiddlewareHandler {
  return async (c, next) => {
    const id = c.req.header('X-Request-Id') ?? crypto.randomUUID();
    c.set('requestId', id);
    await next();
    c.res.headers.set('X-Request-Id', id);
  };
}
