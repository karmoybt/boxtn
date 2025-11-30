import type { ReservaData, ReservaFilters } from '../../types/reserva';
import type { IReservaRepository } from '../IReservaRepository';
import type { InValue } from '@libsql/client';
import client from '../../db/client';

function mapRowToReserva(row: Record<string, unknown>): ReservaData {
  return {
    id: String(row.id),
    usuario_id: String(row.usuario_id),
    instancia_clase_id: String(row.instancia_clase_id),
    estado_id: Number(row.estado_id),
  };
}

export class SqliteReservaRepository implements IReservaRepository {
  async findById(id: string): Promise<ReservaData | null> {
    const res = await client.execute(
      'SELECT id, usuario_id, instancia_clase_id, estado_id FROM reservas WHERE id = ?',
      [id]
    );
    const row = res.rows[0];
    return row ? mapRowToReserva(row) : null;
  }

  async findByUsuarioInstancia(usuario_id: string, instancia_clase_id: string): Promise<ReservaData | null> {
    const res = await client.execute(
      'SELECT id, usuario_id, instancia_clase_id, estado_id FROM reservas WHERE usuario_id = ? AND instancia_clase_id = ?',
      [usuario_id, instancia_clase_id]
    );
    const row = res.rows[0];
    return row ? mapRowToReserva(row) : null;
  }

 async findBy(filters: ReservaFilters = {}): Promise<ReservaData[]> {
  const conditions: string[] = [];
  const params: InValue[] = [];

  // Si necesitas filtrar por usuario_id, obténlo de filters
  if (filters.usuario_id !== undefined) {
    conditions.push('usuario_id = ?');
    params.push(filters.usuario_id);
  }
  if (filters.instancia_clase_id !== undefined) {
    conditions.push('instancia_clase_id = ?');
    params.push(filters.instancia_clase_id);
  }
  if (filters.estado_id !== undefined) {
    conditions.push('estado_id = ?');
    params.push(filters.estado_id);
  }

  let query = 'SELECT id, usuario_id, instancia_clase_id, estado_id FROM reservas';
  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  const result = await client.execute(query, params);
  return result.rows.map(mapRowToReserva);
}

  async create(data: ReservaData): Promise<void> {
    await client.execute(
      'INSERT INTO reservas (id, usuario_id, instancia_clase_id, estado_id) VALUES (?, ?, ?, ?)',
      [data.id, data.usuario_id, data.instancia_clase_id, data.estado_id]
    );
  }

  async update(id: string, data: Pick<ReservaData, 'estado_id'>): Promise<void> {
    await client.execute(
      'UPDATE reservas SET estado_id = ? WHERE id = ?',
      [data.estado_id, id]
    );
  }

  async delete(id: string): Promise<void> {
    await client.execute('DELETE FROM reservas WHERE id = ?', [id]);
  }
}