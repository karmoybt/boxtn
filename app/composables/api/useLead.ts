// app\composables\api\useLead.ts
import client from '~/server/db/client';
import getPermissionsByRole from '~/server/utils/getRoles';
import { getUserRole } from '~/server/utils/getUserRole';
import { auditLog } from '../../server/log/useAuditLog'

// Tipos
type LeadFilters = { [key: string]: string | number | boolean };
type LeadData = {
  id: string;
  nombre: string;
  email?: string;
  telefono?: string;
  estado_id: number;
};
type LeadUpdateData = Partial<Omit<LeadData, 'id'>>;

// ─── READ ───────────────────────────────────────────────
export async function getLeads(filters: LeadFilters = {}, userId: string) {
  const roleId = await getUserRole(userId);
  if (roleId === null) throw new Error('Usuario no encontrado.');
  const permissions = await getPermissionsByRole(roleId);
  if (!permissions.includes('leads:read')) {
    throw new Error('No tiene permiso para ver leads.');
  }

  let query = 'SELECT * FROM leads';
  const params: (string | number | boolean)[] = [];

  if (Object.keys(filters).length > 0) {
    const conditions = Object.keys(filters).map(key => `${key} = ?`).join(' AND ');
    query += ` WHERE ${conditions}`;
    params.push(...Object.values(filters));
  }

  const result = await client.execute(query, params);
  return result.rows;
}

// ─── CREATE ─────────────────────────────────────────────
export async function createLead(data: LeadData, userId: string, ip?: string, userAgent?: string) {
  const roleId = await getUserRole(userId);
  if (roleId === null) throw new Error('Usuario no encontrado.');
  const permissions = await getPermissionsByRole(roleId);
  if (!permissions.includes('leads:create')) {
    throw new Error('No tiene permiso para crear leads.');
  }

  if (!data.nombre) throw new Error('El nombre es obligatorio.');
  if (!data.estado_id) throw new Error('El estado es obligatorio.');

  const existing = await client.execute('SELECT 1 FROM leads WHERE id = ?', [data.id]);
  if (existing.rows.length > 0) {
    throw new Error('Ya existe un lead con este ID.');
  }

  await client.execute(
    `INSERT INTO leads (id, nombre, email, telefono, estado_id) VALUES (?, ?, ?, ?, ?)`,
    [data.id, data.nombre, data.email ?? null, data.telefono ?? null, data.estado_id]
  );
  await auditLog('CREAR', {
    user_id: userId,
    ip_address: ip,
    user_agent: userAgent,
    table: 'leads',
    record_id: data.id,
    new_value: data
  });

  return { id: data.id };
}

// ─── UPDATE ─────────────────────────────────────────────
export async function updateLead(id: string, data: LeadUpdateData, userId: string, ip?: string, userAgent?: string) {
  if (!id) throw new Error('El ID del lead es obligatorio.');

  const roleId = await getUserRole(userId);
  if (roleId === null) throw new Error('Usuario no encontrado.');
  const permissions = await getPermissionsByRole(roleId);
  if (!permissions.includes('leads:update')) {
    throw new Error('No tiene permiso para actualizar leads.');
  }

  const oldResult = await client.execute('SELECT * FROM leads WHERE id = ?', [id]);
  if (oldResult.rows.length === 0) {
    throw new Error('Lead no encontrado.');
  }
  const oldValue = oldResult.rows[0];

  await client.execute(
    `UPDATE leads SET nombre = COALESCE(?, nombre), email = COALESCE(?, email), telefono = COALESCE(?, telefono), estado_id = COALESCE(?, estado_id) WHERE id = ?`,
    [data.nombre ?? null, data.email ?? null, data.telefono ?? null, data.estado_id ?? null, id]
  );

  await auditLog('ACTUALIZAR', {
    user_id: userId,
    ip_address: ip,
    user_agent: userAgent,
    table: 'leads',
    record_id: id,
    old_value: oldValue,
    new_value: { ...oldValue, ...data }
  });

  return { id };
}

// ─── DELETE ─────────────────────────────────────────────
export async function deleteLead(id: string, userId: string, ip?: string, userAgent?: string) {
  if (!id) throw new Error('El ID del lead es obligatorio.');

  const roleId = await getUserRole(userId);
  if (roleId === null) throw new Error('Usuario no encontrado.');
  const permissions = await getPermissionsByRole(roleId);
  if (!permissions.includes('leads:delete')) {
    throw new Error('No tiene permiso para eliminar leads.');
  }
  const result = await client.execute('SELECT * FROM leads WHERE id = ?', [id]);
  if (result.rows.length === 0) {
    throw new Error('Lead no encontrado.');
  }
  const deletedValue = result.rows[0];

  await client.execute('DELETE FROM leads WHERE id = ?', [id]);

  await auditLog('ELIMINAR', {
    user_id: userId,
    ip_address: ip,
    user_agent: userAgent,
    table: 'leads',
    record_id: id,
    old_value: deletedValue
  });

  return { id };
}