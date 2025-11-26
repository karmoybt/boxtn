import type { AsistenciaData, AsistenciaFilters } from '../types/asistencia';
import type { IAsistenciaRepository } from '../repositories/IAsistenciaRepository';
import { assertPermission } from '../utils/assertPermission';
import { auditLog } from '../log/useAuditLog';
import { ASISTENCIA_PERMISSIONS } from '../../constants/permissions';

export function makeAsistenciaService(repo: IAsistenciaRepository) {
  return {
    async getAsistencias(filters: AsistenciaFilters = {}, userId: string) {
      await assertPermission(userId, ASISTENCIA_PERMISSIONS.READ);

      return await repo.findBy(filters);
    },

    async createAsistencia(data: AsistenciaData, userId: string, ip?: string, userAgent?: string) {
      await assertPermission(userId, ASISTENCIA_PERMISSIONS.CREATE);

      if (!data.usuario_id) throw new Error('usuario_id es obligatorio.');
      if (!data.instancia_clase_id) throw new Error('instancia_clase_id es obligatorio.');

      const existing = await repo.findById(data.id);
      if (existing) throw new Error('Ya existe una asistencia con este ID.');

      await repo.create(data);

      await auditLog('CREAR', {
        user_id: userId,
        ip_address: ip,
        user_agent: userAgent,
        table: 'asistencias',
        record_id: data.id,
        new_value: data,
      });

      return { id: data.id };
    },

    async deleteAsistencia(id: string, userId: string, ip?: string, userAgent?: string) {
      if (!id) throw new Error('ID obligatorio.');
      await assertPermission(userId, ASISTENCIA_PERMISSIONS.DELETE);

      const asistencia = await repo.findById(id);
      if (!asistencia) throw new Error('Asistencia no encontrada.');

      await repo.delete(id);

      await auditLog('ELIMINAR', {
        user_id: userId,
        ip_address: ip,
        user_agent: userAgent,
        table: 'asistencias',
        record_id: id,
        old_value: asistencia,
      });

      return { id };
    },
  };
}