import { OkapiRouterOptions, RouteSchema } from './types'
import { makeZodAdapter } from './zod-adapter'
import type { ZodAdapter } from './zod-adapter'

import type { OpenAPIObject, PathItemObject } from 'openapi3-ts/oas31'

/**
 * Builds an OpenAPI JSON document from the provided route schemas and options.
 *
 * @param schemas - A record of route schemas keyed by "METHOD /path".
 * @param opts - Options for the OpenAPI document, including API info and
 *               Zod configuration.
 * @returns An OpenAPIObject representing the API documentation.
 */
export const buildOpenApiJson = (
  schemas: Record<string, RouteSchema>,
  opts: OkapiRouterOptions
): OpenAPIObject => {
  const zod: ZodAdapter = makeZodAdapter(opts.schema.zod)
  const paths: Record<string, PathItemObject> = {}

  for (const key of Object.keys(schemas)) {
    const [method, path] = key.split(' ')
    const schema = schemas[key]

    const responses = Object.entries(schema.response ?? {}).reduce(
      (acc, [status, zodSchema]) => {
        acc[status] = {
          description: 'Response',
          content: {
            'application/json': { schema: zod.toJsonSchema(zodSchema) },
          },
        }
        return acc
      },
      {} as Record<string, any>
    )

    paths[path] = {
      ...(paths[path] || {}),
      [method.toLowerCase()]: {
        summary: schema.summary,
        description: schema.description,
        tags: schema.tags,
        responses,
      },
    }
  }

  return {
    openapi: '3.1.0',
    info: opts.openapi.info,
    paths,
  }
}
