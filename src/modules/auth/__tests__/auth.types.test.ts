import { describe, expect, it } from 'bun:test';
import type { Context } from 'hono';

import type { AuthType } from '../auth.types';
import { getUserFromContext, getSessionFromContext } from '../auth.types';

function mockContext(overrides?: {
  user?: AuthType['user'];
  session?: AuthType['session'];
}): Context<{ Variables: AuthType }> {
  const store: Record<string, unknown> = {};
  if (overrides?.user) store.user = overrides.user;
  if (overrides?.session) store.session = overrides.session;
  return { get: (key: string) => store[key] } as unknown as Context<{
    Variables: AuthType;
  }>;
}

const mockUser: NonNullable<AuthType['user']> = {
  id: '1',
  name: 'Test',
  email: 'test@test.com',
  emailVerified: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('getUserFromContext', () => {
  it('should return user when set', () => {
    const c = mockContext({ user: mockUser });
    expect(getUserFromContext(c)).toEqual(mockUser);
  });

  it('should throw when user is null', () => {
    const c = mockContext();
    expect(() => getUserFromContext(c)).toThrow('Unauthorized');
  });
});

describe('getSessionFromContext', () => {
  it('should throw when session is null', () => {
    const c = mockContext();
    expect(() => getSessionFromContext(c)).toThrow('Unauthorized');
  });
});
