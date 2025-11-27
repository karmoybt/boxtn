import { serviceRegistry } from '../../services/registry'
import { assertPermission } from '../../utils/getPermisos'

// 🔄 Mapeo para permisos
const ENTITY_GROUP_MAP: Record<string, string> = {
  'instancia-clase': 'clase',
  'clase-recurrente': 'clase',
}

function getPermissionBase(entity: string): string {
  const base = ENTITY_GROUP_MAP[entity] || entity
  const cleaned = base.replace(/-/g, '')
  return cleaned.endsWith('s') ? cleaned : cleaned + 's'
}

export default defineEventHandler(async (event) => {
  const { entity, id } = getRouterParams(event)
  if (!entity) {
    throw createError({ statusCode: 404, statusMessage: 'Entidad no especificada' })
  }

  const userId = event.context.auth?.userId
  if (!userId) {
    throw createError({ statusCode: 401, statusMessage: 'No autenticado' })
  }

  const method = event.node.req.method
  const action = id
    ? method === 'GET' ? 'read' : method === 'PUT' ? 'update' : 'delete'
    : method === 'POST' ? 'create' : 'read'

  const permissionBase = getPermissionBase(entity)
  const requiredPermission = `${permissionBase}:${action}`

  await assertPermission(userId, requiredPermission, {
    resource: entity,
    resourceId: id || undefined
  })

  const entry = serviceRegistry[entity as keyof typeof serviceRegistry]
  if (!entry) {
    throw createError({ statusCode: 404, statusMessage: 'Entidad no soportada' })
  }

  // ✅ Instanciar repo y servicio
  const RepoClass = entry.repo
  const ServiceClass = entry.service

  // 🔧 Paso clave: si tu repo no necesita db, elimina el parámetro
  const repo = new RepoClass() // 👈 sin (db)
  const service = new ServiceClass(repo)

  try {
    const body = ['PUT', 'POST'].includes(method) ? await readBody(event) : undefined

    if (id) {
      switch (method) {
        case 'GET':
          return await (service as any).findById(id)
        case 'PUT':
          return await (service as any).update(id, body)
        case 'DELETE':
          return await (service as any).delete(id)
        default:
          throw createError({ statusCode: 405 })
      }
    } else {
      switch (method) {
        case 'GET':
          return await (service as any).findMany({})
        case 'POST':
          return await (service as any).create(body)
        default:
          throw createError({ statusCode: 405 })
      }
    }
  } catch (err) {
    console.error(`[API ERROR] ${method} /api/${entity}${id ? `/${id}` : ''}:`, err)
    const message = err instanceof Error ? err.message : 'Error interno'
    throw createError({ statusCode: 500, statusMessage: message })
  }
})