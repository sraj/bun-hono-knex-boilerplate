import type { CreatePost, UpdatePost } from './post.types';
import type { PostRepository } from './post.repository';
export class PostService {
  constructor(private postRepository: PostRepository) {}

  async create(userId: string, data: CreatePost) {
    return this.postRepository.create(userId, data);
  }

  async getById(postId: string, userId: string) {
    const post = await this.postRepository.findById(postId, userId);
    if (!post) return undefined;
    const comments = await this.postRepository.findCommentsByPost(postId);
    return { ...post, comments };
  }

  async listByUser(userId: string, page = 1, limit = 20) {
    return this.postRepository.findByUser(userId, page, limit);
  }

  async update(userId: string, data: UpdatePost) {
    return this.postRepository.update(userId, data);
  }
}
