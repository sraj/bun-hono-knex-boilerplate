import { CommentRepository } from './modules/comment/comment.repository';
import { CommentService } from './modules/comment/comment.service';
import { HealthService } from './modules/health/health.service';
import { PostRepository } from './modules/post/post.repository';
import { PostService } from './modules/post/post.service';

const postRepository = new PostRepository();
const commentRepository = new CommentRepository();

export const postService = new PostService(postRepository);
export const commentService = new CommentService(commentRepository);
export const healthService = new HealthService();
