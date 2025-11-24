import client from '../db/client';
import { auditLog } from '../log/useAuditLog';
import { assertPermission } from '../utils/assertPermission';
 import { LEAD_PERMISSIONS } from '../../constants/permissions';

// ─── TIPOS ───────────────────────────────────────────────
export type LeadFilters = Partial<{
  nombre: string;
  email: string;
  estado_id: number;
}>;

export type LeadData = {
  id: string;
  nombre: string;
  email?: string | null;
  telefono?: string | null;
  estado_id: number;
};

export type LeadUpdateData = Partial<Omit<LeadData, 'id'>>;

// ─── UTILS ───────────────────────────────────────────────
async function getLeadById(id: string) {
  const res = await client.execute('SELECT * FROM leads WHERE id = ?', [id]);
  return res.rows[0] || null;
}

// ─── READ ───────────────────────────────────────────────
export async function getLeads(filters: LeadFilters = {}, userId: string) {
  await assertPermission(userId, LEAD_PERMISSIONS.READ);

  const allowedKeys = ['nombre', 'email', 'estado_id'] as const;
  const conditions: string[] = [];
  const params: (string | number)[] = [];

  for (const key of allowedKeys) {
    if (filters[key] !== undefined) {
      conditions.push(`${key} = ?`);
      params.push(filters[key]!);
    }
  }

  let query = 'SELECT * FROM leads';
  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  const result = await client.execute(query, params);
  return result.rows;
}

// ─── CREATE ─────────────────────────────────────────────
export async function createLead(data: LeadData, userId: string, ip?: string, userAgent?: string) {
  await assertPermission(userId, LEAD_PERMISSIONS.CREATE);

  if (!data.nombre) throw new Error('El nombre es obligatorio.');
  if (!data.estado_id) throw new Error('El estado es obligatorio.');

  const existing = await getLeadById(data.id);
  if (existing) throw new Error('Ya existe un lead con este ID.');

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
  if (!id) throw new Error('ID obligatorio.');
  await assertPermission(userId, LEAD_PERMISSIONS.UPDATE);

  const oldLead = await getLeadById(id);
  if (!oldLead) throw new Error('Lead no encontrado.');

  const fields: string[] = [];
  const values: (string | number | null)[] = [];

  (['nombre', 'email', 'telefono', 'estado_id'] as const).forEach(key => {
    if (key in data) {
      fields.push(`${key} = ?`);
      values.push(data[key] ?? null);
    }
  });

  if (fields.length === 0) return { id };

  const query = `UPDATE leads SET ${fields.join(', ')} WHERE id = ?`;
  await client.execute(query, [...values, id]);

  await auditLog('ACTUALIZAR', {
    user_id: userId,
    ip_address: ip,
    user_agent: userAgent,
    table: 'leads',
    record_id: id,
    old_value: oldLead,
    new_value: { ...oldLead, ...data }
  });

  return { id };
}

// ─── DELETE ─────────────────────────────────────────────
export async function deleteLead(id: string, userId: string, ip?: string, userAgent?: string) {
  if (!id) throw new Error('ID obligatorio.');
  await assertPermission(userId, LEAD_PERMISSIONS.DELETE);

  const lead = await getLeadById(id);
  if (!lead) throw new Error('Lead no encontrado.');

  await client.execute('DELETE FROM leads WHERE id = ?', [id]);

  await auditLog('ELIMINAR', {
    user_id: userId,
    ip_address: ip,
    user_agent: userAgent,
    table: 'leads',
    record_id: id,
    old_value: lead
  });

  return { id };
}