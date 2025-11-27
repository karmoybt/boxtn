// asistencia.ts
import type { AsistenciaData, AsistenciaFilters } from '../types/asistencia';
import type { IAsistenciaRepository } from '../repositories/IAsistenciaRepository';
import { assertPermission } from '../utils/getPermisos';
import { auditLog } from '../log/useAuditLog';
import { ASISTENCIA_PERMISSIONS } from '../../constants/permissions';

export class AsistenciaService {
  constructor(private repo: IAsistenciaRepository) {}

  async getAsistencias(filters: AsistenciaFilters = {}, userId: string) {
    await assertPermission(userId, ASISTENCIA_PERMISSIONS.READ);
    return await this.repo.findBy(filters);
  }

  async createAsistencia(data: AsistenciaData, userId: string, ip?: string, userAgent?: string) {
    await assertPermission(userId, ASISTENCIA_PERMISSIONS.CREATE);
    if (!data.usuario_id) throw new Error('usuario_id es obligatorio.');
    if (!data.instancia_clase_id) throw new Error('instancia_clase_id es obligatorio.');

    const existing = await this.repo.findById(data.id);
    if (existing) throw new Error('Ya existe una asistencia con este ID.');

    await this.repo.create(data);

    await auditLog('CREAR', {
      user_id: userId,
      ip_address: ip,
      user_agent: userAgent,
      table: 'asistencias',
      record_id: data.id,
      new_value: data,
    });

    return { id: data.id };
  }

  async deleteAsistencia(id: string, userId: string, ip?: string, userAgent?: string) {
    if (!id) throw new Error('ID obligatorio.');
    await assertPermission(userId, ASISTENCIA_PERMISSIONS.DELETE);

    const asistencia = await this.repo.findById(id);
    if (!asistencia) throw new Error('Asistencia no encontrada.');

    await this.repo.delete(id);

    await auditLog('ELIMINAR', {
      user_id: userId,
      ip_address: ip,
      user_agent: userAgent,
      table: 'asistencias',
      record_id: id,
      old_value: asistencia,
    });

    return { id };
  }
}