import { db } from '../../shared/database';
import { logger } from '../../shared/logger';

import type { CreateComment, UpdateComment } from './comment.types';

function logError(
  method: string,
  error: unknown,
  context?: Record<string, unknown>,
) {
  logger.error(
    { method: `CommentRepository.${method}`, error, ...context },
    'Database query failed',
  );
}

export class CommentRepository {
  async create(userId: string, data: CreateComment) {
    try {
      const [comment] = await db('comment')
        .insert({
          id: crypto.randomUUID(),
          content: data.content,
          postId: data.postId,
          userId,
        })
        .returning('*');
      return comment;
    } catch (error) {
      logError('create', error, { userId, postId: data.postId });
      throw error;
    }
  }

  async findById(commentId: string, userId: string) {
    try {
      return db('comment').where({ userId, id: commentId }).first();
    } catch (error) {
      logError('findById', error, { commentId, userId });
      throw error;
    }
  }

  async findByUser(userId: string, page = 1, limit = 20) {
    try {
      const offset = (page - 1) * limit;
      const countRows = await db('comment')
        .where({ userId })
        .count<{ count: string }[]>('*');
      const total = Number(countRows[0]?.count ?? 0);
      const data = await db('comment')
        .where({ userId })
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .offset(offset);
      return { data, total, page, limit };
    } catch (error) {
      logError('findByUser', error, { userId });
      throw error;
    }
  }

  async update(userId: string, data: UpdateComment) {
    try {
      const { id, ...updateData } = data;
      const [comment] = await db('comment')
        .where({ id, userId })
        .update({ ...updateData, updatedAt: db.fn.now() })
        .returning('*');
      return comment;
    } catch (error) {
      logError('update', error, { userId, commentId: data.id });
      throw error;
    }
  }

  async delete(commentId: string, userId: string) {
    try {
      return db('comment').where({ id: commentId, userId }).del();
    } catch (error) {
      logError('delete', error, { commentId, userId });
      throw error;
    }
  }
}
