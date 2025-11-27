// app/server/services/clasesRecurrentes.ts

import type { ClaseRecurrenteData, ClaseRecurrenteFilters } from '../types/claseRecurrente';
import type { IClaseRecurrenteRepository } from '../repositories/IClasesRecurrenteRepository';
import { assertPermission } from '../utils/getPermisos';
import { auditLog } from '../log/useAuditLog';
import { CLASE_RECURRENTE_PERMISSIONS } from '../../constants/permissions';

export class ClaseRecurrenteService {
  constructor(private repo: IClaseRecurrenteRepository) {}

  async getClasesRecurrentes(filters: ClaseRecurrenteFilters = {}, userId: string) {
    await assertPermission(userId, CLASE_RECURRENTE_PERMISSIONS.READ);
    return await this.repo.findBy(filters);
  }

  async createClaseRecurrente(
    data: ClaseRecurrenteData,
    userId: string,
    ip?: string,
    userAgent?: string
  ) {
    await assertPermission(userId, CLASE_RECURRENTE_PERMISSIONS.CREATE);

    if (!data.nombre) throw new Error('El nombre es obligatorio.');
    if (typeof data.dia_semana !== 'number' || data.dia_semana < 0 || data.dia_semana > 6) {
      throw new Error('dia_semana debe ser un número entre 0 y 6.');
    }
    if (!/^\d{2}:\d{2}$/.test(data.hora_inicio)) {
      throw new Error('hora_inicio debe tener formato HH:mm.');
    }
    if (!data.duracion_minutos || data.duracion_minutos <= 0) {
      throw new Error('duracion_minutos debe ser un número positivo.');
    }

    const existing = await this.repo.findById(data.id);
    if (existing) throw new Error('Ya existe una clase recurrente con este ID.');

    const capacidad_max = data.capacidad_max ?? 12;
    const coach_id = data.coach_id ?? null;

    await this.repo.create({ ...data, capacidad_max, coach_id });

    await auditLog('CREAR', {
      user_id: userId,
      ip_address: ip,
      user_agent: userAgent,
      table: 'clases_recurrentes',
      record_id: data.id,
      new_value: data
    });

    return { id: data.id };
  }

  async updateClaseRecurrente(
    id: string,
    data: Partial<ClaseRecurrenteData>,
    userId: string,
    ip?: string,
    userAgent?: string
  ) {
    if (!id) throw new Error('ID obligatorio.');
    await assertPermission(userId, CLASE_RECURRENTE_PERMISSIONS.UPDATE);

    const oldClase = await this.repo.findById(id);
    if (!oldClase) throw new Error('Clase recurrente no encontrada.');

    if (data.dia_semana !== undefined && (data.dia_semana < 0 || data.dia_semana > 6)) {
      throw new Error('dia_semana debe estar entre 0 y 6.');
    }
    if (data.hora_inicio !== undefined && !/^\d{2}:\d{2}$/.test(data.hora_inicio)) {
      throw new Error('hora_inicio debe tener formato HH:mm.');
    }
    if (data.duracion_minutos !== undefined && data.duracion_minutos <= 0) {
      throw new Error('duracion_minutos debe ser positivo.');
    }

    await this.repo.update(id, data);

    await auditLog('ACTUALIZAR', {
      user_id: userId,
      ip_address: ip,
      user_agent: userAgent,
      table: 'clases_recurrentes',
      record_id: id,
      old_value: oldClase,
      new_value: { ...oldClase, ...data }
    });

    return { id };
  }

  async deleteClaseRecurrente(id: string, userId: string, ip?: string, userAgent?: string) {
    if (!id) throw new Error('ID obligatorio.');
    await assertPermission(userId, CLASE_RECURRENTE_PERMISSIONS.DELETE);

    const clase = await this.repo.findById(id);
    if (!clase) throw new Error('Clase recurrente no encontrada.');

    await this.repo.delete(id);

    await auditLog('ELIMINAR', {
      user_id: userId,
      ip_address: ip,
      user_agent: userAgent,
      table: 'clases_recurrentes',
      record_id: id,
      old_value: clase
    });

    return { id };
  }
}