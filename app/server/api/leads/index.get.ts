import { getLeads } from '../../server/constants/leads';
import { getAuthUserId } from '../../utils/auth'; // tú debes implementar esto

export default defineEventHandler(async (event) => {
  const userId = await getAuthUserId(event); // ← tú defines cómo obtener el userId
  const filters = getQuery(event);
  return await getLeads(filters as any, userId);
});