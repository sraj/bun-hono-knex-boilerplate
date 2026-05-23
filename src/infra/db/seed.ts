import process from 'node:process';

import { faker } from '@faker-js/faker';

import { app } from '../../server';

import { db } from './knex';

async function seed() {
  console.log('Seeding database...');

  const existingUsers = await db('user').select('id').limit(1);
  if (existingUsers.length > 0) {
    console.log('Database already has data, skipping seed.');
    await db.destroy();
    return;
  }

  const password = 'password123';

  const aliceSignUp = await app.request('/api/auth/sign-up/email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'alice@example.com',
      password,
      name: 'Alice Johnson',
    }),
  });

  if (!aliceSignUp.ok) {
    throw new Error(`Failed to create alice: ${await aliceSignUp.text()}`);
  }

  const aliceId = ((await aliceSignUp.json()) as { user: { id: string } }).user
    .id;

  const bobSignUp = await app.request('/api/auth/sign-up/email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'bob@example.com',
      password,
      name: 'Bob Smith',
    }),
  });

  if (!bobSignUp.ok) {
    throw new Error(`Failed to create bob: ${await bobSignUp.text()}`);
  }

  const bobId = ((await bobSignUp.json()) as { user: { id: string } }).user.id;

  const users = [
    { id: aliceId, email: 'alice@example.com' },
    { id: bobId, email: 'bob@example.com' },
  ];

  for (const user of users) {
    const posts = Array.from({ length: 3 }, () => ({
      id: crypto.randomUUID(),
      title: faker.lorem.sentence(),
      content: faker.lorem.paragraphs(2),
      userId: user.id,
      createdAt: faker.date.recent(),
      updatedAt: faker.date.recent(),
    }));

    await db('post').insert(posts);

    for (const post of posts) {
      const comments = Array.from({ length: 2 }, () => ({
        id: crypto.randomUUID(),
        content: faker.lorem.sentence(),
        postId: post.id,
        userId: users[Math.floor(Math.random() * users.length)]?.id,
        createdAt: faker.date.recent(),
        updatedAt: faker.date.recent(),
      }));

      await db('comment').insert(comments);
    }
  }

  const userCount = await db('user').count('id as count').first();
  const postCount = await db('post').count('id as count').first();
  const commentCount = await db('comment').count('id as count').first();

  console.log(
    `Seeded: ${userCount?.count ?? 0} users, ${postCount?.count ?? 0} posts, ${commentCount?.count ?? 0} comments`,
  );
  console.log(
    'You can sign in as alice@example.com or bob@example.com (password: password123)',
  );

  await db.destroy();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
