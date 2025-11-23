import client from '~/server/db/client';

export async function getInstancias(filters: { [key: string]: string | number | boolean } = {}) {
  let query = 'SELECT * FROM instancias_clase';
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

export async function createInstancia(data: {
  clase_recurrente_id: string;
  fecha: string;
  hora_inicio: string;
  duracion_minutos: number;
  coach_id?: string;
  estado_id: number;
}) {
  const query = `
    INSERT INTO instancias_clase (
      clase_recurrente_id,
      fecha,
      hora_inicio,
      duracion_minutos,
      coach_id,
      estado_id
    ) VALUES (?, ?, ?, ?, ?, ?)
  `;
  const params = [
    data.clase_recurrente_id,
    data.fecha,
    data.hora_inicio,
    data.duracion_minutos,
    data.coach_id ?? null, // Usar null si coach_id es undefined
    data.estado_id
  ];

  await client.execute(query, params);
  return { id: data.clase_recurrente_id }; // Puedes ajustar esto para devolver el ID generado
}

export async function updateInstancia(id: string, data: {
  clase_recurrente_id?: string;
  fecha?: string;
  hora_inicio?: string;
  duracion_minutos?: number;
  coach_id?: string;
  estado_id?: number;
}) {
  const query = `
    UPDATE instancias_clase
    SET
      clase_recurrente_id = COALESCE(?, clase_recurrente_id),
      fecha = COALESCE(?, fecha),
      hora_inicio = COALESCE(?, hora_inicio),
      duracion_minutos = COALESCE(?, duracion_minutos),
      coach_id = COALESCE(?, coach_id),
      estado_id = COALESCE(?, estado_id)
    WHERE id = ?
  `;
  const params = [
    data.clase_recurrente_id ?? null,
    data.fecha ?? null,
    data.hora_inicio ?? null,
    data.duracion_minutos ?? null,
    data.coach_id ?? null,
    data.estado_id ?? null,
    id
  ];

  await client.execute(query, params);
  return { id }; // Puedes ajustar esto para devolver el objeto actualizado
}

export async function deleteInstancia(id: string) {
  const query = 'DELETE FROM instancias_clase WHERE id = ?';
  const params = [id];

  await client.execute(query, params);
  return { id }; // Puedes ajustar esto para devolver el ID eliminado
}