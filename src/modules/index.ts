import { Hono } from 'hono';

import { AuthError, AuthErrorType } from '../shared/error/authError';

import { auth } from './auth/auth.config';
import authRouter from './auth/auth.routes';
import type { AuthType } from './auth/auth.types';
import commentRouter from './comment/comment.routes';
import healthRouter from './health/health.routes';
import postRouter from './post/post.routes';

const router = new Hono<{ Variables: AuthType }>({ strict: false });

router.route('/health', healthRouter);
router.route('/auth', authRouter);

// Session middleware - fetches session from cookies/headers for all subsequent routes
router.use(async (c, next) => {
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  });
  if (session) {
    c.set('user', session.user);
    c.set('session', session.session);
  }
  await next();
});

// Authentication middleware - protects all routes below
router.use(async (c, next) => {
  const session = c.get('session');
  if (!session) {
    throw new AuthError(AuthErrorType.UNAUTHORIZED);
  }
  await next();
});

router.route('/post', postRouter);
router.route('/comment', commentRouter);

export default router;
