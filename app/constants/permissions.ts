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
}
export type AsistenciasPermission = typeof ASISTENCIA_PERMISSIONS [keyof typeof ASISTENCIA_PERMISSIONS];

export const CLASE_RECURRENTE_PERMISSIONS = {
  READ: 'clase_recurrente:read',
  CREATE: 'clase_recurrente:create',
  UPDATE: 'clase_recurrente:update',
  DELETE: 'clase_recurrente:delete'
} as const;
export type ClaseRecurrentePermission = typeof CLASE_RECURRENTE_PERMISSIONS[keyof typeof CLASE_RECURRENTE_PERMISSIONS];

export const INSTANCIA_CLASE_PERMISSIONS = {
  READ: 'instancia_clase:read',
  CREATE: 'instancia_clase:create',
  UPDATE: 'instancia_clase:update',
  DELETE: 'instancia_clase:delete'
} as const;
export type InstanciaClasePermission = typeof INSTANCIA_CLASE_PERMISSIONS[keyof typeof INSTANCIA_CLASE_PERMISSIONS];

export const RESERVA_PERMISSIONS = {
  READ: 'reserva:read',
  CREATE: 'reserva:create',  
  UPDATE: 'reserva:update',
  DELETE: 'reserva:delete'    
}
export type ReservaPermission = typeof RESERVA_PERMISSIONS[keyof typeof RESERVA_PERMISSIONS];

export const MEMBRESIA_PERMISSIONS = {
  READ: 'membresia:read',
  CREATE: 'membresia:create',
  UPDATE: 'membresia:update',
  DELETE: 'membresia:delete'
}
export type MembresiaPermission = typeof MEMBRESIA_PERMISSIONS[keyof typeof MEMBRESIA_PERMISSIONS];

export const PACK_PERMISSIONS = {
  READ: 'pack:read',
  CREATE: 'pack:create',
  UPDATE: 'pack:update',
  DELETE: 'pack:delete'
}
export type PackPermission = typeof PACK_PERMISSIONS[keyof typeof PACK_PERMISSIONS];
