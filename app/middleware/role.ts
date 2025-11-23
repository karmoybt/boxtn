import { useUserSession } from '../composables/api/useUserSession'; // Asegúrate de que la ruta sea correcta

export default defineNuxtRouteMiddleware(async (to) => {
  const session = await useUserSession();
  const requiredRole = to.meta?.requiredRole;
  if (requiredRole && session.user?.role !== requiredRole) {
    return navigateTo('/');
  }
});