// server/api/[...slug]/[id].ts
import { defineEventHandler, getRouterParams, readBody, getQuery, createError } from 'h3'
import { getAllowedEntities } from '~/server/utils/allowedEntities'
import { serviceRegistry, EntityName } from '~/server/services/registry'

export default defineEventHandler(async (event) => {
  const { slug } = getRouterParams(event)
  const parts = slug.split('/').filter(Boolean)

  if (parts.length === 0 || parts.length > 2) {
    throw createError({ statusCode: 404, statusMessage: 'Not found' })
  }

  const rawEntity = parts[0]
  const id = parts[1] || null

  // 1. Validar contra lista permitida (con caché)
  const allowed = await getAllowedEntities()
  if (!allowed.includes(rawEntity)) {
    throw createError({ statusCode: 404, statusMessage: 'Entity not supported' })
  }

  // 2. Asegurar que está en el registro tipado
  const entity = rawEntity as EntityName
  if (!(entity in serviceRegistry)) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Entity registered in DB but not in service registry'
    })
  }

  // 3. Instanciar repo y servicio
  const { service: ServiceClass, repo: RepoClass } = serviceRegistry[entity]
  const repo = new RepoClass()
  const service = new ServiceClass(repo)

  const method = event.node.req.method

  try {
    if (id) {
      switch (method) {
        case 'GET':
          return await service.findById(id)
        case 'PUT':
          return await service.update(id, await readBody(event))
        case 'DELETE':
          return await service.delete(id)
        default:
          throw createError({ statusCode: 405, statusMessage: 'Method not allowed' })
      }
    } else {
      switch (method) {
        case 'GET':
          return await service.findMany(getQuery(event))
        case 'POST':
          return await service.create(await readBody(event))
        default:
          throw createError({ statusCode: 405, statusMessage: 'Method not allowed' })
      }
    }
  } catch (err) {
    console.error(`[API ERROR] ${method} /${slug}:`, err)
    throw createError({ statusCode: 500, statusMessage: 'Internal service error' })
  }
})
