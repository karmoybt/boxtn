import type { ClaseRecurrenteData, ClaseRecurrenteFilters } from '../../types/claseRecurrente';
import type { IClaseRecurrenteRepository } from '../IClasesRecurrenteRepository';
import type { InValue } from '@libsql/client';
import client from '../../db/client';

function mapRowToClaseRecurrente(row: Record<string, unknown>): ClaseRecurrenteData {
  return {
    id: String(row.id),
    nombre: String(row.nombre),
    dia_semana: Number(row.dia_semana),
    hora_inicio: String(row.hora_inicio),
    duracion_minutos: Number(row.duracion_minutos),
    coach_id: row.coach_id ? String(row.coach_id) : null,
    capacidad_max: Number(row.capacidad_max),
  };
}

export class SqliteClaseRecurrenteRepository implements IClaseRecurrenteRepository {
  async findById(id: string): Promise<ClaseRecurrenteData | null> {
    const res = await client.execute(
      'SELECT id, nombre, dia_semana, hora_inicio, duracion_minutos, coach_id, capacidad_max FROM clases_recurrentes WHERE id = ?',
      [id]
    );
    const row = res.rows[0];
    return row ? mapRowToClaseRecurrente(row) : null;
  }

  async findBy(filters: ClaseRecurrenteFilters): Promise<ClaseRecurrenteData[]> {
    const allowedKeys = ['nombre', 'dia_semana', 'coach_id'] as const;
    const conditions: string[] = [];
    const params: InValue[] = [];

    for (const key of allowedKeys) {
      if (filters[key] !== undefined) {
        conditions.push(`${key} = ?`);
        params.push(filters[key]!);
      }
    }

    let query = 'SELECT id, nombre, dia_semana, hora_inicio, duracion_minutos, coach_id, capacidad_max FROM clases_recurrentes';
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    const result = await client.execute(query, params);
    return result.rows.map(mapRowToClaseRecurrente);
  }

  async create(data: ClaseRecurrenteData): Promise<void> {
    await client.execute(
      `INSERT INTO clases_recurrentes (id, nombre, dia_semana, hora_inicio, duracion_minutos, coach_id, capacidad_max)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [data.id, data.nombre, data.dia_semana, data.hora_inicio, data.duracion_minutos, data.coach_id, data.capacidad_max]
    );
  }

  async update(id: string, data: Partial<ClaseRecurrenteData>): Promise<void> {
    const fields: string[] = [];
    const values: InValue[] = [];

    (['nombre', 'dia_semana', 'hora_inicio', 'duracion_minutos', 'coach_id', 'capacidad_max'] as const).forEach(key => {
      if (key in data) {
        fields.push(`${key} = ?`);
        values.push(data[key] ?? null);
      }
    });

    if (fields.length === 0) return;

    const query = `UPDATE clases_recurrentes SET ${fields.join(', ')} WHERE id = ?`;
    await client.execute(query, [...values, id]);
  }

  async delete(id: string): Promise<void> {
    await client.execute('DELETE FROM clases_recurrentes WHERE id = ?', [id]);
  }
}