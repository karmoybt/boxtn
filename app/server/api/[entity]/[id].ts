import { defineEventHandler, getRouterParams, readBody, createError } from 'h3';
import { serviceRegistry } from '../../services/registry';

const ENTITY_GROUP_MAP: Record<string, string> = {
  'instancia-clase': 'clase',
  'clase-recurrente': 'clase',
};

function getPermissionBase(entity: string): string {
  const base = ENTITY_GROUP_MAP[entity] || entity;
  const cleaned = base.replace(/-/g, '');
  return cleaned.endsWith('s') ? cleaned : cleaned + 's';
}

export default defineEventHandler(async (event) => {
  const { entity, id } = getRouterParams(event);
  if (!entity) throw createError({ statusCode: 404, statusMessage: 'Entidad no especificada' });

  const userId = event.context.auth?.userId;
  if (!userId) throw createError({ statusCode: 401, statusMessage: 'No autenticado' });

  const method = event.node.req.method;
  const action = id
    ? method === 'GET' ? 'read' : method === 'PUT' ? 'update' : 'delete'
    : method === 'POST' ? 'create' : 'read';

  const permissionBase = getPermissionBase(entity);
  const requiredPermission = `${permissionBase}:${action}`;

  const entry = serviceRegistry[entity as keyof typeof serviceRegistry];
  if (!entry) throw createError({ statusCode: 404, statusMessage: 'Entidad no soportada' });

  const repo = new entry.repo();
  const service = new entry.service(repo);

  const ip = event.node.req.headers['x-forwarded-for'] || event.node.req.socket.remoteAddress;
  const userAgent = event.node.req.headers['user-agent'];

  try {
    if (id) {
      switch (method) {
        case 'GET':
          return await service.findById(id, userId);
        case 'DELETE':
          return await service.delete(id, userId, ip as string, userAgent as string);
        default:
          throw createError({ statusCode: 405, statusMessage: 'Método no permitido' });
      }
    } else {
      switch (method) {
        case 'GET':
          return await service.findAll({}, userId);
        case 'POST': {
          const body = await readBody(event);
          return await service.create(body, userId, ip as string, userAgent as string);
        }
        default:
          throw createError({ statusCode: 405, statusMessage: 'Método no permitido' });
      }
    }
  } catch (err) {
    console.error(`[API ERROR] ${method} /api/${entity}${id ? `/${id}` : ''}:`, err);
    const message = err instanceof Error ? err.message : 'Error interno';
    throw createError({ statusCode: 500, statusMessage: message });
  }
});