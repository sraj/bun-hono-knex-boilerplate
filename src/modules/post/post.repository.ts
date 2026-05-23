import { db } from '../../shared/database';
import { logger } from '../../shared/logger';

import type { CreatePost, UpdatePost } from './post.types';

function logError(
  method: string,
  error: unknown,
  context?: Record<string, unknown>,
) {
  logger.error(
    { method: `PostRepository.${method}`, error, ...context },
    'Database query failed',
  );
}

export class PostRepository {
  async create(userId: string, data: CreatePost) {
    try {
      const [post] = await db('post')
        .insert({
          id: crypto.randomUUID(),
          title: data.title,
          content: data.content,
          userId,
        })
        .returning('*');
      return post;
    } catch (error) {
      logError('create', error, { userId });
      throw error;
    }
  }

  async findById(postId: string, userId: string) {
    try {
      return db('post').where({ id: postId, userId }).first();
    } catch (error) {
      logError('findById', error, { postId, userId });
      throw error;
    }
  }

  async findCommentsByPost(postId: string) {
    try {
      return db('comment')
        .where({ postId })
        .orderBy('createdAt', 'desc')
        .limit(20);
    } catch (error) {
      logError('findCommentsByPost', error, { postId });
      throw error;
    }
  }

  async findByUser(userId: string, page = 1, limit = 20) {
    try {
      const offset = (page - 1) * limit;
      const countRows = await db('post')
        .where({ userId })
        .count<{ count: string }[]>('*');
      const total = Number(countRows[0]?.count ?? 0);
      const data = await db('post')
        .leftJoin(
          db('comment')
            .select('postId')
            .count('* as commentCount')
            .groupBy('postId')
            .as('c'),
          'post.id',
          'c.postId',
        )
        .select('post.*', 'c.commentCount')
        .where('post.userId', userId)
        .orderBy('post.createdAt', 'desc')
        .limit(limit)
        .offset(offset);
      return { data, total, page, limit };
    } catch (error) {
      logError('findByUser', error, { userId });
      throw error;
    }
  }

  async update(userId: string, data: UpdatePost) {
    try {
      const { id, ...updateData } = data;
      const [post] = await db('post')
        .where({ id, userId })
        .update({ ...updateData, updatedAt: db.fn.now() })
        .returning('*');
      return post;
    } catch (error) {
      logError('update', error, { userId, postId: data.id });
      throw error;
    }
  }
}
