import { registerUser } from '~/composables/api/useRegister';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const result = await registerUser(body);

  return result;
});