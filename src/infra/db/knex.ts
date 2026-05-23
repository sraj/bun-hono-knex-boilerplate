import knexLib from 'knex';

import { config } from '../../shared/config';

export const db = knexLib({
  client: 'pg',
  connection: config.DATABASE_URL,
  pool: { min: 2, max: 10 },
  migrations: {
    tableName: 'knex_migrations',
    directory: './src/infra/db/migrations',
  },
});
