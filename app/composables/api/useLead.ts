import client from '~/server/db/client';

// Función para obtener leads con filtros opcionales
export async function getLeads(filters: { [key: string]: string | number | boolean } = {}, userRole: string) {
  // Verificar permisos
  if (!['Admin', 'Coach', 'Miembro'].includes(userRole)) {
    throw new Error('No tiene permiso para ver leads.');
  }

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

// Función para crear un lead
export async function createLead(data: {
  id: string;
  nombre: string;
  email?: string;
  telefono?: string;
  estado_id: number;
}, userRole: string) {
  // Verificar permisos
  if (!['Admin', 'Coach'].includes(userRole)) {
    throw new Error('No tiene permiso para crear leads.');
  }

  // Validaciones
  if (!data.nombre) {
    throw new Error('El nombre es obligatorio.');
  }
  if (!data.estado_id) {
    throw new Error('El estado es obligatorio.');
  }

  // Verificar duplicados
  const existingLead = await client.execute('SELECT * FROM leads WHERE id = ?', [data.id]);
  if (existingLead.rows.length > 0) {
    throw new Error('Ya existe un lead con este ID.');
  }

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

// Función para actualizar un lead
export async function updateLead(id: string, data: {
  nombre?: string;
  email?: string;
  telefono?: string;
  estado_id?: number;
}, userRole: string) {
  // Verificar permisos
  if (!['Admin', 'Coach'].includes(userRole)) {
    throw new Error('No tiene permiso para actualizar leads.');
  }

  // Validaciones
  if (!id) {
    throw new Error('El ID del lead es obligatorio.');
  }

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

// Función para eliminar un lead
export async function deleteLead(id: string, userRole: string) {
  // Verificar permisos
  if (!['Admin', 'Coach'].includes(userRole)) {
    throw new Error('No tiene permiso para eliminar leads.');
  }

  const query = 'DELETE FROM leads WHERE id = ?';
  const params = [id];

  await client.execute(query, params);
  return { id };
}