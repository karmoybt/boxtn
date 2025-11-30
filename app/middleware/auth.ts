export default defineEventHandler(async (event) => {
  const { entity } = getRouterParams(event)
  if (!entity) return

  const userId = event.context.auth?.userId
  if (!userId) throw createError({ statusCode: 401 })

  const method = event.method
  const id = getRouterParam(event, 'id')
  const action = id
    ? method === 'GET' ? 'read' : method === 'PUT' ? 'update' : 'delete'
    : method === 'POST' ? 'create' : 'read'

  const permissionBase = getPermissionBase(entity)
  await assertPermission(userId, `${permissionBase}:${action}`, {
    resource: entity,
    resourceId: id || undefined
  })
})