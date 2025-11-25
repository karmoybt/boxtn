import { getClasesRecurrentes } from '../../services/clasesRecurrentes';
import { getAuthUserId } from '../../utils/auth';
import type { ClaseRecurrenteFilters } from '../../services/clasesRecurrentes'; 

export default defineEventHandler(async (event) => {
  const userId = await getAuthUserId(event);
  const query = getQuery(event);

  const filters: ClaseRecurrenteFilters = {};
  if (query.nombre) filters.nombre = String(query.nombre);
  if (query.dia_semana) filters.dia_semana = Number(query.dia_semana);
  if (query.coach_id) filters.coach_id = String(query.coach_id);

  return await getClasesRecurrentes(filters, userId);
});
