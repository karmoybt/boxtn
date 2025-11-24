export const LEAD_PERMISSIONS = {
  READ: 'leads:read',
  CREATE: 'leads:create',
  UPDATE: 'leads:update',
  DELETE: 'leads:delete'
} as const;
export type LeadPermission = typeof LEAD_PERMISSIONS [keyof typeof LEAD_PERMISSIONS];

export const ASISTENCIA_PERMISSIONS = {
  READ: 'asistencia:read',
  CREATE: 'asistencia:create',
  DELETE: 'asistencia:delete'
} as const
export type AsistenciasPermission = typeof ASISTENCIA_PERMISSIONS [keyof typeof ASISTENCIA_PERMISSIONS];
