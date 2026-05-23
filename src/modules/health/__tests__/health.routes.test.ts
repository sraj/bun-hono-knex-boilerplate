import { describe, expect, it } from 'bun:test';

import { app } from '../../../../src/server';

describe('Health API endpoints', () => {
  it('should return the root message', async () => {
    const response = await app.request('/');
    expect(response.status).toBe(200);
    const text = await response.text();
    expect(text).toContain('The server is running');
  });

  it('should return the docs page', async () => {
    const response = await app.request('/docs');
    expect(response.status).toBe(200);
  });

  it('should return the api status', async () => {
    const response = await app.request('/api/health/api', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toEqual({ status: 'OK' });
  });

  it('should check the database status', async () => {
    const response = await app.request('/api/health/db', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toEqual({ status: 'Database connected successfully' });
  });
});
