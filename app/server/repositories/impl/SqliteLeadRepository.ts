import type { LeadData, LeadFilters } from '../../types/lead';
import type { ILeadRepository } from '../ILeadRepository';
import type { InValue } from '@libsql/client';
import client from '../../db/client';

function mapRowToLead(row: Record<string, unknown>): LeadData {
  return {
    id: String(row.id),
    nombre: String(row.nombre),
    email: row.email ? String(row.email) : null,
    telefono: row.telefono ? String(row.telefono) : null,
    estado_id: Number(row.estado_id),
  };
}

export class SqliteLeadRepository implements ILeadRepository {
  async findById(id: string): Promise<LeadData | null> {
    const res = await client.execute(
      'SELECT id, nombre, email, telefono, estado_id FROM leads WHERE id = ?',
      [id]
    );
    const row = res.rows[0];
    return row ? mapRowToLead(row) : null;
  }

  async findBy(filters: LeadFilters): Promise<LeadData[]> {
    const allowedKeys = ['nombre', 'email', 'estado_id'] as const;
    const conditions: string[] = [];
    const params: InValue[] = [];

    for (const key of allowedKeys) {
      if (filters[key] !== undefined) {
        conditions.push(`${key} = ?`);
        params.push(filters[key]!);
      }
    }

    let query = 'SELECT id, nombre, email, telefono, estado_id FROM leads';
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    const result = await client.execute(query, params);
    return result.rows.map(mapRowToLead);
  }

  async create(data: LeadData): Promise<void> {
    await client.execute(
      'INSERT INTO leads (id, nombre, email, telefono, estado_id) VALUES (?, ?, ?, ?, ?)',
      [data.id, data.nombre, data.email, data.telefono, data.estado_id]
    );
  }

  async update(id: string, data: Partial<LeadData>): Promise<void> {
    const fields: string[] = [];
    const values: InValue[] = [];

    (['nombre', 'email', 'telefono', 'estado_id'] as const).forEach(key => {
      if (key in data) {
        fields.push(`${key} = ?`);
        values.push(data[key] ?? null);
      }
    });

    if (fields.length === 0) return;

    const query = `UPDATE leads SET ${fields.join(', ')} WHERE id = ?`;
    await client.execute(query, [...values, id]);
  }

  async delete(id: string): Promise<void> {
    await client.execute('DELETE FROM leads WHERE id = ?', [id]);
  }
}