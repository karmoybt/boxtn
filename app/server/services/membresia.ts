import client from '../db/client';
import { auditLog } from '../log/useAuditLog';
import { assertPermission } from '../utils/assertPermission';
import { MEMBRESIA_PERMISSIONS } from '../../constants/permissions';

// ─── TIPOS ───────────────────────────────────────────────
export type MembresiaFilters = Partial<{
  nombre: string;
}>;

export type MembresiaData = {
  id: string;
  nombre: string;
  duracion_dias: number;
};

export type MembresiaUpdateData = Partial<Pick<MembresiaData, 'nombre' | 'duracion_dias'>>;

// ─── UTILS ───────────────────────────────────────────────
async function getMembresiaById(id: string) {
  const res = await client.execute('SELECT * FROM membresias WHERE id = ?', [id]);
  return res.rows[0] || null;
}

// ─── READ ───────────────────────────────────────────────
export async function getMembresias(filters: MembresiaFilters = {}, userId: string) {
  await assertPermission(userId, MEMBRESIA_PERMISSIONS.READ);

  const conditions: string[] = [];
  const params: string[] = [];

  if (filters.nombre) {
    conditions.push('nombre = ?');
    params.push(filters.nombre);
  }

  let query = 'SELECT * FROM membresias';
  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  const result = await client.execute(query, params);
  return result.rows;
}

// ─── CREATE ─────────────────────────────────────────────
export async function createMembresia(
  data: MembresiaData, 
  userId: string,
  ip?: string,
  userAgent?: string
) {
  await assertPermission(userId, MEMBRESIA_PERMISSIONS.CREATE);

  if (!data.nombre) throw new Error('El nombre es obligatorio.');
  if (!data.duracion_dias || data.duracion_dias <= 0) {
    throw new Error('duracion_dias debe ser un número positivo.');
  }

  const existing = await getMembresiaById(data.id);
  if (existing) throw new Error('Ya existe una membresía con este ID.');

  await client.execute(
    `INSERT INTO membresias (id, nombre, duracion_dias) VALUES (?, ?, ?)`,
    [data.id, data.nombre, data.duracion_dias]
  );

  await auditLog('CREAR', {
    user_id: userId,
    ip_address: ip,
    user_agent: userAgent,
    table: 'membresias',
    record_id: data.id,
    new_value: data
  });

  return { id: data.id };
}

// ─── UPDATE ─────────────────────────────────────────────
export async function updateMembresia(
  id: string,
  data: MembresiaUpdateData, 
  userId: string,
  ip?: string,
  userAgent?: string
) {
  if (!id) throw new Error('ID obligatorio.');
  await assertPermission(userId, MEMBRESIA_PERMISSIONS.UPDATE);

  if (data.duracion_dias !== undefined && data.duracion_dias <= 0) {
    throw new Error('duracion_dias debe ser positivo.');
  }

  const oldMembresia = await getMembresiaById(id);
  if (!oldMembresia) throw new Error('Membresía no encontrada.');

  const fields: string[] = [];
  const values: (string | number | null)[] = [];

  if (data.nombre !== undefined) {
    fields.push('nombre = ?');
    values.push(data.nombre);
  }
  if (data.duracion_dias !== undefined) {
    fields.push('duracion_dias = ?');
    values.push(data.duracion_dias);
  }

  if (fields.length === 0) return { id };

  const query = `UPDATE membresias SET ${fields.join(', ')} WHERE id = ?`;
  await client.execute(query, [...values, id]);

  await auditLog('ACTUALIZAR', {
    user_id: userId,
    ip_address: ip,
    user_agent: userAgent,
    table: 'membresias',
    record_id: id,
    old_value: oldMembresia,
    new_value: { ...oldMembresia, ...data }
  });

  return { id };
}

// ─── DELETE ─────────────────────────────────────────────
export async function deleteMembresia(id: string, userId: string, ip?: string, userAgent?: string) {
  if (!id) throw new Error('ID obligatorio.');
  await assertPermission(userId, MEMBRESIA_PERMISSIONS.DELETE);

  const membresia = await getMembresiaById(id);
  if (!membresia) throw new Error('Membresía no encontrada.');

  await client.execute('DELETE FROM membresias WHERE id = ?', [id]);

  await auditLog('ELIMINAR', {
    user_id: userId,
    ip_address: ip,
    user_agent: userAgent,
    table: 'membresias',
    record_id: id,
    old_value: membresia
  });

  return { id };
}