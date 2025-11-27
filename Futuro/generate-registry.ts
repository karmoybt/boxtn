// scripts/generate-registry.ts
import { writeFile, readdir } from 'fs/promises'
import { join } from 'path'

const SERVICES_DIR = './server/services'
const REPOS_DIR = './server/repositories'
const OUTPUT_FILE = './server/services/registry.ts'

// Mapeo explícito: archivo → nombres de clase
const CLASS_NAME_MAP: Record<string, { service: string; repo: string }> = {
  'clasesInstancia.ts': {
    service: 'ClasesInstanciaService',
    repo: 'IInstanciaClaseRepository'
  },
  'clasesRecurrentes.ts': {
    service: 'ClasesRecurrentesService',
    repo: 'IClaseRecurrenteRepository'
  },
  'asistencia.ts': {
    service: 'AsistenciaService',
    repo: 'IAsistenciaRepository'
  },
  'leads.ts': {
    service: 'LeadsService',
    repo: 'ILeadRepository'
  },
  'membresia.ts': {
    service: 'MembresiaService',
    repo: 'IMembresiaRepository'
  },
  'pack.ts': {
    service: 'PackService',
    repo: 'IPackRepository'
  },
  'reservas.ts': {
    service: 'ReservasService',
    repo: 'IReservaRepository'
  },
  'user.ts': {
    service: 'UserService',
    repo: 'IUserRepository'
  }
}

function toUrlName(filename: string): string {
  const base = filename.replace(/\.ts$/, '')
  return base
    .replace(/([a-z])([A-Z])/g, '$1-$2') // camelCase → kebab-case
    .toLowerCase()
}

async function main() {
  const serviceFiles = (await readdir(SERVICES_DIR)).filter(
    f => f.endsWith('.ts') && f !== 'registry.ts'
  )
  const repoFiles = new Set((await readdir(REPOS_DIR)).filter(f => f.endsWith('.ts')))

  let imports = ''
  const entries: string[] = []

  for (const file of serviceFiles) {
    const map = CLASS_NAME_MAP[file]
    if (!map) {
      console.warn(`⚠️  No class mapping for ${file}. Skipping.`)
      continue
    }

    const { service, repo } = map
    const repoFile = `${repo}.ts`
    if (!repoFiles.has(repoFile)) {
      console.warn(`⚠️  Repo file ${repoFile} not found for ${file}. Skipping.`)
      continue
    }

    const baseName = file.replace(/\.ts$/, '')
    imports += `import { ${service} } from './${baseName}'\n`
    imports += `import { ${repo} } from '../repositories/${repo}'\n`

    const urlName = toUrlName(baseName)
    entries.push(`  '${urlName}': {\n    service: ${service},\n    repo: ${repo}\n  }`)
  }

  if (entries.length === 0) {
    console.error('❌ No valid service/repo pairs found. Check your mapping and files.')
    process.exit(1)
  }

  const content = `// ⚠️ AUTOGENERADO — no editar manualmente
// Ejecuta: npm run generate:registry

${imports}

export interface CrudService<T> {
  findById(id: string): Promise<T | null>
  findMany(query: Record<string, any>): Promise<T[]>
  create(data: Record<string, any> | T): Promise<T>
  update(id: string, data: Record<string, any> | T): Promise<T>
  delete(id: string): Promise<boolean>
}

export const serviceRegistry = {
${entries.join(',\n')}
} as const

export type EntityName = keyof typeof serviceRegistry
export type ServiceFor<E extends EntityName> = InstanceType<typeof serviceRegistry[E]['service']>
export type RepoFor<E extends EntityName> = InstanceType<typeof serviceRegistry[E]['repo']>
`

  await writeFile(OUTPUT_FILE, content)
  console.log(`✅ Generado ${OUTPUT_FILE} con ${entries.length} entidades`)
}

main().catch(err => {
  console.error('❌ Error al generar registry:', err)
  process.exit(1)
})
