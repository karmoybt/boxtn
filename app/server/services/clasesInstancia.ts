import client from '../db/client';
import { auditLog } from '../log/useAuditLog';
import { assertPermission } from '../utils/assertPermission';
import { INSTANCIA_CLASE_PERMISSIONS } from '../../constants/permissions';

// ─── TIPOS ───────────────────────────────────────────────
export type InstanciaClaseFilters = Partial<{
  clase_recurrente_id: string;
  fecha: string; // 'YYYY-MM-DD'
  coach_id: string;
  estado_id: number;
}>;

export type InstanciaClaseData = {
  id: string;
  clase_recurrente_id: string;
  fecha: string; // 'YYYY-MM-DD'
  hora_inicio: string; // 'HH:mm'
  duracion_minutos: number;
  coach_id: string;
  estado_id: number;
  capacidad_max?: number;
};

export type InstanciaClaseUpdateData = Partial<Omit<InstanciaClaseData, 'id'>>;

// ─── UTILS ───────────────────────────────────────────────
async function getInstanciaClaseById(id: string) {
  const res = await client.execute('SELECT * FROM instancias_clase WHERE id = ?', [id]);
  return res.rows[0] || null;
}

async function instanciaYaExiste(clase_recurrente_id: string, fecha: string): Promise<boolean> {
  const res = await client.execute(
    `SELECT 1 FROM instancias_clase 
     WHERE clase_recurrente_id = ? AND fecha = ?`,
    [clase_recurrente_id, fecha]
  );
  return res.rows.length > 0;
}

// ─── READ ───────────────────────────────────────────────
export async function getInstanciasClase(filters: InstanciaClaseFilters = {}, userId: string) {
  await assertPermission(userId, INSTANCIA_CLASE_PERMISSIONS.READ);

  const allowedKeys = ['clase_recurrente_id', 'fecha', 'coach_id', 'estado_id'] as const;
  const conditions: string[] = [];
  const params: (string | number)[] = [];

  for (const key of allowedKeys) {
    if (filters[key] !== undefined) {
      conditions.push(`${key} = ?`);
      params.push(filters[key]!);
    }
  }

  let query = 'SELECT * FROM instancias_clase';
  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  const result = await client.execute(query, params);
  return result.rows;
}

// ─── CREATE ─────────────────────────────────────────────
export async function createInstanciaClase(
  data: InstanciaClaseData,
  userId: string,
  ip?: string,
  userAgent?: string
) {
  await assertPermission(userId, INSTANCIA_CLASE_PERMISSIONS.CREATE);

  // Validaciones básicas
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data.fecha)) {
    throw new Error('fecha debe tener formato YYYY-MM-DD.');
  }
  if (!/^\d{2}:\d{2}$/.test(data.hora_inicio)) {
    throw new Error('hora_inicio debe tener formato HH:mm.');
  }
  if (!data.duracion_minutos || data.duracion_minutos <= 0) {
    throw new Error('duracion_minutos debe ser un número positivo.');
  }
  if (!data.coach_id) throw new Error('coach_id es obligatorio.');
  if (!data.estado_id) throw new Error('estado_id es obligatorio.');

  // Evitar duplicados
  const duplicada = await instanciaYaExiste(data.clase_recurrente_id, data.fecha);
  if (duplicada) {
    throw new Error('Ya existe una instancia para esta clase recurrente en la fecha indicada.');
  }

  const capacidad_max = data.capacidad_max ?? 12;

  await client.execute(
    `INSERT INTO instancias_clase (
      id, clase_recurrente_id, fecha, hora_inicio, duracion_minutos,
      coach_id, estado_id, capacidad_max
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.id,
      data.clase_recurrente_id,
      data.fecha,
      data.hora_inicio,
      data.duracion_minutos,
      data.coach_id,
      data.estado_id,
      capacidad_max
    ]
  );

  await auditLog('CREAR', {
    user_id: userId,
    ip_address: ip,
    user_agent: userAgent,
    table: 'instancias_clase',
    record_id: data.id,
    new_value: data
  });

  return { id: data.id };
}

// ─── UPDATE ─────────────────────────────────────────────
export async function updateInstanciaClase(
  id: string,
  data: InstanciaClaseUpdateData,
  userId: string,
  ip?: string,
  userAgent?: string
) {
  if (!id) throw new Error('ID obligatorio.');
  await assertPermission(userId, INSTANCIA_CLASE_PERMISSIONS.UPDATE);

  const oldInstancia = await getInstanciaClaseById(id);
  if (!oldInstancia) throw new Error('Instancia de clase no encontrada.');

  // Validaciones condicionales
  if (data.fecha !== undefined && !/^\d{4}-\d{2}-\d{2}$/.test(data.fecha)) {
    throw new Error('fecha debe tener formato YYYY-MM-DD.');
  }
  if (data.hora_inicio !== undefined && !/^\d{2}:\d{2}$/.test(data.hora_inicio)) {
    throw new Error('hora_inicio debe tener formato HH:mm.');
  }
  if (data.duracion_minutos !== undefined && data.duracion_minutos <= 0) {
    throw new Error('duracion_minutos debe ser positivo.');
  }

  // Si se intenta cambiar clase_recurrente_id + fecha, verificar duplicado
    if (
    (data.clase_recurrente_id !== undefined || data.fecha !== undefined) &&
    (data.clase_recurrente_id !== oldInstancia.clase_recurrente_id ||
        data.fecha !== oldInstancia.fecha)
    ) {
    const nuevaClaseId = (data.clase_recurrente_id ?? String(oldInstancia.clase_recurrente_id)).toString();
    const nuevaFecha = (data.fecha ?? String(oldInstancia.fecha)).toString();

    if (!nuevaClaseId || !nuevaFecha) {
        throw new Error('Faltan datos obligatorios en la instancia.');
    }

    const duplicada = await instanciaYaExiste(nuevaClaseId, nuevaFecha);
    if (duplicada) {
        throw new Error('Ya existe otra instancia para esa clase recurrente en la fecha indicada.');
    }
    }

  const fields: string[] = [];
  const values: (string | number | null)[] = [];

  ([
    'clase_recurrente_id',
    'fecha',
    'hora_inicio',
    'duracion_minutos',
    'coach_id',
    'estado_id',
    'capacidad_max'
  ] as const).forEach(key => {
    if (key in data) {
      fields.push(`${key} = ?`);
      values.push(data[key] ?? null);
    }
  });

  if (fields.length === 0) return { id };

  const query = `UPDATE instancias_clase SET ${fields.join(', ')} WHERE id = ?`;
  await client.execute(query, [...values, id]);

  await auditLog('ACTUALIZAR', {
    user_id: userId,
    ip_address: ip,
    user_agent: userAgent,
    table: 'instancias_clase',
    record_id: id,
    old_value: oldInstancia,
    new_value: { ...oldInstancia, ...data }
  });

  return { id };
}

// ─── DELETE ─────────────────────────────────────────────
export async function deleteInstanciaClase(id: string, userId: string, ip?: string, userAgent?: string) {
  if (!id) throw new Error('ID obligatorio.');
  await assertPermission(userId, INSTANCIA_CLASE_PERMISSIONS.DELETE);

  const instancia = await getInstanciaClaseById(id);
  if (!instancia) throw new Error('Instancia de clase no encontrada.');

  await client.execute('DELETE FROM instancias_clase WHERE id = ?', [id]);

  await auditLog('ELIMINAR', {
    user_id: userId,
    ip_address: ip,
    user_agent: userAgent,
    table: 'instancias_clase',
    record_id: id,
    old_value: instancia
  });

  return { id };
}