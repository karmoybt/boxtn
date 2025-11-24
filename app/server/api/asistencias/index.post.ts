import  { createAsistencia }  from '../../services/asistencia';
import { getAuthUserId } from '../../utils/auth';

export default defineEventHandler(async (event) => {
  const userId = await getAuthUserId(event);
  const body = await readBody(event);
  const ip = event.node.req.headers['x-forwarded-for'] || event.node.req.socket.remoteAddress;
  const userAgent = event.node.req.headers['user-agent'];

  return await createAsistencia(body, userId, ip as string, userAgent);
});