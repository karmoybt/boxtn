import { getAsistencias } from '~/server/services/asistencia';
import { getAuthUserId } from '~/server/utils/auth';
import type { AsistenciaFilters } from '~/server/services/asistencia';

export default defineEventHandler(async (event) => {
  const userId = await getAuthUserId(event);
  const query = getQuery(event);

  const filters: AsistenciaFilters = {};
  if (query.usuario_id) filters.usuario_id = String(query.usuario_id);
  if (query.instancia_clase_id) filters.instancia_clase_id = String(query.instancia_clase_id);

  return await getAsistencias(filters, userId);
});