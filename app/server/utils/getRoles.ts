import client from '~/server/db/client';

async function getPermissionsByRole(role: string): Promise<string[]> {
  const query = `
    SELECT p.nombre
    FROM roles_permisos rp
    JOIN permisos p ON rp.permiso_id = p.id
    JOIN roles r ON rp.rol_id = r.id
    WHERE r.nombre = ?
  `;
  const result = await client.execute(query, [role]);
  return result.rows.map(row => row.nombre as string);
}

export default getPermissionsByRole;