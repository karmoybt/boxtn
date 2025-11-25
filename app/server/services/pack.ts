import client from '../db/client';
import { auditLog } from '../log/useAuditLog';
import { assertPermission } from '../utils/assertPermission';
import { PACK_PERMISSIONS } from '../../constants/permissions';

// ─── TIPOS ───────────────────────────────────────────────
export type PackFilters = Partial<{
  nombre: string;
}>;

export type PackData = {
  id: string;
  nombre: string;
  creditos: number;
  duracion_dias: number;
};

export type PackUpdateData = Partial<Pick<PackData, 'nombre' | 'creditos' | 'duracion_dias'>>;

// ─── UTILS ───────────────────────────────────────────────
async function getPackById(id: string) {
  const res = await client.execute('SELECT * FROM packs_clases WHERE id = ?', [id]);
  return res.rows[0] || null;
}

// ─── READ ───────────────────────────────────────────────
export async function getPacks(filters: PackFilters = {}, userId: string) {
  await assertPermission(userId, PACK_PERMISSIONS.READ);

  const conditions: string[] = [];
  const params: string[] = [];

  if (filters.nombre) {
    conditions.push('nombre = ?');
    params.push(filters.nombre);
  }

  let query = 'SELECT * FROM packs_clases';
  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  const result = await client.execute(query, params);
  return result.rows;
}

// ─── CREATE ─────────────────────────────────────────────
export async function createPack(
  data: PackData, 
  userId: string,
  ip?: string,
  userAgent?: string
) {
  await assertPermission(userId, PACK_PERMISSIONS.CREATE);

  if (!data.nombre) throw new Error('El nombre es obligatorio.');
  if (!data.creditos || data.creditos <= 0) {
    throw new Error('creditos debe ser un número positivo.');
  }
  if (!data.duracion_dias || data.duracion_dias <= 0) {
    throw new Error('duracion_dias debe ser un número positivo.');
  }

  const existing = await getPackById(data.id);
  if (existing) throw new Error('Ya existe un pack con este ID.');

  await client.execute(
    `INSERT INTO packs_clases (id, nombre, creditos, duracion_dias) VALUES (?, ?, ?, ?)`,
    [data.id, data.nombre, data.creditos, data.duracion_dias]
  );

  await auditLog('CREAR', {
    user_id: userId,
    ip_address: ip,
    user_agent: userAgent,
    table: 'packs_clases',
    record_id: data.id,
    new_value: data
  });

  return { id: data.id };
}

// ─── UPDATE ─────────────────────────────────────────────
export async function updatePack(
  id: string,
  data: PackUpdateData,
  userId: string,
  ip?: string,
  userAgent?: string
) {
  if (!id) throw new Error('ID obligatorio.');
  await assertPermission(userId, PACK_PERMISSIONS.UPDATE);

  if (data.creditos !== undefined && data.creditos <= 0) {
    throw new Error('creditos debe ser positivo.');
  }
  if (data.duracion_dias !== undefined && data.duracion_dias <= 0) {
    throw new Error('duracion_dias debe ser positivo.');
  }

  const oldPack = await getPackById(id);
  if (!oldPack) throw new Error('Pack no encontrado.');

  const fields: string[] = [];
  const values: (string | number | null)[] = [];

  if (data.nombre !== undefined) {
    fields.push('nombre = ?');
    values.push(data.nombre);
  }
  if (data.creditos !== undefined) {
    fields.push('creditos = ?');
    values.push(data.creditos);
  }
  if (data.duracion_dias !== undefined) {
    fields.push('duracion_dias = ?');
    values.push(data.duracion_dias);
  }

  if (fields.length === 0) return { id };

  const query = `UPDATE packs_clases SET ${fields.join(', ')} WHERE id = ?`;
  await client.execute(query, [...values, id]);

  await auditLog('ACTUALIZAR', {
    user_id: userId,
    ip_address: ip,
    user_agent: userAgent,
    table: 'packs_clases',
    record_id: id,
    old_value: oldPack,
    new_value: { ...oldPack, ...data }
  });

  return { id };
}

// ─── DELETE ─────────────────────────────────────────────
export async function deletePack(id: string, userId: string, ip?: string, userAgent?: string) {
  if (!id) throw new Error('ID obligatorio.');
  await assertPermission(userId, PACK_PERMISSIONS.DELETE);

  const pack = await getPackById(id);
  if (!pack) throw new Error('Pack no encontrado.');

  await client.execute('DELETE FROM packs_clases WHERE id = ?', [id]);

  await auditLog('ELIMINAR', {
    user_id: userId,
    ip_address: ip,
    user_agent: userAgent,
    table: 'packs_clases',
    record_id: id,
    old_value: pack
  });

  return { id };
}