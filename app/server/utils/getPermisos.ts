import client from '../db/client'

export type PermissionContext = {
  resource?: string
  resourceId?: string
}

export type Permission = string

export async function assertPermission(
  userId: string,
  requiredPermission: Permission,
  context: PermissionContext = {}
): Promise<void> {
  if (!userId || typeof userId !== 'string') {
    throw new Error('Usuario no autenticado')
  }

  const roles = await getUserRoles(userId)
  if (!roles.length) {
    throw new Error('Acceso denegado: sin roles asignados')
  }

  const hasPermission = await checkPermissionInRoles(roles, requiredPermission)
  if (!hasPermission) {
    throw new Error('Acceso denegado: permiso insuficiente')
  }

  if (context.resource === 'lead' && context.resourceId) {
    const isOwner = await isUserOwnerOfLead(userId, context.resourceId)
    if (!isOwner) {
      throw new Error('Acceso denegado: el recurso no pertenece al usuario')
    }
  }
}

async function getUserRoles(userId: string): Promise<string[]> {
  const res = await client.execute(
    `SELECT role FROM user_roles WHERE user_id = ?`,
    [userId]
  )
  return res.rows.map(r => r.role).filter((role): role is string => typeof role === 'string')
}

async function checkPermissionInRoles(roles: string[], permission: Permission): Promise<boolean> {
  const placeholders = roles.map(() => '?').join(',')
  const res = await client.execute(
    `SELECT 1 FROM role_permissions 
     WHERE role IN (${placeholders}) AND permission = ? 
     LIMIT 1`,
    [...roles, permission]
  )
  return res.rows.length > 0
}

async function isUserOwnerOfLead(userId: string, leadId: string): Promise<boolean> {
  const res = await client.execute(
    `SELECT 1 FROM leads WHERE id = ? AND created_by_user_id = ?`,
    [leadId, userId]
  )
  return res.rows.length > 0
}