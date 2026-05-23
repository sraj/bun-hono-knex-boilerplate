import pg from 'pg';

import { config } from '../shared/config';
import { db } from '../infra/db/knex';

import { logger } from './logger';

const pool = new pg.Pool({ connectionString: config.DATABASE_URL });

pool.on('error', (err) => {
  logger.error({ err }, 'Unexpected database pool error');
});

export { db, pool };
