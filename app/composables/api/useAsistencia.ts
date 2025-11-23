import client from '~/server/db/client';

export async function getAsistencias(filters: { [key: string]: string | number | boolean } = {}) {
  let query = 'SELECT * FROM asistencias';
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

export async function createAsistencia(data: {
  id: string;
  usuario_id: string;
  instancia_clase_id: string;
}) {
  const query = `
    INSERT INTO asistencias (
      id,
      usuario_id,
      instancia_clase_id
    ) VALUES (?, ?, ?)
  `;
  const params = [
    data.id,
    data.usuario_id,
    data.instancia_clase_id
  ];

  await client.execute(query, params);
  return { id: data.id };
}

export async function deleteAsistencia(id: string) {
  const query = 'DELETE FROM asistencias WHERE id = ?';
  const params = [id];

  await client.execute(query, params);
  return { id };
}