import client from '~/server/db/client';

export async function getClases(filters: { [key: string]: string | number | boolean } = {}) {
  let query = 'SELECT * FROM clases_recurrentes';
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

export async function createClase(data: {
  id: string;
  nombre: string;
  dia_semana: number;
  hora_inicio: string;
  duracion_minutos: number;
  coach_id?: string;
  capacidad_max?: number;
}) {
  const query = `
    INSERT INTO clases_recurrentes (
      id,
      nombre,
      dia_semana,
      hora_inicio,
      duracion_minutos,
      coach_id,
      capacidad_max
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `;
  const params = [
    data.id,
    data.nombre,
    data.dia_semana,
    data.hora_inicio,
    data.duracion_minutos,
    data.coach_id ?? null,
    data.capacidad_max ?? 12
  ];

  await client.execute(query, params);
  return { id: data.id };
}

export async function updateClase(id: string, data: {
  nombre?: string;
  dia_semana?: number;
  hora_inicio?: string;
  duracion_minutos?: number;
  coach_id?: string;
  capacidad_max?: number;
}) {
  const query = `
    UPDATE clases_recurrentes
    SET
      nombre = COALESCE(?, nombre),
      dia_semana = COALESCE(?, dia_semana),
      hora_inicio = COALESCE(?, hora_inicio),
      duracion_minutos = COALESCE(?, duracion_minutos),
      coach_id = COALESCE(?, coach_id),
      capacidad_max = COALESCE(?, capacidad_max)
    WHERE id = ?
  `;
  const params = [
    data.nombre ?? null,
    data.dia_semana ?? null,
    data.hora_inicio ?? null,
    data.duracion_minutos ?? null,
    data.coach_id ?? null,
    data.capacidad_max ?? null,
    id
  ];

  await client.execute(query, params);
  return { id };
}

export async function deleteClase(id: string) {
  const query = 'DELETE FROM clases_recurrentes WHERE id = ?';
  const params = [id];

  await client.execute(query, params);
  return { id };
}