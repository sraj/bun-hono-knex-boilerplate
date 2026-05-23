import { db } from './knex';

async function migrate() {
  const hasUsers = await db.schema.hasTable('user');
  if (hasUsers) {
    console.log('Tables already exist, skipping migration.');
    await db.destroy();
    return;
  }

  await db.schema.createTable('user', (table) => {
    table.text('id').primary();
    table.text('name').notNullable();
    table.text('email').unique();
    table.boolean('emailVerified').notNullable().defaultTo(false);
    table.text('image');
    table.timestamp('createdAt').notNullable().defaultTo(db.fn.now());
    table.timestamp('updatedAt').notNullable().defaultTo(db.fn.now());
  });

  await db.schema.createTable('session', (table) => {
    table.text('id').primary();
    table
      .text('userId')
      .notNullable()
      .references('id')
      .inTable('user')
      .onDelete('CASCADE');
    table.text('token').notNullable().unique();
    table.timestamp('expiresAt').notNullable();
    table.timestamp('createdAt').notNullable().defaultTo(db.fn.now());
    table.timestamp('updatedAt').notNullable().defaultTo(db.fn.now());
    table.text('ipAddress');
    table.text('userAgent');
  });

  await db.schema.createTable('account', (table) => {
    table.text('id').primary();
    table
      .text('userId')
      .notNullable()
      .references('id')
      .inTable('user')
      .onDelete('CASCADE');
    table.text('accountId').notNullable();
    table.text('providerId').notNullable();
    table.text('accessToken');
    table.text('refreshToken');
    table.text('idToken');
    table.timestamp('accessTokenExpiresAt');
    table.timestamp('refreshTokenExpiresAt');
    table.text('scope');
    table.text('password');
    table.timestamp('createdAt').notNullable().defaultTo(db.fn.now());
    table.timestamp('updatedAt').notNullable().defaultTo(db.fn.now());
  });

  await db.schema.createTable('verification', (table) => {
    table.text('id').primary();
    table.text('identifier').notNullable();
    table.text('value').notNullable();
    table.timestamp('expiresAt').notNullable();
    table.timestamp('createdAt').notNullable().defaultTo(db.fn.now());
    table.timestamp('updatedAt').notNullable().defaultTo(db.fn.now());
  });

  await db.schema.createTable('post', (table) => {
    table.text('id').primary();
    table.text('title');
    table.text('content', 'text');
    table
      .text('userId')
      .notNullable()
      .references('id')
      .inTable('user')
      .onDelete('CASCADE');
    table.timestamp('createdAt').notNullable().defaultTo(db.fn.now());
    table.timestamp('updatedAt').notNullable().defaultTo(db.fn.now());
    table.index(['userId']);
  });

  await db.schema.createTable('comment', (table) => {
    table.text('id').primary();
    table.text('content', 'text');
    table
      .text('postId')
      .notNullable()
      .references('id')
      .inTable('post')
      .onDelete('CASCADE');
    table
      .text('userId')
      .notNullable()
      .references('id')
      .inTable('user')
      .onDelete('CASCADE');
    table.timestamp('createdAt').notNullable().defaultTo(db.fn.now());
    table.timestamp('updatedAt').notNullable().defaultTo(db.fn.now());
    table.index(['postId']);
  });

  console.log('Migration completed successfully.');
  await db.destroy();
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
