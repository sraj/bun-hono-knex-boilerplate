import { type Context, Hono } from 'hono';

import { rateLimiter } from '../../shared/middleware/rateLimiter';

import { auth } from './auth.config';
import type { AuthType } from './auth.types';

const router = new Hono<{ Bindings: AuthType }>({
  strict: false,
});

router.use('/sign-in/email', rateLimiter({ windowMs: 60_000, max: 5 }));

router.on(['POST', 'GET'], '/*', (c: Context) => {
  return auth.handler(c.req.raw);
});

export default router;
