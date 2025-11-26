import type { InstanciaClaseData, InstanciaClaseFilters } from '../../types/InstanciaClase';
import type { IInstanciaClaseRepository } from '../IInstanciaClaseRepository';
import type { InValue } from '@libsql/client';
import client from '../../db/client';

function mapRowToInstanciaClase(row: Record<string, unknown>): InstanciaClaseData {
  return {
    id: String(row.id),
    clase_recurrente_id: String(row.clase_recurrente_id),
    fecha: String(row.fecha),
    hora_inicio: String(row.hora_inicio),
    duracion_minutos: Number(row.duracion_minutos),
    coach_id: String(row.coach_id),
    estado_id: Number(row.estado_id),
    capacidad_max: Number(row.capacidad_max),
  };
}

export class SqliteInstanciaClaseRepository implements IInstanciaClaseRepository {
  async findById(id: string): Promise<InstanciaClaseData | null> {
    const res = await client.execute(
      'SELECT id, clase_recurrente_id, fecha, hora_inicio, duracion_minutos, coach_id, estado_id, capacidad_max FROM instancias_clase WHERE id = ?',
      [id]
    );
    const row = res.rows[0];
    return row ? mapRowToInstanciaClase(row) : null;
  }

  async findBy(filters: InstanciaClaseFilters): Promise<InstanciaClaseData[]> {
    const allowedKeys = ['clase_recurrente_id', 'fecha', 'coach_id', 'estado_id'] as const;
    const conditions: string[] = [];
    const params: InValue[] = [];

    for (const key of allowedKeys) {
      if (filters[key] !== undefined) {
        conditions.push(`${key} = ?`);
        params.push(filters[key]!);
      }
    }

    let query = 'SELECT id, clase_recurrente_id, fecha, hora_inicio, duracion_minutos, coach_id, estado_id, capacidad_max FROM instancias_clase';
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    const result = await client.execute(query, params);
    return result.rows.map(mapRowToInstanciaClase);
  }

  async exists(clase_recurrente_id: string, fecha: string): Promise<boolean> {
    const res = await client.execute(
      'SELECT 1 FROM instancias_clase WHERE clase_recurrente_id = ? AND fecha = ?',
      [clase_recurrente_id, fecha]
    );
    return res.rows.length > 0;
  }

  async create(data: InstanciaClaseData): Promise<void> {
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
        data.capacidad_max
      ]
    );
  }

  async update(id: string, data: Partial<InstanciaClaseData>): Promise<void> {
    const fields: string[] = [];
    const values: InValue[] = [];

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

    if (fields.length === 0) return;

    const query = `UPDATE instancias_clase SET ${fields.join(', ')} WHERE id = ?`;
    await client.execute(query, [...values, id]);
  }

  async delete(id: string): Promise<void> {
    await client.execute('DELETE FROM instancias_clase WHERE id = ?', [id]);
  }
}