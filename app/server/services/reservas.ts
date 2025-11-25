import client from '../db/client';
import { auditLog } from '../log/useAuditLog';
import { assertPermission } from '../utils/assertPermission';
import { RESERVA_PERMISSIONS } from '../../constants/permissions';

// Estados permitidos (de tu SQL)
const ESTADOS_PERMITIDOS = [10, 11, 12]; // confirmada, lista_de_espera, cancelada

// ─── TIPOS ───────────────────────────────────────────────
export type ReservaFilters = Partial<{
  instancia_clase_id: string;
  estado_id: number;
  // userId NO está aquí porque se infiere del auth
}>;

export type ReservaCreateData = {
  id: string;
  instancia_clase_id: string;
  // userId se pasa explícitamente desde el endpoint (pero es igual a userId autenticado)
};

export type ReservaUpdateData = {
  estado_id: number; // normalmente solo se cambia el estado
};

// ─── UTILS ───────────────────────────────────────────────
async function getReservaById(id: string) {
  const res = await client.execute('SELECT * FROM reservas WHERE id = ?', [id]);
  return res.rows[0] || null;
}

async function getReservaByUsuarioInstancia(userId: string, instancia_clase_id: string) {
  const res = await client.execute(
    'SELECT * FROM reservas WHERE userId = ? AND instancia_clase_id = ?',
    [userId, instancia_clase_id]
  );
  return res.rows[0] || null;
}

// ─── READ ───────────────────────────────────────────────
export async function getReservas(filters: ReservaFilters = {}, userId: string) {
  await assertPermission(userId, RESERVA_PERMISSIONS.READ);

  const conditions: string[] = ['userId = ?']; 
  const params: (string | number)[] = [userId];

  if (filters.instancia_clase_id) {
    conditions.push('instancia_clase_id = ?');
    params.push(filters.instancia_clase_id);
  }
  if (filters.estado_id !== undefined) {
    conditions.push('estado_id = ?');
    params.push(filters.estado_id);
  }

  const query = `SELECT * FROM reservas WHERE ${conditions.join(' AND ')}`;
  const result = await client.execute(query, params);
  return result.rows;
}

// ─── CREATE ─────────────────────────────────────────────
export async function createReserva(
  data: ReservaCreateData,
  userId: string, 
  ip?: string,
  userAgent?: string
) {
  const { id, instancia_clase_id } = data;

  const existing = await getReservaByUsuarioInstancia(userId, instancia_clase_id);
  if (existing) {
    throw new Error('Ya tienes una reserva para esta instancia de clase.');
  }

  // Estado inicial: confirmada (10) o lista de espera (11) → lo decides en el endpoint o lógica de negocio
  // Aquí asumimos que se crea como "confirmada", pero podrías pasar un estado por parámetro si es flexible
  const estado_id = 10; // o lógica para decidir según capacidad

  await client.execute(
    `INSERT INTO reservas (id, userId, instancia_clase_id, estado_id)
     VALUES (?, ?, ?, ?)`,
    [id, userId, instancia_clase_id, estado_id]
  );

  await auditLog('CREAR', {
    user_id: userId,
    ip_address: ip,
    user_agent: userAgent,
    table: 'reservas',
    record_id: id,
    new_value: { id, userId, instancia_clase_id, estado_id }
  });

  return { id };
}

// ─── UPDATE ─────────────────────────────────────────────
export async function updateReserva(
  id: string,
  data: ReservaUpdateData,
  userId: string,
  ip?: string,
  userAgent?: string
) {
  if (!id) throw new Error('ID obligatorio.');
  await assertPermission(userId, RESERVA_PERMISSIONS.UPDATE);

  if (!ESTADOS_PERMITIDOS.includes(data.estado_id)) {
    throw new Error('estado_id debe ser 10, 11 o 12.');
  }

  const oldReserva = await getReservaById(id);
  if (!oldReserva) throw new Error('Reserva no encontrada.');

  await client.execute(
    `UPDATE reservas SET estado_id = ? WHERE id = ?`,
    [data.estado_id, id]
  );

  await auditLog('ACTUALIZAR', {
    user_id: userId,
    ip_address: ip,
    user_agent: userAgent,
    table: 'reservas',
    record_id: id,
    old_value: oldReserva,
    new_value: { ...oldReserva, estado_id: data.estado_id }
  });

  return { id };
}

// ─── DELETE ─────────────────────────────────────────────
export async function deleteReserva(id: string, userId: string, ip?: string, userAgent?: string) {
  if (!id) throw new Error('ID obligatorio.');
  await assertPermission(userId, RESERVA_PERMISSIONS.DELETE);

  const reserva = await getReservaById(id);
  if (!reserva) throw new Error('Reserva no encontrada.');

  await client.execute('DELETE FROM reservas WHERE id = ?', [id]);

  await auditLog('ELIMINAR', {
    user_id: userId,
    ip_address: ip,
    user_agent: userAgent,
    table: 'reservas',
    record_id: id,
    old_value: reserva
  });

  return { id };
}