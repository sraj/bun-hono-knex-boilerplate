import { existsSync, readFileSync } from 'node:fs';

import { swaggerUI } from '@hono/swagger-ui';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { secureHeaders } from 'hono/secure-headers';
import { trimTrailingSlash } from 'hono/trailing-slash';

import modulesRouter from './modules';
import { config } from './shared/config';
import { routingErrorHandler } from './shared/error/routingErrorHandler';
import { logger } from './shared/logger';
import { requestId } from './shared/middleware/requestId';
import { requestLogger } from './shared/middleware/requestLogger';

let openapiSpec: Record<string, unknown> | undefined;
const specPath = './docs/openapi.json';
if (existsSync(specPath)) {
  openapiSpec = JSON.parse(readFileSync(specPath, 'utf-8'));
}

export const app = new Hono({ strict: true });

app.use(trimTrailingSlash());
app.use('*', requestId());
app.use('*', requestLogger());
app.use(
  secureHeaders({
    contentSecurityPolicy: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
    },
  }),
);

const corsOrigin =
  config.TRUSTED_ORIGINS.length === 1 && config.TRUSTED_ORIGINS[0] === '*'
    ? '*'
    : config.TRUSTED_ORIGINS;

app.use(
  '*',
  cors({
    origin: corsOrigin,
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowHeaders: ['Authorization', 'Content-Type'],
    maxAge: 600,
  }),
);

app.get('/', (c) =>
  c.text(
    'The server is running!\nYou can access the API at /api.\nThe documentation is available at /docs.',
  ),
);

app.route('/api', modulesRouter);

app.get(
  '/docs',
  swaggerUI({
    url: '/docs/openapi.json',
    spec: openapiSpec,
  }),
);

app.get('/docs/openapi.json', (c) => {
  if (!openapiSpec) {
    return c.json(
      { message: 'OpenAPI spec not found. Run `bun run openapi` first.' },
      404,
    );
  }
  return c.json(openapiSpec);
});

app.onError((err, c) => {
  return routingErrorHandler(err, c);
});

export async function checkDatabaseConnection(): Promise<void> {
  try {
    const { db } = await import('./shared/database');
    await db.raw('SELECT 1');
    logger.info('Database connection established');
  } catch (error) {
    logger.error({ error }, 'Database connection failed');
    process.exit(1);
  }
}
