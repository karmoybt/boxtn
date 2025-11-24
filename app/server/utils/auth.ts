import type { H3Event } from 'h3';

export async function getAuthUserId(event: H3Event): Promise<string> {
  const userId = getCookie(event, 'user_id');
  if (!userId) {
    throw createError({ statusCode: 401, message: 'No autenticado' });
  }
  return userId;
}