import type { ReservaData, ReservaFilters } from '../types/reserva'

export interface IReservaRepository {
  findById(id: string): Promise<ReservaData | null>
  findBy(filters: ReservaFilters): Promise<ReservaData[]> 
  update(id: string, data: Pick<ReservaData, 'estado_id'>): Promise<void>
  delete(id: string): Promise<void>
}