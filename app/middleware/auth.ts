import { useUserSession } from '../composables/api/useUserSession'

export default defineNuxtRouteMiddleware(async (_to) => {
  const session = await useUserSession();
  if (!session.user) {
    return navigateTo('/login');
  }
});