import process from 'node:process';

import pino from 'pino';

const logFormat =
  process.env.LOG_FORMAT ?? (process.stdout.isTTY ? 'pretty' : 'json');

export const logger = pino({
  ...(logFormat === 'pretty'
    ? {
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: true,
          },
        },
      }
    : {}),
});
