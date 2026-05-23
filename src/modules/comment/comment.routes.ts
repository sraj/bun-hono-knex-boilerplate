import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';

import { type AuthType, getUserFromContext } from '../auth/auth.types';
import { commentService } from '../../composer';

import { createCommentSchema, updateCommentSchema } from './comment.types';

const app = new Hono<{ Variables: AuthType }>({ strict: false });

/**
 * @openapi
 * /api/comment/{commentId}:
 *   get:
 *     tags:
 *       - Comment
 *     summary: Get comment by ID
 *     parameters:
 *       - name: commentId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Comment'
 */
app.get('/:commentId', async (c) => {
  const commentId = c.req.param('commentId');
  if (!commentId) {
    throw new HTTPException(400, { message: 'Comment ID is required' });
  }

  const user = getUserFromContext(c);
  const comment = await commentService.getById(commentId, user.id);
  if (!comment) {
    throw new HTTPException(404, { message: 'Comment not found' });
  }
  return c.json(comment);
});

/**
 * @openapi
 * /api/comment:
 *   get:
 *     tags:
 *       - Comment
 *     summary: List comments
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Comment'
 */
app.get('/', async (c) => {
  const user = getUserFromContext(c);
  const page = Number(c.req.query('page')) || 1;
  const limit = Math.min(Number(c.req.query('limit')) || 20, 100);
  const result = await commentService.listByUser(user.id, page, limit);
  return c.json(result);
});

/**
 * @openapi
 * /api/comment:
 *   post:
 *     tags:
 *       - Comment
 *     summary: Create a new comment
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *     responses:
 *       201:
 *         description: Comment created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Comment'
 */
app.post('/', async (c) => {
  const user = getUserFromContext(c);
  const commentData = await c.req.json();
  const parsedData = createCommentSchema.parse(commentData);
  const comment = await commentService.create(user.id, parsedData);
  if (!comment) {
    throw new HTTPException(400, { message: 'Failed to create comment' });
  }
  return c.json(comment, 201);
});

/**
 * @openapi
 * /api/comment:
 *   patch:
 *     tags:
 *       - Comment
 *     summary: Update an existing comment
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *     responses:
 *       200:
 *         description: Comment updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Comment'
 */
app.patch('/:commentId', async (c) => {
  const user = getUserFromContext(c);
  const commentId = c.req.param('commentId');
  if (!commentId) {
    throw new HTTPException(400, { message: 'Comment ID is required' });
  }
  const commentData = await c.req.json();
  const parsedData = updateCommentSchema.parse({
    ...commentData,
    id: commentId,
  });
  const comment = await commentService.update(user.id, parsedData);
  if (!comment) {
    throw new HTTPException(404, {
      message: 'Comment not found or update failed',
    });
  }
  return c.json(comment);
});

export default app;
