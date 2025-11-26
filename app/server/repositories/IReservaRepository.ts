import type { ReservaData, ReservaFilters } from '../types/reserva';

export interface IReservaRepository {
  findById(id: string): Promise<ReservaData | null>;
  findByUsuarioInstancia(usuario_id: string, instancia_clase_id: string): Promise<ReservaData | null>;
  findBy(usuario_id: string, filters: ReservaFilters): Promise<ReservaData[]>;
  create(data: ReservaData): Promise<void>;
  update(id: string, data: Pick<ReservaData, 'estado_id'>): Promise<void>;
  delete(id: string): Promise<void>;
}