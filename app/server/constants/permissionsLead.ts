export const LEAD_PERMISSIONS = {
  READ: 'leads:read',
  CREATE: 'leads:create',
  UPDATE: 'leads:update',
  DELETE: 'leads:delete'
} as const;

export type LeadPermission = typeof LEAD_PERMISSIONS[keyof typeof LEAD_PERMISSIONS];