import process from 'node:process';

import { z } from 'zod/v4';

const envSchema = z
  .object({
    BETTER_AUTH_SECRET: z.string(),
    BETTER_AUTH_URL: z.string().optional(),
    DATABASE_URL: z.string(),
    NODE_ENV: z.string().default('development'),
    API_PORT: z
      .string()
      .default('3000')
      .transform((v) => Number.parseInt(v, 10)),
    SOCIAL_LOGIN_ENABLED: z.boolean().default(false),
    TRUSTED_ORIGINS: z.string().default('*'),
    RATE_LIMIT_WINDOW_MS: z
      .string()
      .default('60000')
      .transform((v) => Number.parseInt(v, 10)),
    RATE_LIMIT_MAX: z
      .string()
      .default('20')
      .transform((v) => Number.parseInt(v, 10)),
  })
  .superRefine((data, ctx) => {
    if (data.NODE_ENV === 'production' && !data.DATABASE_URL) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'DATABASE_URL is required in production',
        path: ['DATABASE_URL'],
      });
    }
  });

const parsedConfig = envSchema.parse(process.env);

const appConfig = {
  ...parsedConfig,
  BETTER_AUTH_URL:
    parsedConfig.BETTER_AUTH_URL ??
    `http://localhost:${parsedConfig.API_PORT}/api/auth`,
  TRUSTED_ORIGINS: parsedConfig.TRUSTED_ORIGINS.includes(',')
    ? parsedConfig.TRUSTED_ORIGINS.split(',').map((origin) => origin.trim())
    : [parsedConfig.TRUSTED_ORIGINS],
};

type Config = typeof appConfig;

export const config: Config = appConfig;
