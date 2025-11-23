import client from '../db/client';
import { auditLog } from '../log/useAuditLog'; // asumiendo que esto corre en server
import { assertPermission } from '../utils/assertPermission';
import { LEAD_PERMISSIONS } from '../constants/permissionsLead';

// ─── TIPOS ───────────────────────────────────────────────
export type LeadFilters = Partial<Record<'nombre' | 'email' | 'estado_id', string | number>>;
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
  await assertPermission(userId, 'READ');

  const allowedKeys = ['nombre', 'email', 'estado_id'] as const;
  const safeFilters = {} as Record<string, any>;
  const values: any[] = [];

  for (const key of allowedKeys) {
    if (key in filters && filters[key] !== undefined) {
      safeFilters[key] = filters[key];
      values.push(filters[key]);
    }
  }

  let query = 'SELECT * FROM leads';
  if (Object.keys(safeFilters).length > 0) {
    const conditions = Object.keys(safeFilters).map(() => '?? = ?').join(' AND ');
    query += ` WHERE ${conditions}`;
  }

  // Nota: Turso/libSQL usa ?? para identificadores seguros
  const result = await client.execute(query, [...Object.keys(safeFilters), ...values]);
  return result.rows;
}

// ─── CREATE ─────────────────────────────────────────────
export async function createLead(data: LeadData, userId: string, ip?: string, userAgent?: string) {
  await assertPermission(userId, 'CREATE');

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
  await assertPermission(userId, 'UPDATE');

  const oldLead = await getLeadById(id);
  if (!oldLead) throw new Error('Lead no encontrado.');

  const fields: string[] = [];
  const values: any[] = [];

  (['nombre', 'email', 'telefono', 'estado_id'] as const).forEach(key => {
    if (key in data) {
      fields.push(`?? = ?`);
      values.push(key, data[key] ?? null);
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
  await assertPermission(userId, 'DELETE');

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