import { describe, expect, it } from 'bun:test';

import { CommentService } from '../comment.service';
import type { CommentRepository } from '../comment.repository';
import type { CreateComment, UpdateComment } from '../comment.types';

function createMockRepo(): CommentRepository {
  return {
    create: async (_userId, _data) => ({
      id: 'comment-1',
      content: _data.content,
      postId: _data.postId,
      userId: _userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
    findById: async (_commentId, _userId) => ({
      id: _commentId,
      content: 'Test comment',
      postId: 'post-1',
      userId: _userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
    findByUser: async (_userId, _page, _limit) => ({
      data: [
        {
          id: 'comment-1',
          content: 'Test comment',
          postId: 'post-1',
          userId: _userId,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      total: 1,
      page: 1,
      limit: 20,
    }),
    update: async (_userId, _data) => ({
      id: _data.id,
      content: _data.content,
      postId: 'post-1',
      userId: _userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
    delete: async (_commentId, _userId) => 1,
  } as CommentRepository;
}

describe('CommentService', () => {
  it('should create a comment', async () => {
    const mockRepo = createMockRepo();
    const service = new CommentService(mockRepo);
    const data: CreateComment = { postId: 'post-1', content: 'Great post!' };

    const result = await service.create('user-1', data);

    expect(result.content).toBe('Great post!');
    expect(result.postId).toBe('post-1');
  });

  it('should get a comment by id', async () => {
    const mockRepo = createMockRepo();
    const service = new CommentService(mockRepo);

    const result = await service.getById('comment-1', 'user-1');

    expect(result).toBeDefined();
    expect(result?.id).toBe('comment-1');
  });

  it('should list comments by user', async () => {
    const mockRepo = createMockRepo();
    const service = new CommentService(mockRepo);

    const result = await service.listByUser('user-1');

    expect(result.total).toBe(1);
    expect(result.page).toBe(1);
    expect(result.data).toHaveLength(1);
  });

  it('should update a comment', async () => {
    const mockRepo = createMockRepo();
    const service = new CommentService(mockRepo);
    const data: UpdateComment = { id: 'comment-1', content: 'Updated!' };

    const result = await service.update('user-1', data);

    expect(result.content).toBe('Updated!');
  });

  it('should delete a comment', async () => {
    const mockRepo = createMockRepo();
    const service = new CommentService(mockRepo);

    const result = await service.delete('comment-1', 'user-1');

    expect(result).toBe(1);
  });
});
