import { z } from 'zod/v4';

export const createCommentSchema = z.object({
  postId: z.string().min(1, 'Post ID is required'),
  content: z.string().min(1, 'Content is required'),
});

export type CreateComment = z.infer<typeof createCommentSchema>;

export const updateCommentSchema = z.object({
  id: z.string(),
  content: z.string(),
});

export type UpdateComment = z.infer<typeof updateCommentSchema>;
