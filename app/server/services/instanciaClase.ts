// clasesInstancia.ts
import type { InstanciaClaseData, InstanciaClaseFilters } from '../types/InstanciaClase';
import type { IInstanciaClaseRepository } from '../repositories/IInstanciaClaseRepository';
import { assertPermission } from '../utils/getPermisos';
import { auditLog } from '../log/useAuditLog';
import { INSTANCIA_CLASE_PERMISSIONS } from '../../constants/permissions';
import { randomUUID } from 'node:crypto';

export class InstanciaClaseService {
  constructor(private repo: IInstanciaClaseRepository) {}

  async getInstanciasClase(filters: InstanciaClaseFilters = {}, userId: string) {
    await assertPermission(userId, INSTANCIA_CLASE_PERMISSIONS.READ);
    return await this.repo.findBy(filters);
  }

  async createInstanciaClase(
    data: InstanciaClaseData,
    userId: string,
    ip?: string,
    userAgent?: string
  ) {
    await assertPermission(userId, INSTANCIA_CLASE_PERMISSIONS.CREATE);

    if (!/^\d{4}-\d{2}-\d{2}$/.test(data.fecha)) {
      throw new Error('fecha debe tener formato YYYY-MM-DD.');
    }
    if (!/^\d{2}:\d{2}$/.test(data.hora_inicio)) {
      throw new Error('hora_inicio debe tener formato HH:mm.');
    }
    if (!data.duracion_minutos || data.duracion_minutos <= 0) {
      throw new Error('duracion_minutos debe ser un número positivo.');
    }
    if (!data.coach_id) throw new Error('coach_id es obligatorio.');
    if (!data.estado_id) throw new Error('estado_id es obligatorio.');

    const duplicada = await this.repo.exists(data.clase_recurrente_id, data.fecha);
    if (duplicada) {
      throw new Error('Ya existe una instancia para esta clase recurrente en la fecha indicada.');
    }

    // ✅ Generamos el ID aquí antes de insertar
    const id = randomUUID();
    const capacidad_max = data.capacidad_max ?? 12;

    // Insertamos con el ID generado
    await this.repo.create({ ...data, id, capacidad_max });

    // ✅ Usamos ese ID en el log y en el return
    await auditLog('CREAR', {
      user_id: userId,
      ip_address: ip,
      user_agent: userAgent,
      table: 'instancias_clase',
      record_id: id,
      new_value: { ...data, id, capacidad_max }
    });

    return { id };
  }

  async updateInstanciaClase(
    id: string,
    data: Partial<InstanciaClaseData>,
    userId: string,
    ip?: string,
    userAgent?: string
  ) {
    if (!id) throw new Error('ID obligatorio.');
    await assertPermission(userId, INSTANCIA_CLASE_PERMISSIONS.UPDATE);

    const oldInstancia = await this.repo.findById(id);
    if (!oldInstancia) throw new Error('Instancia de clase no encontrada.');

    if (data.fecha !== undefined && !/^\d{4}-\d{2}-\d{2}$/.test(data.fecha)) {
      throw new Error('fecha debe tener formato YYYY-MM-DD.');
    }
    if (data.hora_inicio !== undefined && !/^\d{2}:\d{2}$/.test(data.hora_inicio)) {
      throw new Error('hora_inicio debe tener formato HH:mm.');
    }
    if (data.duracion_minutos !== undefined && data.duracion_minutos <= 0) {
      throw new Error('duracion_minutos debe ser positivo.');
    }

    if (
      (data.clase_recurrente_id !== undefined || data.fecha !== undefined) &&
      (data.clase_recurrente_id !== oldInstancia.clase_recurrente_id ||
        data.fecha !== oldInstancia.fecha)
    ) {
      const nuevaClaseId = data.clase_recurrente_id ?? oldInstancia.clase_recurrente_id;
      const nuevaFecha = data.fecha ?? oldInstancia.fecha;
      const duplicada = await this.repo.exists(nuevaClaseId, nuevaFecha);
      if (duplicada) {
        throw new Error('Ya existe otra instancia para esa clase recurrente en la fecha indicada.');
      }
    }

    await this.repo.update(id, data);

    await auditLog('ACTUALIZAR', {
      user_id: userId,
      ip_address: ip,
      user_agent: userAgent,
      table: 'instancias_clase',
      record_id: id,
      old_value: oldInstancia,
      new_value: { ...oldInstancia, ...data }
    });

    return { id };
  }

  async deleteInstanciaClase(id: string, userId: string, ip?: string, userAgent?: string) {
    if (!id) throw new Error('ID obligatorio.');
    await assertPermission(userId, INSTANCIA_CLASE_PERMISSIONS.DELETE);

    const instancia = await this.repo.findById(id);
    if (!instancia) throw new Error('Instancia de clase no encontrada.');

    await this.repo.delete(id);

    await auditLog('ELIMINAR', {
      user_id: userId,
      ip_address: ip,
      user_agent: userAgent,
      table: 'instancias_clase',
      record_id: id,
      old_value: instancia
    });

    return { id };
  }
}