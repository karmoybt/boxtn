import { writeFile, readdir, readFile, access } from 'fs/promises'
import { join, resolve, basename } from 'path'
import { config } from 'dotenv'

config()

const SERVICES_DIR = resolve(process.env.SERVICES_DIR || './app/server/services')
const REPOS_DIR = resolve(process.env.REPOS_DIR || './app/server/repositories')
const OUTPUT_FILE = resolve(process.env.OUTPUT_FILE || './app/server/services/registry.ts')

async function dirExists(dir: string): Promise<boolean> {
  try {
    await access(dir)
    return true
  } catch {
    return false
  }
}

// Mapeo explícito para casos irregulares
const SPECIAL_NAME_MAP: Record<string, string> = {
  clasesInstancia: 'InstanciaClase',
  // añade más si es necesario
}

// Convierte nombres como 'clasesRecurrentes' → 'ClaseRecurrente'
function toSingularPascal(base: string): string {
  if (SPECIAL_NAME_MAP[base]) {
    return SPECIAL_NAME_MAP[base]
  }

  const singular = base.replace(/s$/, '')

  return singular
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[-_]+/g, ' ')
    .split(/\s+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('')
}

function extractServiceClass(content: string): string | null {
  const match = content.match(/export\s+class\s+(\w+)/)
  return match?.[1] ?? null
}

function extractRepoInterface(content: string): string | null {
  const match = content.match(/export\s+(?:interface|type)\s+(I\w+)/)
  return match?.[1] ?? null
}

async function main() {
  if (!(await dirExists(SERVICES_DIR))) {
    throw new Error(`⚠️ El directorio de servicios no existe: ${SERVICES_DIR}`)
  }
  if (!(await dirExists(REPOS_DIR))) {
    throw new Error(`⚠️ El directorio de repositorios no existe: ${REPOS_DIR}`)
  }

  const serviceFiles = (await readdir(SERVICES_DIR))
    .filter(f => f.endsWith('.ts') && !/(registry|index|\.(spec|test))/.test(f))

  const repoFiles = new Set(
    (await readdir(REPOS_DIR)).filter(f => f.endsWith('.ts'))
  )

  const imports = new Set<string>()
  const typeImports = new Set<string>()
  const entries: string[] = []
  const repoTypeMapEntries: string[] = []

  for (const file of serviceFiles) {
    const base = basename(file, '.ts')
    const entityName = toSingularPascal(base)
    const repoFile = `I${entityName}Repository.ts`

    if (!repoFiles.has(repoFile)) {
      console.warn(`⚠️ Saltando ${file}: falta el archivo de repositorio ${repoFile}`)
      continue
    }

    try {
      const serviceContent = await readFile(join(SERVICES_DIR, file), 'utf8')
      const repoContent = await readFile(join(REPOS_DIR, repoFile), 'utf8')

      const serviceClass = extractServiceClass(serviceContent)
      const repoInterface = extractRepoInterface(repoContent)

      if (!serviceClass || !repoInterface) {
        console.warn(`⚠️ Saltando ${file}: no se encontró una clase de servicio o interfaz de repositorio válida`)
        continue
      }

      imports.add(`import { ${serviceClass} } from './${base}'`)
      typeImports.add(`import type { ${repoInterface} } from '../repositories/${repoFile.replace('.ts', '')}'`)

      const key = base.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()
      entries.push(`  '${key}': { service: ${serviceClass} }`)
      repoTypeMapEntries.push(`  '${key}': ${repoInterface}`)
    } catch (err) {
      console.warn(`⚠️ Error al procesar ${file}:`, (err as Error).message)
    }
  }

  if (entries.length === 0) {
    console.error('❌ No se encontraron pares válidos de servicio-repositorio.')
    process.exit(1)
  }

  const content = `// ⚠️ GENERADO AUTOMÁTICAMENTE — no editar manualmente
// Ejecuta: npm run generate:registry

${Array.from(imports).join('\n')}
${Array.from(typeImports).join('\n')}

export interface CrudService<T> {
  findById(id: string): Promise<T | null>
  findMany(query: Record<string, unknown>): Promise<T[]>
  create(data: Record<string, unknown> | T): Promise<T>
  update(id: string, data: Record<string, unknown> | T): Promise<T>
  delete(id: string): Promise<boolean>
}

export const serviceRegistry = {
${entries.join(',\n')}
} as const

type _RepoTypeMap = {
${repoTypeMapEntries.join(',\n')}
}

export type EntityName = keyof typeof serviceRegistry
export type ServiceFor<E extends EntityName> = InstanceType<typeof serviceRegistry[E]['service']>
export type RepoFor<E extends EntityName> = _RepoTypeMap[E]
`

  await writeFile(OUTPUT_FILE, content)
  console.log(`✅ Generado ${OUTPUT_FILE} con ${entries.length} servicio(s)`)
}

main().catch(err => {
  console.error('❌ Error crítico:', err.message || err)
  process.exit(1)
})