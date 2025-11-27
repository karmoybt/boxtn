// app/server/services/membresia.ts

import type { MembresiaData, MembresiaFilters } from '../types/membresia';
import type { IMembresiaRepository } from '../repositories/IMembresiaRepository';
import { assertPermission } from '../utils/getPermisos';
import { auditLog } from '../log/useAuditLog';
import { MEMBRESIA_PERMISSIONS } from '../../constants/permissions';

export class MembresiaService {
  constructor(private repo: IMembresiaRepository) {}

  async getMembresias(filters: MembresiaFilters = {}, userId: string) {
    await assertPermission(userId, MEMBRESIA_PERMISSIONS.READ);
    return await this.repo.findBy(filters);
  }

  async createMembresia(
    data: MembresiaData,
    userId: string,
    ip?: string,
    userAgent?: string
  ) {
    await assertPermission(userId, MEMBRESIA_PERMISSIONS.CREATE);

    if (!data.nombre) throw new Error('El nombre es obligatorio.');
    if (!data.duracion_dias || data.duracion_dias <= 0) {
      throw new Error('duracion_dias debe ser un número positivo.');
    }

    const existing = await this.repo.findById(data.id);
    if (existing) throw new Error('Ya existe una membresía con este ID.');

    await this.repo.create(data);

    await auditLog('CREAR', {
      user_id: userId,
      ip_address: ip,
      user_agent: userAgent,
      table: 'membresias',
      record_id: data.id,
      new_value: data
    });

    return { id: data.id };
  }

  async updateMembresia(
    id: string,
    data: Partial<MembresiaData>,
    userId: string,
    ip?: string,
    userAgent?: string
  ) {
    if (!id) throw new Error('ID obligatorio.');
    await assertPermission(userId, MEMBRESIA_PERMISSIONS.UPDATE);

    if (data.duracion_dias !== undefined && data.duracion_dias <= 0) {
      throw new Error('duracion_dias debe ser positivo.');
    }

    const oldMembresia = await this.repo.findById(id);
    if (!oldMembresia) throw new Error('Membresía no encontrada.');

    await this.repo.update(id, data);

    await auditLog('ACTUALIZAR', {
      user_id: userId,
      ip_address: ip,
      user_agent: userAgent,
      table: 'membresias',
      record_id: id,
      old_value: oldMembresia,
      new_value: { ...oldMembresia, ...data }
    });

    return { id };
  }

  async deleteMembresia(id: string, userId: string, ip?: string, userAgent?: string) {
    if (!id) throw new Error('ID obligatorio.');
    await assertPermission(userId, MEMBRESIA_PERMISSIONS.DELETE);

    const membresia = await this.repo.findById(id);
    if (!membresia) throw new Error('Membresía no encontrada.');

    await this.repo.deleteById(id); // ⚠️ Asegúrate de que el repo tenga `deleteById`

    await auditLog('ELIMINAR', {
      user_id: userId,
      ip_address: ip,
      user_agent: userAgent,
      table: 'membresias',
      record_id: id,
      old_value: membresia
    });

    return { id };
  }
}