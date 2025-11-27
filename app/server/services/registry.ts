// ⚠️ GENERADO AUTOMÁTICAMENTE — no editar
// Ejecuta: npm run generate:registry

import { AsistenciaService } from './asistencia'
import { SqliteAsistenciaRepository } from '../repositories/impl/SqliteAsistenciaRepository'
import { ClaseRecurrenteService } from './claseRecurrente'
import { SqliteClaseRecurrenteRepository } from '../repositories/impl/SqliteClaseRecurrenteRepository'
import { InstanciaClaseService } from './instanciaClase'
import { SqliteInstanciaClaseRepository } from '../repositories/impl/SqliteInstanciaClaseRepository'
import { LeadService } from './lead'
import { SqliteLeadRepository } from '../repositories/impl/SqliteLeadRepository'
import { MembresiaService } from './membresia'
import { SqliteMembresiaRepository } from '../repositories/impl/SqliteMembresiaRepository'
import { PackService } from './pack'
import { SqlitePackRepository } from '../repositories/impl/SqlitePackRepository'
import { ReservaService } from './reserva'
import { SqliteReservaRepository } from '../repositories/impl/SqliteReservaRepository'

export const serviceRegistry = {
  'asistencia': {
    service: AsistenciaService,
    repo: SqliteAsistenciaRepository
  },
  'clase-recurrente': {
    service: ClaseRecurrenteService,
    repo: SqliteClaseRecurrenteRepository
  },
  'instancia-clase': {
    service: InstanciaClaseService,
    repo: SqliteInstanciaClaseRepository
  },
  'lead': {
    service: LeadService,
    repo: SqliteLeadRepository
  },
  'membresia': {
    service: MembresiaService,
    repo: SqliteMembresiaRepository
  },
  'pack': {
    service: PackService,
    repo: SqlitePackRepository
  },
  'reserva': {
    service: ReservaService,
    repo: SqliteReservaRepository
  }
} as const

export type EntityName = keyof typeof serviceRegistry
export type ServiceFor<E extends EntityName> = InstanceType<typeof serviceRegistry[E]['service']>
export type RepoFor<E extends EntityName> = InstanceType<typeof serviceRegistry[E]['repo']>
