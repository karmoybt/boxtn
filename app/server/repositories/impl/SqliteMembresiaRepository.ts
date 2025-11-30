// app/server/repositories/impl/SqliteMembresiaRepository.ts
import type { MembresiaData, MembresiaFilters } from '../../types/membresia';
import type { IMembresiaRepository } from '../IMembresiaRepository';
import type { InValue } from '@libsql/client';
import client from '../../db/client';

function mapRowToMembresia(row: Record<string, unknown>): MembresiaData {
  return {
    id: String(row.id),
    nombre: String(row.nombre),
    duracion_dias: Number(row.duracion_dias),
  };
}

export class SqliteMembresiaRepository implements IMembresiaRepository {
  async findById(id: string): Promise<MembresiaData | null> {
    const res = await client.execute(
      'SELECT id, nombre, duracion_dias FROM membresias WHERE id = ?',
      [id]
    );
    const row = res.rows[0];
    return row ? mapRowToMembresia(row) : null;
  }

  async findBy(filters: MembresiaFilters): Promise<MembresiaData[]> {
    const conditions: string[] = [];
    const params: InValue[] = [];

    if (filters.nombre !== undefined) {
      conditions.push('nombre = ?');
      params.push(filters.nombre);
    }

    let query = 'SELECT id, nombre, duracion_dias FROM membresias';
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    const result = await client.execute(query, params);
    return result.rows.map(mapRowToMembresia);
  }

  async create(data: MembresiaData): Promise<void> {
    await client.execute(
      'INSERT INTO membresias (id, nombre, duracion_dias) VALUES (?, ?, ?)',
      [data.id, data.nombre, data.duracion_dias]
    );
  }

  async update(id: string, data: Partial<MembresiaData>): Promise<void> {
    const fields: string[] = [];
    const values: InValue[] = [];

    if (data.nombre !== undefined) {
      fields.push('nombre = ?');
      values.push(data.nombre);
    }
    if (data.duracion_dias !== undefined) {
      fields.push('duracion_dias = ?');
      values.push(data.duracion_dias);
    }

    if (fields.length === 0) return;

    const query = `UPDATE membresias SET ${fields.join(', ')} WHERE id = ?`;
    await client.execute(query, [...values, id]);
  }

  async delete(id: string): Promise<void> {
    await client.execute('DELETE FROM membresias WHERE id = ?', [id]);
  }
}