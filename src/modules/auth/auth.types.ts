import type { Context } from 'hono';

import { AuthError, AuthErrorType } from '../../shared/error/authError';

import type { auth } from './auth.config';

export type AuthType = {
  user: typeof auth.$Infer.Session.user | null;
  session: typeof auth.$Infer.Session.session | null;
};

export const getUserFromContext = (c: Context<{ Variables: AuthType }>) => {
  const user = c.get('user');
  if (!user) {
    throw new AuthError(AuthErrorType.UNAUTHORIZED);
  }
  return user;
};

export const getSessionFromContext = (c: Context<{ Variables: AuthType }>) => {
  const session = c.get('session');
  if (!session) {
    throw new AuthError(AuthErrorType.UNAUTHORIZED);
  }
  return session;
};
