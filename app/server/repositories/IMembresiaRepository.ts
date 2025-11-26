// app/server/repositories/IMembresiaRepository.ts
import type { MembresiaData, MembresiaFilters } from '../types/membresia';

export interface IMembresiaRepository {
  findById(id: string): Promise<MembresiaData | null>;
  findBy(filters: MembresiaFilters): Promise<MembresiaData[]>;
  create(data: MembresiaData): Promise<void>;
  update(id: string, data: Partial<MembresiaData>): Promise<void>;
  deleteById(id: string): Promise<void>;
}