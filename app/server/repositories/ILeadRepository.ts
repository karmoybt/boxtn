import type { LeadData, LeadFilters } from '../types/lead';

export interface ILeadRepository {
  findById(id: string): Promise<LeadData | null>;
  findBy(filters: LeadFilters): Promise<LeadData[]>;
  create(data: LeadData): Promise<void>;
  update(id: string, data: Partial<LeadData>): Promise<void>;
  delete(id: string): Promise<void>;
}