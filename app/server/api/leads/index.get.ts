import { getLeads } from '~/server/services/leads';
import { getAuthUserId } from '~/server/utils/auth';
import type { LeadFilters } from '~/server/services/leads';

export default defineEventHandler(async (event) => {
  const userId = await getAuthUserId(event);
  const query = getQuery(event);

  const filters: LeadFilters = {};
  if (query.nombre) filters.nombre = String(query.nombre);
  if (query.email) filters.email = String(query.email);
  if (query.estado_id) filters.estado_id = Number(query.estado_id);

  return await getLeads(filters, userId);
});