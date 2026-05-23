import { Hono } from 'hono';

import type { AuthType } from '../auth/auth.types';
import { healthService } from '../../composer';

const app = new Hono<{ Variables: AuthType }>({ strict: false });

/**
 * @openapi
 * /api/health/db:
 *   get:
 *     summary: Test database connection
 *     description: Check if the database connection is working
 *     responses:
 *       200:
 *         description: Database connected successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 */
app.get('/db', async (c) => {
  const result = await healthService.checkDatabase();
  return c.json(result);
});

/**
 * @openapi
 * /api/health/api:
 *   get:
 *     summary: Health check
 *     description: Check if the API is running
 *     responses:
 *       200:
 *         description: API is running
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 */
app.get('/api', async (c) => {
  const result = await healthService.checkApi();
  return c.json(result);
});

export default app;
