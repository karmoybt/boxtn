import type { ReservaCreateData, ReservaFilters, ReservaUpdateData } from '../types/reserva';
import type { IReservaRepository } from '../repositories/IReservaRepository';
import { assertPermission } from '../utils/assertPermission';
import { auditLog } from '../log/useAuditLog';
import { RESERVA_PERMISSIONS } from '../../constants/permissions';

const ESTADOS_PERMITIDOS = [10, 11, 12]; // confirmada, lista_de_espera, cancelada

export function makeReservaService(repo: IReservaRepository) {
  return {
    async getReservas(filters: ReservaFilters = {}, userId: string) {
      await assertPermission(userId, RESERVA_PERMISSIONS.READ);
      return await repo.findBy(userId, filters);
    },

    async createReserva(
      data: ReservaCreateData,
      userId: string,
      ip?: string,
      userAgent?: string
    ) {
      // Validación de unicidad
      const existing = await repo.findByUsuarioInstancia(userId, data.instancia_clase_id);
      if (existing) {
        throw new Error('Ya tienes una reserva para esta instancia de clase.');
      }

      // Estado inicial: 10 = confirmada (puedes ajustar lógica aquí si necesitas lista de espera)
      const estado_id = 10;

      await repo.create({
        id: data.id,
        usuario_id: userId,
        instancia_clase_id: data.instancia_clase_id,
        estado_id,
      });

      await auditLog('CREAR', {
        user_id: userId,
        ip_address: ip,
        user_agent: userAgent,
        table: 'reservas',
        record_id: data.id,
        new_value: { id: data.id, usuario_id: userId, instancia_clase_id: data.instancia_clase_id, estado_id },
      });

      return { id: data.id };
    },

    async updateReserva(
      id: string,
      data: ReservaUpdateData,
      userId: string,
      ip?: string,
      userAgent?: string
    ) {
      if (!id) throw new Error('ID obligatorio.');
      await assertPermission(userId, RESERVA_PERMISSIONS.UPDATE);

      if (!ESTADOS_PERMITIDOS.includes(data.estado_id)) {
        throw new Error('estado_id debe ser 10, 11 o 12.');
      }

      const oldReserva = await repo.findById(id);
      if (!oldReserva) throw new Error('Reserva no encontrada.');

      await repo.update(id, { estado_id: data.estado_id });

      await auditLog('ACTUALIZAR', {
        user_id: userId,
        ip_address: ip,
        user_agent: userAgent,
        table: 'reservas',
        record_id: id,
        old_value: oldReserva,
        new_value: { ...oldReserva, estado_id: data.estado_id },
      });

      return { id };
    },

    async deleteReserva(id: string, userId: string, ip?: string, userAgent?: string) {
      if (!id) throw new Error('ID obligatorio.');
      await assertPermission(userId, RESERVA_PERMISSIONS.DELETE);

      const reserva = await repo.findById(id);
      if (!reserva) throw new Error('Reserva no encontrada.');

      await repo.delete(id);

      await auditLog('ELIMINAR', {
        user_id: userId,
        ip_address: ip,
        user_agent: userAgent,
        table: 'reservas',
        record_id: id,
        old_value: reserva,
      });

      return { id };
    },
  };
}