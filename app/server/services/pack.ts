import type { PackData, PackFilters } from '../types/packs';
import type { IPackRepository } from '../repositories/IPackRepository';
import { assertPermission } from '../utils/assertPermission';
import { auditLog } from '../log/useAuditLog';
import { PACK_PERMISSIONS } from '../../constants/permissions';

export function makePackService(repo: IPackRepository) {
  return {
    async getPacks(filters: PackFilters = {}, userId: string) {
      await assertPermission(userId, PACK_PERMISSIONS.READ);
      return await repo.findBy(filters);
    },

    async createPack(pack: PackData, userId: string, ip?: string, userAgent?: string) {
      await assertPermission(userId, PACK_PERMISSIONS.CREATE);

      if (!pack.nombre) throw new Error('El nombre es obligatorio.');
      if (!pack.creditos || pack.creditos <= 0) {
        throw new Error('creditos debe ser un número positivo.');
      }
      if (!pack.duracion_dias || pack.duracion_dias <= 0) {
        throw new Error('duracion_dias debe ser un número positivo.');
      }

      const existing = await repo.findById(pack.id);
      if (existing) throw new Error('Ya existe un pack con este ID.');

      await repo.create(pack);

      await auditLog('CREAR', {
        user_id: userId,
        ip_address: ip,
        user_agent: userAgent,
        table: 'packs_clases',
        record_id: pack.id,
        new_value: pack
      });

      return { id: pack.id };
    },

    async updatePack(id: string, data: Partial<PackData>, userId: string, ip?: string, userAgent?: string) {
      if (!id) throw new Error('ID obligatorio.');
      await assertPermission(userId, PACK_PERMISSIONS.UPDATE);

      if (data.creditos !== undefined && data.creditos <= 0) {
        throw new Error('creditos debe ser positivo.');
      }
      if (data.duracion_dias !== undefined && data.duracion_dias <= 0) {
        throw new Error('duracion_dias debe ser positivo.');
      }

      const oldPack = await repo.findById(id);
      if (!oldPack) throw new Error('Pack no encontrado.');

      await repo.update(id, data);

      await auditLog('ACTUALIZAR', {
        user_id: userId,
        ip_address: ip,
        user_agent: userAgent,
        table: 'packs_clases',
        record_id: id,
        old_value: oldPack,
        new_value: { ...oldPack, ...data }
      });

      return { id };
    },

    async deletePack(id: string, userId: string, ip?: string, userAgent?: string) {
      if (!id) throw new Error('ID obligatorio.');
      await assertPermission(userId, PACK_PERMISSIONS.DELETE);

      const pack = await repo.findById(id);
      if (!pack) throw new Error('Pack no encontrado.');

      await repo.delete(id);

      await auditLog('ELIMINAR', {
        user_id: userId,
        ip_address: ip,
        user_agent: userAgent,
        table: 'packs_clases',
        record_id: id,
        old_value: pack
      });

      return { id };
    },
  };
}