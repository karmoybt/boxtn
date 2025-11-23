import client from '~/server/db/client';

export type Permission = string; 

export default async function getPermissionsByRole(roleId: number): Promise<Permission[]> {
  const query = `
    SELECT p.nombre
    FROM roles_permisos rp
    JOIN permisos p ON rp.permiso_id = p.id
    WHERE rp.rol_id = ?
  `;
  const result = await client.execute(query, [roleId]);
  return result.rows.map(row => row.nombre as string);
}