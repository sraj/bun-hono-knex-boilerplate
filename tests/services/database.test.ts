import { beforeAll, describe, expect, it } from 'bun:test';

import { db } from '../../src/shared/database';

describe('Database tests', () => {
  beforeAll(async () => {
    await db.raw('SELECT 1');
  });

  it('should connect to the database', async () => {
    const users = await db('user').select('*');
    expect(Array.isArray(users)).toBe(true);
  });
});
