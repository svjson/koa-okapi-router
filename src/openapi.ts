import { OkapiRouterOptions, RouteSchema } from './types'
import { makeZodAdapter } from './zod-adapter'
import type { ZodAdapter, ZodTypeAny } from './zod-adapter'

import type {
  OpenAPIObject,
  ParameterLocation,
  ParameterObject,
  PathItemObject,
  ReferenceObject,
} from 'openapi3-ts/oas31'

const isOptional = (zodSchema: ZodTypeAny) => {
  if (typeof zodSchema.isOptional === 'function') {
    return zodSchema.isOptional()
  }
  return zodSchema._def && 'isOptional' in zodSchema._def && zodSchema._def?.isOptional
}

const collectParameters = (
  zod: ZodAdapter,
  coll: Record<string, ZodTypeAny> | null,
  location: ParameterLocation
) =>
  Object.entries(coll ?? {}).map(
    ([name, zodSchema]) => {
      return {
        name,
        in: location,
        required: !isOptional(zodSchema),
        schema: zod.toJsonSchema(zodSchema),
      } satisfies ParameterObject | ReferenceObject
    },
    {} as Record<string, any>
  )

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

    const parameters = [
      ...collectParameters(zod, schema.params, 'path'),
      ...collectParameters(zod, schema.query, 'query'),
    ]

    paths[path] = {
      ...(paths[path] || {}),
      [method.toLowerCase()]: {
        summary: schema.summary,
        description: schema.description,
        tags: schema.tags,
        parameters: parameters.length > 0 ? parameters : undefined,
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
