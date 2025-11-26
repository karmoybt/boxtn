import type { InstanciaClaseData, InstanciaClaseFilters } from '../types/InstanciaClase';

export interface IInstanciaClaseRepository {
  findById(id: string): Promise<InstanciaClaseData | null>;
  findBy(filters: InstanciaClaseFilters): Promise<InstanciaClaseData[]>;
  exists(clase_recurrente_id: string, fecha: string): Promise<boolean>;
  create(data: InstanciaClaseData): Promise<void>;
  update(id: string, data: Partial<InstanciaClaseData>): Promise<void>;
  delete(id: string): Promise<void>;
}