import client from '~/server/db/client';

export async function getPacks(filters: { [key: string]: string | number | boolean } = {}) {
  let query = 'SELECT * FROM packs_clases';
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

export async function createPack(data: {
  id: string;
  nombre: string;
  creditos: number;
  duracion_dias: number;
}) {
  const query = `
    INSERT INTO packs_clases (
      id,
      nombre,
      creditos,
      duracion_dias
    ) VALUES (?, ?, ?, ?)
  `;
  const params = [
    data.id,
    data.nombre,
    data.creditos,
    data.duracion_dias
  ];

  await client.execute(query, params);
  return { id: data.id };
}

export async function updatePack(id: string, data: {
  nombre?: string;
  creditos?: number;
  duracion_dias?: number;
}) {
  const query = `
    UPDATE packs_clases
    SET
      nombre = COALESCE(?, nombre),
      creditos = COALESCE(?, creditos),
      duracion_dias = COALESCE(?, duracion_dias)
    WHERE id = ?
  `;
  const params = [
    data.nombre ?? null,
    data.creditos ?? null,
    data.duracion_dias ?? null,
    id
  ];

  await client.execute(query, params);
  return { id };
}

export async function deletePack(id: string) {
  const query = 'DELETE FROM packs_clases WHERE id = ?';
  const params = [id];

  await client.execute(query, params);
  return { id };
}