import { generateOpenApi } from 'zod-openapi'
import { writeFileSync } from 'fs'
import { join } from 'path'

async function generateOpenApiSpec(entities: string[], typesDir: string) {
  // Dinámicamente importamos los esquemas generados
  const schemas: Record<string, any> = {}

  for (const entity of entities) {
    // Usa dynamic import para acceder a los esquemas exportados
    const modulePath = join(typesDir, `${entity}.types.js`) // .js porque Node
    const mod = await import(modulePath)
    schemas[entity] = mod[`${entity}Schema`].openapi({ refId: entity })
    schemas[`Create${entity}Input`] = mod[`Create${entity}Input`].openapi({ refId: `Create${entity}Input` })
    schemas[`Update${entity}Input`] = mod[`Update${entity}Input`].openapi({ refId: `Update${entity}Input` })
  }

  const paths: Record<string, any> = {}

  for (const entity of entities) {
    const route = entity.toLowerCase()
    paths[`/api/${route}`] = {
      get: {
        summary: `List ${entity}`,
        responses: {
          200: {
            description: 'OK',
            content: {
              'application/json': {
                schema: { type: 'array', items: { $ref: `#/components/schemas/${entity}` } }
              }
            }
          }
        }
      },
      post: {
        summary: `Create ${entity}`,
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: `#/components/schemas/Create${entity}Input` }
            }
          }
        },
        responses: {
          201: { description: 'Created' }
        }
      }
    }

    paths[`/api/${route}/{id}`] = {
      get: {
        responses: {
          200: {
            description: 'OK',
            content: {
              'application/json': {
                schema: { $ref: `#/components/schemas/${entity}` }
              }
            }
          }
        }
      },
      put: {
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: `#/components/schemas/Update${entity}Input` }
            }
          }
        },
        responses: {
          200: {
            description: 'Updated',
            content: {
              'application/json': {
                schema: { $ref: `#/components/schemas/${entity}` }
              }
            }
          }
        }
      },
      delete: {
        responses: {
          204: { description: 'No Content' }
        }
      }
    }
  }

  const openapiSpec = generateOpenApi({
    openapi: '3.0.3',
    info: {
      title: 'Auto-generated API',
      version: '1.0.0'
    },
    paths,
    components: {
      schemas: Object.fromEntries(
        Object.entries(schemas).map(([name, schema]) => [name, schema])
      )
    }
  })

  writeFileSync(join(process.cwd(), 'openapi.json'), JSON.stringify(openapiSpec, null, 2))
  console.log('📄 OpenAPI spec generated: openapi.json')
}
