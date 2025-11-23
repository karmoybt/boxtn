import client from '~/server/db/client';

export async function getReservas(filters: { [key: string]: string | number | boolean } = {}) {
  let query = 'SELECT * FROM reservas';
  const params: (string | number | boolean)[] = [];

  if (Object.keys(filters).length > 0) {
    const conditions = Object.keys(filters).map((key, _index) => {
      const value = filters[key];
      if (value === undefined) {
        throw new Error(`El valor para el filtro ${key} es undefined.`);
      }
      params.push(value);
      return `${key} = ?`;
    }).join(' AND ');

    query += ` WHERE ${conditions}`;
  }

  const result = await client.execute(query, params);
  return result.rows;
}

export async function createReserva(data: {
  id: string;
  usuario_id: string;
  instancia_clase_id: string;
  estado_id: number;
}) {
  const query = `
    INSERT INTO reservas (
      id,
      usuario_id,
      instancia_clase_id,
      estado_id
    ) VALUES (?, ?, ?, ?)
  `;
  const params = [
    data.id,
    data.usuario_id,
    data.instancia_clase_id,
    data.estado_id
  ];

  await client.execute(query, params);
  return { id: data.id };
}

export async function updateReserva(id: string, data: {
  usuario_id?: string;
  instancia_clase_id?: string;
  estado_id?: number;
}) {
  const query = `
    UPDATE reservas
    SET
      usuario_id = COALESCE(?, usuario_id),
      instancia_clase_id = COALESCE(?, instancia_clase_id),
      estado_id = COALESCE(?, estado_id)
    WHERE id = ?
  `;
  const params = [
    data.usuario_id ?? null,
    data.instancia_clase_id ?? null,
    data.estado_id ?? null,
    id
  ];

  await client.execute(query, params);
  return { id };
}

export async function deleteReserva(id: string) {
  const query = 'DELETE FROM reservas WHERE id = ?';
  const params = [id];

  await client.execute(query, params);
  return { id };
}