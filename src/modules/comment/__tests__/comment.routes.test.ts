import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import { faker } from '@faker-js/faker';

import {
  authHeaders,
  signUpAndGetCookie,
} from '../../../../tests/helpers/auth';
import {
  deleteComment,
  deletePost,
  deleteUser,
} from '../../../../tests/helpers/cleanup';
import { app } from '../../../../src/server';

let cookie = '';
let userId: string;
let postId: string;
let commentId: string;

describe('Comment API endpoints', () => {
  beforeAll(async () => {
    const session = await signUpAndGetCookie();
    cookie = session.cookie;
    userId = session.userId;

    const postResponse = await app.request('/api/post', {
      method: 'POST',
      headers: authHeaders(cookie),
      body: JSON.stringify({
        title: faker.lorem.sentence(),
        content: faker.lorem.paragraph(),
      }),
    });
    const postBody = (await postResponse.json()) as { id: string };
    postId = postBody.id;
  });

  afterAll(async () => {
    if (commentId) {
      await deleteComment(commentId);
    }
    if (postId) {
      await deletePost(postId);
    }
    if (userId) {
      await deleteUser(userId);
    }
  });

  it('should create a comment', async () => {
    const content = faker.lorem.sentence();

    const response = await app.request('/api/comment', {
      method: 'POST',
      headers: authHeaders(cookie),
      body: JSON.stringify({ postId, content }),
    });

    expect(response.status).toBe(201);
    const body = (await response.json()) as {
      id: string;
      content: string;
      postId: string;
      userId: string;
    };
    expect(body).toHaveProperty('id');
    expect(body.content).toBe(content);
    expect(body.postId).toBe(postId);
    expect(body.userId).toBe(userId);
    commentId = body.id;
  });

  it('should list comments', async () => {
    const response = await app.request('/api/comment', {
      method: 'GET',
      headers: authHeaders(cookie),
    });

    expect(response.status).toBe(200);
    const body = (await response.json()) as {
      data: Array<{ id: string }>;
      total: number;
      page: number;
      limit: number;
    };
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.total).toBeGreaterThanOrEqual(1);
    expect(body.page).toBe(1);
    expect(body.data.some((c) => c.id === commentId)).toBe(true);
  });

  it('should get a comment by ID', async () => {
    const response = await app.request(`/api/comment/${commentId}`, {
      method: 'GET',
      headers: authHeaders(cookie),
    });

    expect(response.status).toBe(200);
    const body = (await response.json()) as { id: string };
    expect(body.id).toBe(commentId);
  });

  it('should update a comment', async () => {
    const newContent = faker.lorem.sentence();

    const response = await app.request(`/api/comment/${commentId}`, {
      method: 'PATCH',
      headers: authHeaders(cookie),
      body: JSON.stringify({ content: newContent }),
    });

    expect(response.status).toBe(200);
    const body = (await response.json()) as { content: string };
    expect(body.content).toBe(newContent);
  });

  it('should return 400 for invalid comment data', async () => {
    const response = await app.request('/api/comment', {
      method: 'POST',
      headers: authHeaders(cookie),
      body: JSON.stringify({ postId, content: '' }),
    });

    expect(response.status).toBe(400);
    const body = (await response.json()) as { message: string };
    expect(body.message).toContain('content is required');
  });

  it('should return 401 without auth', async () => {
    const response = await app.request('/api/comment', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    expect(response.status).toBe(401);
  });

  it('should return 404 for non-existent comment', async () => {
    const response = await app.request('/api/comment/non-existent-id', {
      method: 'GET',
      headers: authHeaders(cookie),
    });

    expect(response.status).toBe(404);
  });
});
