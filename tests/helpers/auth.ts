import { app } from '../../src/server';

export type AuthSession = {
  cookie: string;
  userId: string;
};

export async function signUpAndGetCookie(): Promise<AuthSession> {
  const email = `test-${Date.now()}-${Math.random()}@example.com`;
  const password = 'test-password-123';

  const response = await app.request('/api/auth/sign-up/email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name: 'Test User' }),
  });

  const body = (await response.json()) as { user: { id: string } };

  const cookie = response.headers.get('set-cookie')?.split(';')[0] ?? '';

  return { cookie, userId: body.user.id };
}

export function authHeaders(cookie: string): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    Cookie: cookie,
  };
}
