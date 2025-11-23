import { defineEventHandler, readBody, createError } from 'h3';
import { loginUser } from '~/composables/api/useLogin';
import { setUserSession } from '~/server/utils/session';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  try {
    const { userId, role } = await loginUser(body);

    const session = await setUserSession(event, {
      userId,
      role
    });

    return { ok: true, session };
  } catch (error) {
    console.error('Login failed:', error);
    throw createError({ status: 401, message: 'Credenciales inválidas' });
  }
});