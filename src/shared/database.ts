import pg from 'pg';

import { db } from '../infra/db/knex';

import { config } from './config';
import { logger } from './logger';

const pool = new pg.Pool({ connectionString: config.DATABASE_URL });

pool.on('error', (err: Error) => {
  logger.error({ err }, 'Unexpected database pool error');
});

export { db, pool };
