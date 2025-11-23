// app/server/utils/getUserRole.ts
import client from '~/server/db/client';

export async function getUserRole(userId: string): Promise<number | null> {
  const result = await client.execute(
    'SELECT rol_id FROM usuarios WHERE id = ?',
    [userId]
  );
  const rawRoleId = result.rows[0]?.rol_id;
  return rawRoleId != null ? Number(rawRoleId) : null;
}