import { db } from '../../src/shared/database';

export async function deleteUser(userId: string) {
  await db('user').where({ id: userId }).del();
}

export async function deletePost(postId: string) {
  await db('post').where({ id: postId }).del();
}

export async function deleteComment(commentId: string) {
  await db('comment').where({ id: commentId }).del();
}
