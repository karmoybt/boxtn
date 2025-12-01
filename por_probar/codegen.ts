// scripts/codegen.ts
import { createClient } from '@libsql/client'
import { mkdirSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'

const appDb = createClient({ url: 'file:./db.sqlite' })
const metaDb = createClient({ url: 'file:./genTurso.sqlite' })

const OUTPUT_DIR = join(process.cwd(), 'types')
const REPO_DIR = join(process.cwd(), 'repositories/impl')
const INTERFACE_DIR = join(process.cwd(), 'repositories/interfaces')
const API_DIR = join(process.cwd(), 'server/api')

;[OUTPUT_DIR, REPO_DIR, INTERFACE_DIR, API_DIR].forEach(dir => {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
})

const AUTOGEN_WARNING = `// ⚠️ Este archivo fue autogenerado. No editarlo manualmente.\n`

function isValidIdentifier(s: string): boolean {
  return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(s)
}

function baseTpeIncludes(baseType: string, keywords: string[]): boolean {
  return keywords.some(kw => baseType.includes(kw))
}

function toSingular(tableName: string): string {
  if (tableName.endsWith('es')) return tableName.slice(0, -2)
  if (tableName.endsWith('s')) return tableName.slice(0, -1)
  return tableName
}

function pascalCase(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

function toEntityName(tableName: string): string {
  return pascalCase(toSingular(tableName))
}

function getPrimaryKeyInfo(columns: any[]): { column: string; sqlType: string } | null {
  const pks = columns.filter((col: any) => col.pk > 0).sort((a: any, b: any) => a.pk - b.pk)
  return pks.length === 1 ? { column: pks[0].name, sqlType: pks[0].type } : null
}

function pkSqlTypeToTsType(sqlType: string): string {
  return sqlType.toLowerCase().includes('int') ? 'number' : 'string'
}

async function main() {
  console.log('🔍 Cargando configuración desde genTurso.sqlite...')
  
  const excludedRes = await metaDb.execute('SELECT table_name FROM codegen_excluded_tables')
  const excludedTables = new Set(excludedRes.rows.map(r => r.table_name as string))

  const tsFieldsRes = await metaDb.execute('SELECT field_name FROM codegen_timestamp_fields')
  const timestampFields = new Set(tsFieldsRes.rows.map(r => r.field_name as string))

  const permsRes = await metaDb.execute('SELECT table_name, read_perm, write_perm FROM codegen_entity_permissions')
  const entityPermissions = new Map(
    permsRes.rows.map(r => [r.table_name as string, { read: r.read_perm, write: r.write_perm }])
  )

  const auditRes = await metaDb.execute('SELECT table_name FROM codegen_audit_entities')
  const auditEntities = new Set(auditRes.rows.map(r => r.table_name as string))

  console.log(`⚙️  Excluyendo ${excludedTables.size} tablas. Permisos para ${entityPermissions.size} entidades. Auditoría en ${auditEntities.size}.`)

  const tablesRes = await appDb.execute(`
    SELECT name FROM sqlite_master 
    WHERE type = 'table' 
      AND name NOT LIKE 'sqlite_%'
      AND name NOT LIKE '_libsql_%'
      AND name NOT IN ('libsql_wappruntime_config')
    ORDER BY name
  `)

  const tableNames: string[] = tablesRes.rows.map(row => row.name as string)
  const generatedEntities: string[] = []

  for (const tableName of tableNames) {
    if (!isValidIdentifier(tableName)) {
      console.warn(`⚠️  Nombre inválido: ${tableName} → omitido`)
      continue
    }
    if (excludedTables.has(tableName)) {
      console.log(`⏭️  Excluida: ${tableName}`)
      continue
    }

    console.log(`🏭 Generando: ${tableName}`)
    const colRes = await appDb.execute(`PRAGMA table_xinfo("${tableName}")`)
    const columns: any[] = colRes.rows.map(row => ({
      name: row.name,
      type: row.type,
      notnull: row.notnull,
      pk: row.pk,
      dflt_value: row.dflt_value,
    }))

    const pkInfo = getPrimaryKeyInfo(columns)
    if (!pkInfo || !isValidIdentifier(pkInfo.column)) {
      console.warn(`⚠️  PK inválida o compuesta en ${tableName} → omitido`)
      continue
    }

    const entityName = toEntityName(tableName)
    const typeName = entityName
    const idType = pkSqlTypeToTsType(pkInfo.sqlType)

    // === Tipos ===
    const zodFields = columns.map(col => {
      const { name, type, notnull } = col
      let zodType: string
      if (timestampFields.has(name)) zodType = 'z.string().datetime()'
      else if (name === 'email') zodType = 'z.string().email()'
      else if (name.includes('url')) zodType = 'z.string().url()'
      else if (name.includes('password')) zodType = 'z.string().min(8)'
      else {
        const baseType = type.toLowerCase().trim()
        if (baseTpeIncludes(baseType, ['int'])) zodType = 'z.number().int()'
        else if (baseTpeIncludes(baseType, ['text', 'char']) || baseType === '' || baseType === 'text')
          zodType = 'z.string()'
        else if (baseTpeIncludes(baseType, ['bool'])) zodType = 'z.boolean()'
        else if (baseTpeIncludes(baseType, ['blob'])) zodType = 'z.instanceof(Uint8Array)'
        else if (baseTpeIncludes(baseType, ['real', 'float', 'double', 'numeric']))
          zodType = 'z.number()'
        else zodType = 'z.string()'
      }
      return `  ${name}: ${notnull === 0 ? `${zodType}.nullable()` : zodType}`
    })
    const zodSchema = `z.object({\n${zodFields.join(',\n')}\n})`

    const omitFields = ['creado_en', 'actualizado_en', 'eliminado_en']
    const pkOmit = [pkInfo.column]
    const withDefault = columns.filter(col => col.dflt_value != null).map(col => col.name)
    const omitCreate = [...pkOmit, ...omitFields, ...withDefault].filter(f =>
      columns.some(c => c.name === f)
    )

    writeFileSync(join(OUTPUT_DIR, `${entityName}.types.ts`), `${AUTOGEN_WARNING}
import { z } from 'zod'

export const ${entityName}Schema = ${zodSchema}
export type ${typeName} = z.infer<typeof ${entityName}Schema>

export const Create${typeName}Input = ${entityName}Schema.omit({ ${omitCreate.map(f => `"${f}": true`).join(', ')} })
export type Create${typeName}Input = z.infer<typeof Create${typeName}Input>

export const Update${typeName}Input = ${entityName}Schema.partial().required({ ${pkOmit.map(f => `"${f}": true`).join(', ')} })
export type Update${typeName}Input = z.infer<typeof Update${typeName}Input>

export const ${typeName}Query = z.object({
  where: z.record(z.unknown()).optional(),
  limit: z.number().min(1).max(100).optional().default(20),
  offset: z.number().min(0).optional().default(0),
})
export type ${typeName}Query = z.infer<typeof ${typeName}Query>
`)

    // === Interfaz ===
    writeFileSync(join(INTERFACE_DIR, `${entityName}.repository.ts`), `${AUTOGEN_WARNING}
import type { ${typeName}, Create${typeName}Input, Update${typeName}Input, ${typeName}Query } from '~/types/${entityName}.types'

export interface ${typeName}Repository {
  findById(id: ${idType}): Promise<${typeName} | null>
  findMany(query: ${typeName}Query): Promise<${typeName}[]>
  create(data: Create${typeName}Input): Promise<${typeName}>
  update(id: ${idType}, data: Update${typeName}Input): Promise<${typeName}>
  delete(id: ${idType}): Promise<void>
}
`)

    // === Implementación ===
    const hasSoftDelete = columns.some((col: any) => col.name === 'eliminado_en')
    const insertFields = columns.filter((col: any) => !pkOmit.includes(col.name)).map((c: any) => c.name)
    const updateAssignments = columns
      .filter((col: any) => !pkOmit.includes(col.name) && !['creado_en', 'actualizado_en'].includes(col.name))
      .map((col: any) => `if (data.${col.name} !== undefined) { fields.push('${col.name} = ?'); args.push(data.${col.name}); }`)
      .join('\n    ')

    writeFileSync(join(REPO_DIR, `${entityName}.repository.impl.ts`), `${AUTOGEN_WARNING}
import { ${entityName}Schema } from '~/types/${entityName}.types'
import type { ${typeName}, Create${typeName}Input, Update${typeName}Input, ${typeName}Query } from '~/types/${entityName}.types'
import type { ${typeName}Repository } from '~/repositories/interfaces/${entityName}.repository'
import { LibsqlClient } from '@libsql/client'

export class ${typeName}RepositoryImpl implements ${typeName}Repository {
  constructor(private db: LibsqlClient) {}

  async findById(id: ${idType}): Promise<${typeName} | null> {
    const result = await this.db.execute({ sql: \`SELECT * FROM ${tableName} WHERE ${pkInfo.column} = ?\`, args: [id] })
    return result.rows.length ? ${entityName}Schema.parse(result.rows[0]) : null
  }

  async findMany(query: ${typeName}Query): Promise<${typeName}[]> {
    const { limit = 20, offset = 0 } = query
    let sql = \`SELECT * FROM ${tableName}\`
    const args: unknown[] = []
    ${hasSoftDelete ? '    sql += " WHERE eliminado_en IS NULL"' : ''}
    sql += \` LIMIT \${limit} OFFSET \${offset}\`
    const result = await this.db.execute({ sql, args })
    return result.rows.map(row => ${entityName}Schema.parse(row))
  }

  async create(data: Create${typeName}Input): Promise<${typeName}> {
    const now = new Date().toISOString()
    const fields = [${insertFields.map(f => `'${f}'`).join(', ')}]
    const values = fields.map(f => f === 'creado_en' ? now : (data as any)[f])
    await this.db.execute({ sql: \`INSERT INTO ${tableName} (\${fields.join(', ')}) VALUES (\${fields.map(() => '?').join(', ')})\`, args: values })
    const lastId = (await this.db.execute('SELECT last_insert_rowid()')).rows[0]['last_insert_rowid()']
    const result = await this.db.execute({ sql: \`SELECT * FROM ${tableName} WHERE ${pkInfo.column} = ?\`, args: [lastId] })
    return ${entityName}Schema.parse(result.rows[0])
  }

  async update(id: ${idType}, data: Update${typeName}Input): Promise<${typeName}> {
    const now = new Date().toISOString()
    const fields: string[] = []
    const args: unknown[] = []
    ${updateAssignments}
    if (fields.length === 0) return this.findById(id) as Promise<${typeName}>
    fields.push('actualizado_en = ?')
    args.push(now)
    args.push(id)
    await this.db.execute({ sql: \`UPDATE ${tableName} SET \${fields.join(', ')} WHERE ${pkInfo.column} = ?\`, args })
    return this.findById(id) as Promise<${typeName}>
  }

  async delete(id: ${idType}): Promise<void> {
    ${hasSoftDelete
        ? `await this.db.execute({ sql: \`UPDATE ${tableName} SET eliminado_en = ? WHERE ${pkInfo.column} = ?\`, args: [new Date().toISOString(), id] })`
        : `await this.db.execute({ sql: \`DELETE FROM ${tableName} WHERE ${pkInfo.column} = ?\`, args: [id] })`}
  }
}
`)

    generatedEntities.push(entityName)

    // === Rutas de API ===
    if (entityPermissions.has(tableName)) {
      const perms = entityPermissions.get(tableName)!
      const routeName = tableName
      const entityApiDir = join(API_DIR, routeName)
      if (!existsSync(entityApiDir)) mkdirSync(entityApiDir, { recursive: true })

      const needsAudit = auditEntities.has(tableName)
      const auditImport = needsAudit ? "import { auditLog } from '~/lib/audit'\n" : ''
      const afterWriteCode = needsAudit
        ? `  afterWrite: async (action, item, event) => {
    await auditLog(
      action,
      event.context.user.id,
      '${routeName}',
      String(item.${pkInfo.column}),
      event.node.req.headers['x-forwarded-for'] || event.node.req.socket.remoteAddress
    )
  },`
        : ''

      // [id].ts
      writeFileSync(join(entityApiDir, '[id].ts'), `${AUTOGEN_WARNING}
import { ${entityName}RepositoryImpl } from '~/repositories/impl/${entityName}.repository.impl'
import { Create${entityName}Input, Update${entityName}Input } from '~/types/${entityName}.types'
import { createEntityHandler } from '~/lib/handlerFactory'
${auditImport}

const repo = new ${entityName}RepositoryImpl()

export default createEntityHandler({
  primaryKeyField: '${pkInfo.column}',
  repository: repo,
  schemas: {
    create: Create${entityName}Input,
    update: Update${entityName}Input,
  },
  permissions: {
    read: '${perms.read}',
    write: '${perms.write}',
  },
${afterWriteCode}
})
`)

      // index.ts
      writeFileSync(join(entityApiDir, 'index.ts'), `${AUTOGEN_WARNING}
import { ${entityName}RepositoryImpl } from '~/repositories/impl/${entityName}.repository.impl'
import { Create${entityName}Input } from '~/types/${entityName}.types'
import { createEntityHandler } from '~/lib/handlerFactory'
${auditImport}

const repo = new ${entityName}RepositoryImpl()

export default createEntityHandler({
  primaryKeyField: '${pkInfo.column}',
  repository: repo,
  schemas: {
    create: Create${entityName}Input,
    update: undefined,
  },
  permissions: {
    read: '${perms.read}',
    write: '${perms.write}',
  },
${afterWriteCode}
})
`)
    }
  }

  // === Barrel files ===
  ;[
    { dir: OUTPUT_DIR, suffix: '.types' },
    { dir: INTERFACE_DIR, suffix: '.repository' },
    { dir: REPO_DIR, suffix: '.repository.impl' },
  ].forEach(({ dir, suffix }) => {
    const exports = generatedEntities
      .sort()
      .map(e => `export * from './${e}${suffix}'`)
      .join('\n')
    writeFileSync(join(dir, 'index.ts'), `${AUTOGEN_WARNING}${exports}\n`)
  })

  console.log(`✅ Generado código para ${generatedEntities.length} entidades.`)
  console.log(`📁 Tipos:       ${OUTPUT_DIR}`)
  console.log(`📁 Interfaces:  ${INTERFACE_DIR}`)
  console.log(`📁 Implement.:  ${REPO_DIR}`)
  console.log(`📁 API routes:  ${API_DIR}`)
  
  await appDb.close()
  await metaDb.close()
}

main().catch(err => {
  console.error('❌ Error:', err)
  process.exit(1)
})