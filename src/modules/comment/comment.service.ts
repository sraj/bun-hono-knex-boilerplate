import type { CreateComment, UpdateComment } from './comment.types';
import type { CommentRepository } from './comment.repository';
export class CommentService {
  constructor(private commentRepository: CommentRepository) {}

  async create(userId: string, data: CreateComment) {
    return this.commentRepository.create(userId, data);
  }

  async getById(commentId: string, userId: string) {
    return this.commentRepository.findById(commentId, userId);
  }

  async listByUser(userId: string, page = 1, limit = 20) {
    return this.commentRepository.findByUser(userId, page, limit);
  }

  async update(userId: string, data: UpdateComment) {
    return this.commentRepository.update(userId, data);
  }

  async delete(commentId: string, userId: string) {
    return this.commentRepository.delete(commentId, userId);
  }
}
