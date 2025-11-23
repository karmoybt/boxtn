import client from '~/server/db/client';

export async function getLeads(filters: { [key: string]: string | number | boolean } = {}) {
  let query = 'SELECT * FROM leads';
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

export async function createLead(data: {
  id: string;
  nombre: string;
  email?: string;
  telefono?: string;
  estado_id: number;
}) {
  const query = `
    INSERT INTO leads (
      id,
      nombre,
      email,
      telefono,
      estado_id
    ) VALUES (?, ?, ?, ?, ?)
  `;
  const params = [
    data.id,
    data.nombre,
    data.email ?? null,
    data.telefono ?? null,
    data.estado_id
  ];

  await client.execute(query, params);
  return { id: data.id };
}

export async function updateLead(id: string, data: {
  nombre?: string;
  email?: string;
  telefono?: string;
  estado_id?: number;
}) {
  const query = `
    UPDATE leads
    SET
      nombre = COALESCE(?, nombre),
      email = COALESCE(?, email),
      telefono = COALESCE(?, telefono),
      estado_id = COALESCE(?, estado_id)
    WHERE id = ?
  `;
  const params = [
    data.nombre ?? null,
    data.email ?? null,
    data.telefono ?? null,
    data.estado_id ?? null,
    id
  ];

  await client.execute(query, params);
  return { id };
}

export async function deleteLead(id: string) {
  const query = 'DELETE FROM leads WHERE id = ?';
  const params = [id];

  await client.execute(query, params);
  return { id };
}