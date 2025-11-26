import type { PackData, PackFilters } from '../types/packs';

export interface IPackRepository {
  findById(id: string): Promise<PackData | null>;
  findBy(filters: PackFilters): Promise<PackData[]>;
  create(packData: PackData): Promise<void>;
  update(id: string, data: Partial<PackData>): Promise<void>;
  delete(id: string): Promise<void>;
}