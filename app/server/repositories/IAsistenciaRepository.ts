import type { AsistenciaData, AsistenciaFilters } from '../types/asistencia';

export interface IAsistenciaRepository {
  findById(id: string): Promise<AsistenciaData | null>;
  findBy(filters: AsistenciaFilters): Promise<AsistenciaData[]>;
  create(data: AsistenciaData): Promise<void>;
  delete(id: string): Promise<void>;
}