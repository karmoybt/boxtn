import { deleteAsistencia } from '../../services/asistencia';
import { getAuthUserId } from '../../utils/auth';

export default defineEventHandler(async (event) => {
  const userId = await getAuthUserId(event);
  const id = getRouterParam(event, 'id');
  const ip = event.node.req.headers['x-forwarded-for'] || event.node.req.socket.remoteAddress;
  const userAgent = event.node.req.headers['user-agent'];

  return await deleteAsistencia(id!, userId, ip as string, userAgent);
});