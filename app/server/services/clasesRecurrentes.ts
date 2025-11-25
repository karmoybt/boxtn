import client from '../db/client';
import { auditLog } from '../log/useAuditLog';
import { assertPermission } from '../utils/assertPermission';
import { CLASE_RECURRENTE_PERMISSIONS } from '../../constants/permissions';

// ─── TIPOS ───────────────────────────────────────────────
export type ClaseRecurrenteFilters = Partial<{
  nombre: string;
  dia_semana: number;
  coach_id: string;
}>;

export type ClaseRecurrenteData = {
  id: string;
  nombre: string;
  dia_semana: number; // 0 = domingo, ..., 6 = sábado
  hora_inicio: string; // formato 'HH:mm'
  duracion_minutos: number;
  coach_id?: string | null;
  capacidad_max?: number;
};

export type ClaseRecurrenteUpdateData = Partial<Omit<ClaseRecurrenteData, 'id'>>;

// ─── UTILS ───────────────────────────────────────────────
async function getClaseRecurrenteById(id: string) {
  const res = await client.execute('SELECT * FROM clases_recurrentes WHERE id = ?', [id]);
  return res.rows[0] || null;
}

// ─── READ ───────────────────────────────────────────────
export async function getClasesRecurrentes(filters: ClaseRecurrenteFilters = {}, userId: string) {
  await assertPermission(userId, CLASE_RECURRENTE_PERMISSIONS.READ);

  const allowedKeys = ['nombre', 'dia_semana', 'coach_id'] as const;
  const conditions: string[] = [];
  const params: (string | number)[] = [];

  for (const key of allowedKeys) {
    if (filters[key] !== undefined) {
      conditions.push(`${key} = ?`);
      params.push(filters[key]!);
    }
  }

  let query = 'SELECT * FROM clases_recurrentes';
  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  const result = await client.execute(query, params);
  return result.rows;
}

// ─── CREATE ─────────────────────────────────────────────
export async function createClaseRecurrente(
  data: ClaseRecurrenteData,
  userId: string,
  ip?: string,
  userAgent?: string
) {
  await assertPermission(userId, CLASE_RECURRENTE_PERMISSIONS.CREATE);

  if (!data.nombre) throw new Error('El nombre es obligatorio.');
  if (typeof data.dia_semana !== 'number' || data.dia_semana < 0 || data.dia_semana > 6) {
    throw new Error('dia_semana debe ser un número entre 0 y 6.');
  }
  if (!/^\d{2}:\d{2}$/.test(data.hora_inicio)) {
    throw new Error('hora_inicio debe tener formato HH:mm.');
  }
  if (!data.duracion_minutos || data.duracion_minutos <= 0) {
    throw new Error('duracion_minutos debe ser un número positivo.');
  }

  const existing = await getClaseRecurrenteById(data.id);
  if (existing) throw new Error('Ya existe una clase recurrente con este ID.');

  const capacidad_max = data.capacidad_max ?? 12;

  await client.execute(
    `INSERT INTO clases_recurrentes (id, nombre, dia_semana, hora_inicio, duracion_minutos, coach_id, capacidad_max)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [data.id, data.nombre, data.dia_semana, data.hora_inicio, data.duracion_minutos, data.coach_id ?? null, capacidad_max]
  );

  await auditLog('CREAR', {
    user_id: userId,
    ip_address: ip,
    user_agent: userAgent,
    table: 'clases_recurrentes',
    record_id: data.id,
    new_value: data
  });

  return { id: data.id };
}

// ─── UPDATE ─────────────────────────────────────────────
export async function updateClaseRecurrente(
  id: string,
  data: ClaseRecurrenteUpdateData,
  userId: string,
  ip?: string,
  userAgent?: string
) {
  if (!id) throw new Error('ID obligatorio.');
  await assertPermission(userId, CLASE_RECURRENTE_PERMISSIONS.UPDATE);

  const oldClase = await getClaseRecurrenteById(id);
  if (!oldClase) throw new Error('Clase recurrente no encontrada.');

  // Validaciones opcionales solo si se proporcionan
  if (data.dia_semana !== undefined && (data.dia_semana < 0 || data.dia_semana > 6)) {
    throw new Error('dia_semana debe estar entre 0 y 6.');
  }
  if (data.hora_inicio !== undefined && !/^\d{2}:\d{2}$/.test(data.hora_inicio)) {
    throw new Error('hora_inicio debe tener formato HH:mm.');
  }
  if (data.duracion_minutos !== undefined && data.duracion_minutos <= 0) {
    throw new Error('duracion_minutos debe ser positivo.');
  }

  const fields: string[] = [];
  const values: (string | number | null)[] = [];

  (['nombre', 'dia_semana', 'hora_inicio', 'duracion_minutos', 'coach_id', 'capacidad_max'] as const).forEach(key => {
    if (key in data) {
      fields.push(`${key} = ?`);
      values.push(data[key] ?? null);
    }
  });

  if (fields.length === 0) return { id };

  const query = `UPDATE clases_recurrentes SET ${fields.join(', ')} WHERE id = ?`;
  await client.execute(query, [...values, id]);

  await auditLog('ACTUALIZAR', {
    user_id: userId,
    ip_address: ip,
    user_agent: userAgent,
    table: 'clases_recurrentes',
    record_id: id,
    old_value: oldClase,
    new_value: { ...oldClase, ...data }
  });

  return { id };
}

// ─── DELETE (opcional, no mencionado en requisitos pero posible) ───────
export async function deleteClaseRecurrente(id: string, userId: string, ip?: string, userAgent?: string) {
  if (!id) throw new Error('ID obligatorio.');
  await assertPermission(userId, CLASE_RECURRENTE_PERMISSIONS.DELETE); // solo si lo permites

  const clase = await getClaseRecurrenteById(id);
  if (!clase) throw new Error('Clase recurrente no encontrada.');

  await client.execute('DELETE FROM clases_recurrentes WHERE id = ?', [id]);

  await auditLog('ELIMINAR', {
    user_id: userId,
    ip_address: ip,
    user_agent: userAgent,
    table: 'clases_recurrentes',
    record_id: id,
    old_value: clase
  });

  return { id };
}