// scripts/generate-registry.ts
import { writeFile, readdir, readFile, access } from 'fs/promises'
import { join, resolve, basename } from 'path'
import { config } from 'dotenv'

config()

const SERVICES_DIR = resolve(process.env.SERVICES_DIR || './app/server/services')
const REPOS_IMPL_DIR = resolve(process.env.REPOS_IMPL_DIR || './app/server/repositories/impl')
const OUTPUT_FILE = resolve(process.env.OUTPUT_FILE || './app/server/services/registry.ts')

async function dirExists(dir: string): Promise<boolean> {
  try {
    await access(dir)
    return true
  } catch {
    return false
  }
}

// Mapeo explícito para casos irregulares o donde plural ≠ singular + "s"
const SERVICE_TO_SINGULAR: Record<string, string> = {
  leads: 'Lead',
  reservas: 'Reserva',
  clasesRecurrentes: 'ClaseRecurrente',
  clasesInstancia: 'InstanciaClase',
  // Añade más si es necesario
}

function toSingularPascal(base: string): string {
  if (SERVICE_TO_SINGULAR[base]) {
    return SERVICE_TO_SINGULAR[base]
  }
  // Regla general: quitar "s" final si termina en "s" y no es palabra como "asistencia"
  let singular = base
  if (base.endsWith('s') && !['asistencia', 'membresia', 'pack'].includes(base)) {
    singular = base.slice(0, -1)
  }
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

function extractRepoClass(content: string): string | null {
  const match = content.match(/export\s+class\s+(\w+Repository)/)
  return match?.[1] ?? null
}

async function main() {
  if (!(await dirExists(SERVICES_DIR))) {
    throw new Error(`⚠️ El directorio de servicios no existe: ${SERVICES_DIR}`)
  }
  if (!(await dirExists(REPOS_IMPL_DIR))) {
    throw new Error(`⚠️ El directorio de implementaciones no existe: ${REPOS_IMPL_DIR}`)
  }

  const serviceFiles = (await readdir(SERVICES_DIR))
    .filter(f => f.endsWith('.ts') && !/(registry|index|\.(spec|test))/.test(f))

  const implFiles = new Set(
    (await readdir(REPOS_IMPL_DIR)).filter(f => f.endsWith('.ts') && !/(index|\.test)/.test(f))
  )

  const imports = new Set<string>()
  const entries: string[] = []

  for (const file of serviceFiles) {
    const base = basename(file, '.ts') // ej: "leads", "reservas"

    // ✅ Convertir a singular en PascalCase
    const singularPascal = toSingularPascal(base)
    const implFilename = `Sqlite${singularPascal}Repository.ts`

    if (!implFiles.has(implFilename)) {
      console.warn(`⚠️ Saltando ${file}: falta el archivo de implementación ${implFilename}`)
      continue
    }

    try {
      const implContent = await readFile(join(REPOS_IMPL_DIR, implFilename), 'utf8')
      const repoClass = extractRepoClass(implContent)
      if (!repoClass) {
        console.warn(`⚠️ Saltando ${file}: no se encontró clase en ${implFilename}`)
        continue
      }

      const serviceContent = await readFile(join(SERVICES_DIR, file), 'utf8')
      const serviceClass = extractServiceClass(serviceContent)
      if (!serviceClass) {
        console.warn(`⚠️ Saltando ${file}: no se encontró clase de servicio`)
        continue
      }

      const apiKey = base.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()
      imports.add(`import { ${serviceClass} } from './${base}'`)
      imports.add(`import { ${repoClass} } from '../repositories/impl/${implFilename.replace('.ts', '')}'`)
      entries.push(`  '${apiKey}': {\n    service: ${serviceClass},\n    repo: ${repoClass}\n  }`)
    } catch (err) {
      console.warn(`⚠️ Error al procesar ${file}:`, (err as Error).message)
    }
  }

  if (entries.length === 0) {
    console.error('❌ No se encontraron pares válidos.')
    process.exit(1)
  }

 const content = `// ⚠️ GENERADO AUTOMÁTICAMENTE — no editar
// Ejecuta: npm run generate:registry

${Array.from(imports).join('\n')}

export const serviceRegistry = {
${entries.join(',\n')}
} as const

export type EntityName = keyof typeof serviceRegistry
export type ServiceFor<E extends EntityName> = InstanceType<typeof serviceRegistry[E]['service']>
export type RepoFor<E extends EntityName> = InstanceType<typeof serviceRegistry[E]['repo']>
`

  await writeFile(OUTPUT_FILE, content)
  console.log(`✅ Generado ${OUTPUT_FILE} con ${entries.length} servicio(s)`)
}

main().catch(err => {
  console.error('❌ Error crítico:', err.message || err)
  process.exit(1)
})