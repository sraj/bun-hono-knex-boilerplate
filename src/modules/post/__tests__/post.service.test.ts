import { describe, expect, it } from 'bun:test';

import { PostService } from '../post.service';
import type { PostRepository } from '../post.repository';
import type { CreatePost, UpdatePost } from '../post.types';

function createMockRepo(): PostRepository {
  return {
    create: async (_userId, _data) => ({
      id: 'post-1',
      title: _data.title,
      content: _data.content,
      userId: _userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
    findById: async (_postId, _userId) => ({
      id: _postId,
      title: 'Test Post',
      content: 'Test content',
      userId: _userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
    findCommentsByPost: async () => [
      {
        id: 'comment-1',
        content: 'Test comment',
        postId: 'post-1',
        userId: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    findByUser: async (_userId, _page, _limit) => ({
      data: [
        {
          id: 'post-1',
          title: 'Test Post',
          content: 'Test content',
          userId: _userId,
          createdAt: new Date(),
          updatedAt: new Date(),
          commentCount: 2,
        },
      ],
      total: 1,
      page: 1,
      limit: 20,
    }),
    update: async (_userId, _data) => ({
      id: _data.id,
      title: _data.title ?? 'Test Post',
      content: _data.content ?? 'Test content',
      userId: _userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
  } as PostRepository;
}

describe('PostService', () => {
  it('should create a post', async () => {
    const mockRepo = createMockRepo();
    const service = new PostService(mockRepo);
    const data: CreatePost = { title: 'New Post', content: 'New content' };

    const result = await service.create('user-1', data);

    expect(result.title).toBe('New Post');
    expect(result.content).toBe('New content');
  });

  it('should get a post with comments', async () => {
    const mockRepo = createMockRepo();
    const service = new PostService(mockRepo);

    const result = await service.getById('post-1', 'user-1');

    expect(result).toBeDefined();
    expect(result?.title).toBe('Test Post');
    expect(result?.comments).toHaveLength(1);
  });

  it('should return undefined when post not found', async () => {
    const mockRepo = createMockRepo();
    mockRepo.findById = async () => undefined;
    const service = new PostService(mockRepo);

    const result = await service.getById('nonexistent', 'user-1');

    expect(result).toBeUndefined();
  });

  it('should list posts with comment count', async () => {
    const mockRepo = createMockRepo();
    const service = new PostService(mockRepo);

    const result = await service.listByUser('user-1');

    expect(result.total).toBe(1);
    expect(result.page).toBe(1);
    expect(result.data).toHaveLength(1);
    expect(result.data[0]?.commentCount).toBe(2);
  });

  it('should update a post', async () => {
    const mockRepo = createMockRepo();
    const service = new PostService(mockRepo);
    const data: UpdatePost = { id: 'post-1', title: 'Updated' };

    const result = await service.update('user-1', data);

    expect(result.title).toBe('Updated');
  });
});
