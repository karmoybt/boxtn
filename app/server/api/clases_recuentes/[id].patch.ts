import { updateClaseRecurrente } from '../../services/clasesRecurrentes';
import { getAuthUserId } from '../../utils/auth';

export default defineEventHandler(async (event) => {
  try {
    const userId = await getAuthUserId(event);
    const id = getRouterParam(event, 'id');
    const body = await readBody(event);
    const ip = event.node.req.headers['x-forwarded-for'] || event.node.req.socket.remoteAddress;
    const userAgent = event.node.req.headers['user-agent'];

    if (!id) {
      throw new Error('ID de la clase recurrente es obligatorio.');
    }

    return await updateClaseRecurrente(id!, body, userId, ip as string, userAgent);
  } catch (error: unknown) { 
    if (error instanceof Error) { 
      return { error: error.message };
    }
    return { error: 'Se ha producido un error desconocido.' }; 
  }
});
