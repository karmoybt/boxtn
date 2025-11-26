import type { PackData, PackFilters } from '../../types/packs';
import type { IPackRepository } from '../IPackRepository';
import type { InValue } from '@libsql/client';
import client from '../../db/client';

function mapRowToPack(row: Record<string, unknown>): PackData {
  return {
    id: String(row.id),
    nombre: String(row.nombre),
    creditos: Number(row.creditos),
    duracion_dias: Number(row.duracion_dias),
  };
}

export class SqlitePackRepository implements IPackRepository {
  async findById(id: string): Promise<PackData | null> {
    const res = await client.execute(
      'SELECT id, nombre, creditos, duracion_dias FROM packs_clases WHERE id = ?',
      [id]
    );
    const row = res.rows[0];
    return row ? mapRowToPack(row) : null;
  }

  async findBy(filters: PackFilters): Promise<PackData[]> {
    const conditions: string[] = [];
    const params: InValue[] = [];

    if (filters.nombre !== undefined) {
      conditions.push('nombre = ?');
      params.push(filters.nombre);
    }

    let query = 'SELECT id, nombre, creditos, duracion_dias FROM packs_clases';
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    const result = await client.execute(query, params);
    return result.rows.map(mapRowToPack);
  }

  async create(pack: PackData): Promise<void> {
    await client.execute(
      'INSERT INTO packs_clases (id, nombre, creditos, duracion_dias) VALUES (?, ?, ?, ?)',
      [pack.id, pack.nombre, pack.creditos, pack.duracion_dias]
    );
  }

  async update(id: string, data: Partial<PackData>): Promise<void> {
    const fields: string[] = [];
    const values: InValue[] = [];

    if (data.nombre !== undefined) {
      fields.push('nombre = ?');
      values.push(data.nombre);
    }
    if (data.creditos !== undefined) {
      fields.push('creditos = ?');
      values.push(data.creditos);
    }
    if (data.duracion_dias !== undefined) {
      fields.push('duracion_dias = ?');
      values.push(data.duracion_dias);
    }

    if (fields.length === 0) return;

    const query = `UPDATE packs_clases SET ${fields.join(', ')} WHERE id = ?`;
    await client.execute(query, [...values, id]);
  }

  async delete(id: string): Promise<void> {
    await client.execute('DELETE FROM packs_clases WHERE id = ?', [id]);
  }
}