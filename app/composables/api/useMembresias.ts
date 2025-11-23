import client from '~/server/db/client';

export async function getMembresias(filters: { [key: string]: string | number | boolean } = {}) {
  let query = 'SELECT * FROM membresias';
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

export async function createMembresia(data: {
  id: string;
  nombre: string;
  duracion_dias: number;
}) {
  const query = `
    INSERT INTO membresias (
      id,
      nombre,
      duracion_dias
    ) VALUES (?, ?, ?)
  `;
  const params = [
    data.id,
    data.nombre,
    data.duracion_dias
  ];

  await client.execute(query, params);
  return { id: data.id };
}

export async function updateMembresia(id: string, data: {
  nombre?: string;
  duracion_dias?: number;
}) {
  const query = `
    UPDATE membresias
    SET
      nombre = COALESCE(?, nombre),
      duracion_dias = COALESCE(?, duracion_dias)
    WHERE id = ?
  `;
  const params = [
    data.nombre ?? null,
    data.duracion_dias ?? null,
    id
  ];

  await client.execute(query, params);
  return { id };
}

export async function deleteMembresia(id: string) {
  const query = 'DELETE FROM membresias WHERE id = ?';
  const params = [id];

  await client.execute(query, params);
  return { id };
}