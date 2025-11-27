// ⚠️ GENERADO AUTOMÁTICAMENTE — no editar manualmente
// Ejecuta: npm run generate:registry

import { AsistenciaService } from './asistencia'
import { InstanciaClaseService } from './clasesInstancia'
import { ClaseRecurrenteService } from './clasesRecurrentes'
import { LeadService } from './leads'
import { MembresiaService } from './membresia'
import { PackService } from './pack'
import { ReservaService } from './reservas'
import type { IAsistenciaRepository } from '../repositories/IAsistenciaRepository'
import type { IInstanciaClaseRepository } from '../repositories/IInstanciaClaseRepository'
import type { IClaseRecurrenteRepository } from '../repositories/IClasesRecurrenteRepository'
import type { ILeadRepository } from '../repositories/ILeadRepository'
import type { IMembresiaRepository } from '../repositories/IMembresiaRepository'
import type { IPackRepository } from '../repositories/IPackRepository'
import type { IReservaRepository } from '../repositories/IReservaRepository'

export interface CrudService<T> {
  findById(id: string): Promise<T | null>
  findMany(query: Record<string, unknown>): Promise<T[]>
  create(data: Record<string, unknown> | T): Promise<T>
  update(id: string, data: Record<string, unknown> | T): Promise<T>
  delete(id: string): Promise<boolean>
}

export const serviceRegistry = {
  'asistencia': { service: AsistenciaService },
  'clases-instancia': { service: InstanciaClaseService },
  'clases-recurrentes': { service: ClaseRecurrenteService },
  'leads': { service: LeadService },
  'membresia': { service: MembresiaService },
  'pack': { service: PackService },
  'reservas': { service: ReservaService }
} as const

type _RepoTypeMap = {
  'asistencia': IAsistenciaRepository,
  'clases-instancia': IInstanciaClaseRepository,
  'clases-recurrentes': IClaseRecurrenteRepository,
  'leads': ILeadRepository,
  'membresia': IMembresiaRepository,
  'pack': IPackRepository,
  'reservas': IReservaRepository
}

export type EntityName = keyof typeof serviceRegistry
export type ServiceFor<E extends EntityName> = InstanceType<typeof serviceRegistry[E]['service']>
export type RepoFor<E extends EntityName> = _RepoTypeMap[E]
