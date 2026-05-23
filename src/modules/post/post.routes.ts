import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';

import { type AuthType, getUserFromContext } from '../auth/auth.types';
import { postService } from '../../composer';

import { createPostSchema, updatePostSchema } from './post.types';

const app = new Hono<{ Variables: AuthType }>({ strict: false });

/**
 * @openapi
 * /api/post/{postId}:
 *   get:
 *     tags:
 *       - Post
 *     summary: Get post by ID
 *     parameters:
 *       - name: postId
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
 *               $ref: '#/components/schemas/Post'
 */
app.get('/:postId', async (c) => {
  const postId = c.req.param('postId');
  if (!postId) {
    throw new HTTPException(400, { message: 'Post ID is required' });
  }

  const user = getUserFromContext(c);
  const post = await postService.getById(postId, user.id);
  if (!post) {
    throw new HTTPException(404, { message: 'Post not found' });
  }
  return c.json(post);
});

/**
 * @openapi
 * /api/post:
 *   get:
 *     tags:
 *       - Post
 *     summary: List posts
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Post'
 */
app.get('/', async (c) => {
  const user = getUserFromContext(c);
  const page = Number(c.req.query('page')) || 1;
  const limit = Math.min(Number(c.req.query('limit')) || 20, 100);
  const result = await postService.listByUser(user.id, page, limit);
  return c.json(result);
});

/**
 * @openapi
 * /api/post:
 *   post:
 *     tags:
 *       - Post
 *     summary: Create a new post
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *     responses:
 *       201:
 *         description: Post created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Post'
 */
app.post('/', async (c) => {
  const user = getUserFromContext(c);
  const postData = await c.req.json();
  const parsedData = createPostSchema.parse(postData);
  const post = await postService.create(user.id, parsedData);
  if (!post) {
    throw new HTTPException(400, { message: 'Failed to create post' });
  }
  return c.json(post, 201);
});

/**
 * @openapi
 * /api/post:
 *   patch:
 *     tags:
 *       - Post
 *     summary: Update an existing post
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *     responses:
 *       200:
 *         description: Post updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Post'
 */
app.patch('/:postId', async (c) => {
  const user = getUserFromContext(c);
  const postId = c.req.param('postId');
  if (!postId) {
    throw new HTTPException(400, { message: 'Post ID is required' });
  }
  const postData = await c.req.json();
  const parsedData = updatePostSchema.parse({ ...postData, id: postId });
  const post = await postService.update(user.id, parsedData);
  if (!post) {
    throw new HTTPException(404, {
      message: 'Post not found or update failed',
    });
  }
  return c.json(post);
});

export default app;
