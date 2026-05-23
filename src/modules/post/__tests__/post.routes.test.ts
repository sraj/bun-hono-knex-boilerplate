import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import { faker } from '@faker-js/faker';

import {
  authHeaders,
  signUpAndGetCookie,
} from '../../../../tests/helpers/auth';
import { deletePost, deleteUser } from '../../../../tests/helpers/cleanup';
import { app } from '../../../../src/server';

let cookie = '';
let userId: string;
let postId: string;

describe('Post API endpoints', () => {
  beforeAll(async () => {
    const session = await signUpAndGetCookie();
    cookie = session.cookie;
    userId = session.userId;
  });

  afterAll(async () => {
    if (postId) {
      await deletePost(postId);
    }
    if (userId) {
      await deleteUser(userId);
    }
  });

  it('should create a post', async () => {
    const title = faker.lorem.sentence();
    const content = faker.lorem.paragraph();

    const response = await app.request('/api/post', {
      method: 'POST',
      headers: authHeaders(cookie),
      body: JSON.stringify({ title, content }),
    });

    expect(response.status).toBe(201);
    const body = (await response.json()) as {
      id: string;
      title: string;
      content: string;
      userId: string;
    };
    expect(body).toHaveProperty('id');
    expect(body.title).toBe(title);
    expect(body.content).toBe(content);
    expect(body.userId).toBe(userId);
    postId = body.id;
  });

  it('should list posts', async () => {
    const response = await app.request('/api/post', {
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
    expect(body.data.some((p) => p.id === postId)).toBe(true);
  });

  it('should get a post by ID', async () => {
    const response = await app.request(`/api/post/${postId}`, {
      method: 'GET',
      headers: authHeaders(cookie),
    });

    expect(response.status).toBe(200);
    const body = (await response.json()) as { id: string; title: string };
    expect(body.id).toBe(postId);
  });

  it('should update a post', async () => {
    const newTitle = faker.lorem.sentence();

    const response = await app.request(`/api/post/${postId}`, {
      method: 'PATCH',
      headers: authHeaders(cookie),
      body: JSON.stringify({ title: newTitle }),
    });

    expect(response.status).toBe(200);
    const body = (await response.json()) as { title: string };
    expect(body.title).toBe(newTitle);
  });

  it('should return 400 for invalid post data', async () => {
    const response = await app.request('/api/post', {
      method: 'POST',
      headers: authHeaders(cookie),
      body: JSON.stringify({ title: '', content: '' }),
    });

    expect(response.status).toBe(400);
    const body = (await response.json()) as { message: string };
    expect(body.message).toContain('title is required');
  });

  it('should return 401 without auth', async () => {
    const response = await app.request('/api/post', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    expect(response.status).toBe(401);
  });

  it('should return 404 for non-existent post', async () => {
    const response = await app.request('/api/post/non-existent-id', {
      method: 'GET',
      headers: authHeaders(cookie),
    });

    expect(response.status).toBe(404);
  });
});
