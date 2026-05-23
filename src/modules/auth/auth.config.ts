import { kyselyAdapter } from '@better-auth/kysely-adapter';
import { betterAuth } from 'better-auth';
import { Kysely, PostgresDialect } from 'kysely';

import { config } from '../../shared/config';
import { pool } from '../../shared/database';

const dialect = new PostgresDialect({ pool });
const kyselyDb = new Kysely<Record<string, never>>({ dialect });

export const auth = betterAuth({
  database: kyselyAdapter(kyselyDb, {
    type: 'postgres',
  }),
  trustedOrigins: config.TRUSTED_ORIGINS,
  emailAndPassword: {
    enabled: true,
  },
  advanced: {
    defaultCookieAttributes: {
      httpOnly: true,
      secure: true,
    },
    useSecureCookies: true,
    disableCSRFCheck: true,
  },
  user: {
    modelName: 'user',
  },
  account: {
    modelName: 'account',
    fields: {
      userId: 'userId',
    },
    accountLinking: {
      enabled: true,
      trustedProviders: ['google', 'github', 'email-password'],
      allowDifferentEmails: false,
    },
  },
  session: {
    modelName: 'session',
    fields: {
      userId: 'userId',
    },
    expiresIn: 604800,
    updateAge: 86400,
    disableSessionRefresh: true,
    storeSessionInDatabase: true,
    preserveSessionInDatabase: false,
    cookieCache: {
      enabled: false,
      maxAge: 300,
    },
  },
});
