import client from '../db/client';
import { auditLog } from '../log/useAuditLog';
import { assertPermission } from '../utils/assertPermission';
import { ASISTENCIA_PERMISSIONS } from '../../constants/permissions';

// ─── TIPOS ───────────────────────────────────────────────
export type AsistenciaFilters = Partial<{
  usuario_id: string;
  instancia_clase_id: string;
}>;

export type AsistenciaData = {
  id: string;
  usuario_id: string;
  instancia_clase_id: string;
};

// ─── UTILS ───────────────────────────────────────────────
async function getAsistenciaById(id: string) {
  const res = await client.execute('SELECT * FROM asistencias WHERE id = ?', [id]);
  return res.rows[0] || null;
}

// ─── READ ───────────────────────────────────────────────
export async function getAsistencias(filters: AsistenciaFilters = {}, userId: string) {
  await assertPermission(userId, ASISTENCIA_PERMISSIONS.READ);

  const allowedKeys = ['usuario_id', 'instancia_clase_id'] as const;
  const conditions: string[] = [];
  const params: string[] = [];

  for (const key of allowedKeys) {
    if (filters[key] !== undefined) {
      conditions.push(`${key} = ?`);
      params.push(filters[key]!);
    }
  }

  let query = 'SELECT * FROM asistencias';
  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  const result = await client.execute(query, params);
  return result.rows;
}

// ─── CREATE ─────────────────────────────────────────────
export async function createAsistencia(data: AsistenciaData, userId: string, ip?: string, userAgent?: string) {
  await assertPermission(userId, ASISTENCIA_PERMISSIONS.CREATE);

  if (!data.usuario_id) throw new Error('usuario_id es obligatorio.');
  if (!data.instancia_clase_id) throw new Error('instancia_clase_id es obligatorio.');

  const existing = await getAsistenciaById(data.id);
  if (existing) throw new Error('Ya existe una asistencia con este ID.');

  await client.execute(
    `INSERT INTO asistencias (id, usuario_id, instancia_clase_id) VALUES (?, ?, ?)`,
    [data.id, data.usuario_id, data.instancia_clase_id]
  );

  await auditLog('CREAR', {
    user_id: userId,
    ip_address: ip,
    user_agent: userAgent,
    table: 'asistencias',
    record_id: data.id,
    new_value: data
  });

  return { id: data.id };
}

// ─── DELETE ─────────────────────────────────────────────
export async function deleteAsistencia(id: string, userId: string, ip?: string, userAgent?: string) {
  if (!id) throw new Error('ID obligatorio.');
  await assertPermission(userId, ASISTENCIA_PERMISSIONS.DELETE);

  const asistencia = await getAsistenciaById(id);
  if (!asistencia) throw new Error('Asistencia no encontrada.');

  await client.execute('DELETE FROM asistencias WHERE id = ?', [id]);

  await auditLog('ELIMINAR', {
    user_id: userId,
    ip_address: ip,
    user_agent: userAgent,
    table: 'asistencias',
    record_id: id,
    old_value: asistencia
  });

  return { id };
}