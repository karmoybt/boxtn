// app/server/services/leads.ts

import type { LeadData, LeadFilters } from '../types/lead';
import type { ILeadRepository } from '../repositories/ILeadRepository';
import { assertPermission } from '../utils/getPermisos';
import { auditLog } from '../log/useAuditLog';
import { LEAD_PERMISSIONS } from '../../constants/permissions';

export class LeadService {
  constructor(private repo: ILeadRepository) {}

  async get(filters: LeadFilters = {}, userId: string) {
    await assertPermission(userId, LEAD_PERMISSIONS.READ);
    return await this.repo.findBy(filters);
  }

  async create(data: LeadData, userId: string, ip?: string, userAgent?: string) {
    await assertPermission(userId, LEAD_PERMISSIONS.CREATE);

    if (!data.nombre) throw new Error('El nombre es obligatorio.');
    if (!data.estado_id) throw new Error('El estado es obligatorio.');

    const existing = await this.repo.findById(data.id);
    if (existing) throw new Error('Ya existe un lead con este ID.');

    await this.repo.create(data);

    await auditLog('CREAR', {
      user_id: userId,
      ip_address: ip,
      user_agent: userAgent,
      table: 'leads',
      record_id: data.id,
      new_value: data
    });

    return { id: data.id };
  }

  async update(
    id: string,
    data: Partial<LeadData>,
    userId: string,
    ip?: string,
    userAgent?: string
  ) {
    if (!id) throw new Error('ID obligatorio.');
    await assertPermission(userId, LEAD_PERMISSIONS.UPDATE);

    const oldLead = await this.repo.findById(id);
    if (!oldLead) throw new Error('Lead no encontrado.');

    await this.repo.update(id, data);

    await auditLog('ACTUALIZAR', {
      user_id: userId,
      ip_address: ip,
      user_agent: userAgent,
      table: 'leads',
      record_id: id,
      old_value: oldLead,
      new_value: { ...oldLead, ...data }
    });

    return { id };
  }

  async delete(id: string, userId: string, ip?: string, userAgent?: string) {
    if (!id) throw new Error('ID obligatorio.');
    await assertPermission(userId, LEAD_PERMISSIONS.DELETE);

    const lead = await this.repo.findById(id);
    if (!lead) throw new Error('Lead no encontrado.');

    await this.repo.delete(id);

    await auditLog('ELIMINAR', {
      user_id: userId,
      ip_address: ip,
      user_agent: userAgent,
      table: 'leads',
      record_id: id,
      old_value: lead
    });

    return { id };
  }
}