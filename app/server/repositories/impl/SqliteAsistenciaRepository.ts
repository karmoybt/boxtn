import type { AsistenciaData, AsistenciaFilters } from '../../types/asistencia';
import type { IAsistenciaRepository } from '../IAsistenciaRepository';
import type { InValue } from '@libsql/client';
import client from '../../db/client';

function mapRowToAsistencia(row: Record<string, unknown>): AsistenciaData {
  return {
    id: String(row.id),
    usuario_id: String(row.usuario_id),
    instancia_clase_id: String(row.instancia_clase_id),
  };
}

export class SqliteAsistenciaRepository implements IAsistenciaRepository {
  async findById(id: string): Promise<AsistenciaData | null> {
    const res = await client.execute(
      'SELECT id, usuario_id, instancia_clase_id FROM asistencias WHERE id = ?',
      [id]
    );
    const row = res.rows[0];
    return row ? mapRowToAsistencia(row) : null;
  }

  async findBy(filters: AsistenciaFilters): Promise<AsistenciaData[]> {
    const allowedKeys = ['usuario_id', 'instancia_clase_id'] as const;
    const conditions: string[] = [];
    const params: InValue[] = [];

    for (const key of allowedKeys) {
      if (filters[key] !== undefined) {
        conditions.push(`${key} = ?`);
        params.push(filters[key]!);
      }
    }

    let query = 'SELECT id, usuario_id, instancia_clase_id FROM asistencias';
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    const result = await client.execute(query, params);
    return result.rows.map(mapRowToAsistencia);
  }

  async create(data: AsistenciaData): Promise<void> {
    await client.execute(
      'INSERT INTO asistencias (id, usuario_id, instancia_clase_id) VALUES (?, ?, ?)',
      [data.id, data.usuario_id, data.instancia_clase_id]
    );
  }

  async delete(id: string): Promise<void> {
    await client.execute('DELETE FROM asistencias WHERE id = ?', [id]);
  }
}