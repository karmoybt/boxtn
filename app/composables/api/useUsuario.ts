import client from '~/server/db/client';

export async function getUsuarios(filters: { [key: string]: string | number | boolean } = {}) {
  let query = 'SELECT * FROM usuarios';
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

export async function createUsuario(data: {
  id: string;
  nombre: string;
  email: string;
  telefono?: string;
  idioma?: string;
  rol: string;
}) {
  const query = `
    INSERT INTO usuarios (
      id,
      nombre,
      email,
      telefono,
      idioma,
      rol
    ) VALUES (?, ?, ?, ?, ?, ?)
  `;
  const params = [
    data.id,
    data.nombre,
    data.email,
    data.telefono ?? null,
    data.idioma ?? 'es',
    data.rol
  ];

  await client.execute(query, params);
  return { id: data.id };
}

export async function updateUsuario(id: string, data: {
  nombre?: string;
  email?: string;
  telefono?: string;
  idioma?: string;
  rol?: string;
}) {
  const query = `
    UPDATE usuarios
    SET
      nombre = COALESCE(?, nombre),
      email = COALESCE(?, email),
      telefono = COALESCE(?, telefono),
      idioma = COALESCE(?, idioma),
      rol = COALESCE(?, rol)
    WHERE id = ?
  `;
  const params = [
    data.nombre ?? null,
    data.email ?? null,
    data.telefono ?? null,
    data.idioma ?? null,
    data.rol ?? null,
    id
  ];

  await client.execute(query, params);
  return { id };
}

export async function deleteUsuario(id: string) {
  const query = 'DELETE FROM usuarios WHERE id = ?';
  const params = [id];

  await client.execute(query, params);
  return { id };
}