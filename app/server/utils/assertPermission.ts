import { getUserRole } from './getUserRole';
import  getPermissionsByRole  from './getRoles';
import { LEAD_PERMISSIONS } from '../constants/permissionsLead';

export async function assertPermission(
  userId: string,
  requiredPermission: keyof typeof LEAD_PERMISSIONS
): Promise<void> {
  const roleId = await getUserRole(userId);
  if (roleId === null) throw new Error('Usuario no encontrado.');

  const permissions = await getPermissionsByRole(roleId);
  if (!permissions.includes(LEAD_PERMISSIONS[requiredPermission])) {
    throw new Error('Permiso denegado.');
  }
}