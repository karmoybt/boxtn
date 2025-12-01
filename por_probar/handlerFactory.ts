// lib/handlerFactory.ts
import type { EventHandler, H3Event } from 'h3'
import type { ZodTypeAny } from 'zod'
import { fromZodError } from 'zod-validation-error'
import { BadRequestError, NotFoundError, UnauthorizedError, ForbiddenError } from './errors'
import { validateListQuery, type ListQuery } from './validators'

export type PrimaryKeyValue = string | number

export interface HandlerFactoryOptions<T extends Record<string, any>> {
  primaryKeyField: keyof T
  repository: {
    findById: (id: PrimaryKeyValue) => Promise<T | null>
    findMany: (query: ListQuery) => Promise<T[]>
    create: (data: any) => Promise<T>
    update: (id: PrimaryKeyValue, data: any) => Promise<T>
    delete: (id: PrimaryKeyValue) => Promise<void>
  }
  schemas?: {
    create?: ZodTypeAny
    update?: ZodTypeAny
  }
  permissions: {
    read: string
    write: string
  }
  afterWrite?: (action: 'create' | 'update' | 'delete', item: T, event: H3Event) => Promise<void>
}

function extractPrimaryKey<T>(params: Record<string, string> | undefined, pkField: keyof T): PrimaryKeyValue {
  const raw = params?.[String(pkField)]
  if (!raw) throw new BadRequestError(`Missing primary key: ${String(pkField)}`)
  const num = Number(raw)
  return isNaN(num) ? raw : num
}

function toH3Error(err: unknown) {
  if (err instanceof BadRequestError) return createError({ statusCode: 400, message: err.message })
  if (err instanceof NotFoundError) return createError({ statusCode: 404, message: err.message })
  if (err instanceof ForbiddenError) return createError({ statusCode: 403, message: err.message })
  if (err instanceof UnauthorizedError) return createError({ statusCode: 401, message: err.message })
  return createError({ statusCode: 500, message: 'Internal server error' })
}

export function defineCrudHandler<T extends Record<string, any>>(
  opts: HandlerFactoryOptions<T>
): EventHandler {
  return defineEventHandler(async (event) => {
    const { method } = event.node.req
    const user = event.context.user
    if (!user) throw toH3Error(new UnauthorizedError())

    const needWrite = !['GET'].includes(method)
    const requiredPerm = needWrite ? opts.permissions.write : opts.permissions.read
    const hasPermission = await checkPermission(user.id, requiredPerm)
    if (!hasPermission) throw toH3Error(new ForbiddenError())

    try {
      // Rutas sin ID: solo POST/GET collection
      if (!event.context.params?.[String(opts.primaryKeyField)]) {
        if (method === 'GET') {
          const query = validateListQuery(getQuery(event))
          return await opts.repository.findMany(query)
        }

        if (method === 'POST') {
          const schema = opts.schemas?.create
          if (!schema) throw createError({ statusCode: 400, message: 'Create schema not defined' })
          const body = await readBody(event)
          const validated = schema.safeParse(body)
          if (!validated.success) throw toH3Error(new BadRequestError(fromZodError(validated.error).message))
          const created = await opts.repository.create(validated.data)
          await opts.afterWrite?.('create', created, event)
          return { [opts.primaryKeyField]: created[opts.primaryKeyField] }
        }

        throw createError({ statusCode: 405, message: 'Method Not Allowed' })
      }

      // Rutas con ID
      const id = extractPrimaryKey(event.context.params, opts.primaryKeyField)

      if (method === 'GET') {
        const item = await opts.repository.findById(id)
        if (!item) throw toH3Error(new NotFoundError())
        return item
      }

      if (method === 'DELETE') {
        const existing = await opts.repository.findById(id)
        if (!existing) throw toH3Error(new NotFoundError())
        await opts.repository.delete(id)
        await opts.afterWrite?.('delete', existing, event)
        return { success: true }
      }

      if (method === 'PUT') {
        const schema = opts.schemas?.update
        if (!schema) throw createError({ statusCode: 400, message: 'Update schema not defined' })
        const body = await readBody(event)
        const validated = schema.safeParse(body)
        if (!validated.success) throw toH3Error(new BadRequestError(fromZodError(validated.error).message))
        const updated = await opts.repository.update(id, validated.data)
        await opts.afterWrite?.('update', updated, event)
        return updated
      }

      throw createError({ statusCode: 405, message: 'Method Not Allowed' })
    } catch (err) {
      throw toH3Error(err)
    }
  })
}

// Reemplaza con tu lógica real
async function checkPermission(userId: string | number, permission: string): Promise<boolean> {
  // Ej: const perms = await db.permissions.find(userId)
  // return perms.includes(permission)
  return true
}