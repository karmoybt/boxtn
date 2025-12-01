// lib/audit.ts
import { createClient } from '@libsql/client'

const db = createClient({ url: 'file:./db.sqlite' })

export async function auditLog(
  action: 'create' | 'update' | 'delete',
  userId: string | number,
  entity: string,
  entityId: string,
  ip?: string
) {
  await db.execute({
    sql: `INSERT INTO logs_auditoria (accion, usuario_id, entidad, entidad_id, ip, creado_en) VALUES (?, ?, ?, ?, ?, ?)`,
    args: [action, userId, entity, entityId, ip || 'unknown', new Date().toISOString()]
  })
}