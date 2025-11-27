import type { ClaseRecurrenteData, ClaseRecurrenteFilters } from '../types/claseRecurrente';

export interface IClaseRecurrenteRepository {
  findById(id: string): Promise<ClaseRecurrenteData | null>;
  findBy(filters: ClaseRecurrenteFilters): Promise<ClaseRecurrenteData[]>;
  create(data: ClaseRecurrenteData): Promise<void>;
  update(id: string, data: Partial<ClaseRecurrenteData>): Promise<void>;
  delete(id: string): Promise<void>;
}