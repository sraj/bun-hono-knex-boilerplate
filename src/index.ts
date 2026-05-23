import process from 'node:process';

import bun from 'bun';

import { config } from './shared/config';
import { app, checkDatabaseConnection } from './server';
import { db, pool } from './shared/database';
import cleanStack from './shared/error/cleanStack';
import { logger } from './shared/logger';

const server = bun.serve({
  port: config.API_PORT,
  fetch: app.fetch,
});

logger.info(`Server running at http://localhost:${config.API_PORT}`);

checkDatabaseConnection();

process.on('unhandledRejection', (reason: unknown) => {
  if (reason instanceof Error) {
    logger.error(
      {
        message: reason.message,
        stack: cleanStack(reason.stack),
      },
      'unhandledRejection',
    );
  } else if (typeof reason === 'string') {
    logger.error(
      {
        message: reason,
      },
      'unhandledRejection',
    );
  }
});

process.on('uncaughtException', (error: Error) => {
  logger.error(
    {
      message: error.message,
      stack: cleanStack(error.stack),
    },
    'uncaughtException',
  );
  process.exit(1);
});

function shutdown(signal: string) {
  logger.info({ signal }, 'Shutting down gracefully...');
  server.stop();
  db.destroy()
    .then(() => pool.end())
    .then(() => {
      logger.info('Shutdown complete.');
      process.exit(0);
    })
    .catch((err) => {
      logger.error({ err }, 'Error during shutdown');
      process.exit(1);
    });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
