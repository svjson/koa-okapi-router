import { STATUS_CODES } from 'node:http'
import {
  DescribedSchema,
  OkapiRouterOptions,
  PathParameterMap,
  RouteSchema,
  SchemaWithDescription,
} from './types'
import { makeZodAdapter } from './zod-adapter'
import type { AnyZodSchema, ZodAdapter, ZodTypeAny } from './zod-adapter'

import type {
  OpenAPIObject,
  ParameterLocation,
  ParameterObject,
  PathItemObject,
  ReferenceObject,
} from 'openapi3-ts/oas31'

/**
 * Collect path or query parameters and produce openapi definitions
 * for these.
 *
 * @param zod - The ZodAdapter instance for schema conversion.
 * @param coll - A map of parameter names to their Zod schemas or described schemas.
 * @param location - The location of the parameters (either 'path' or 'query').
 */
export const collectParameters = (
  zod: ZodAdapter,
  coll: PathParameterMap | undefined,
  location: ParameterLocation
) =>
  Object.entries(coll ?? {}).map(
    ([name, typeDesc]) => {
      const { schema, description } = normalizeDescribedSchema(typeDesc)
      return {
        name,
        ...(description ? { description } : {}),
        in: location,
        required: !zod.isOptionalType(schema),
        schema: unwrapOptionals(zod.toJsonSchema(schema)),
        ...(zod.isArrayType(schema) ? { explode: false, style: 'form' } : {}),
      } satisfies ParameterObject | ReferenceObject
    },
    {} as Record<string, any>
  )

/**
 * Unwraps optionals declared as anyOf in a json schema
 *
 * @param schema - The JSON schema to unwrap.
 * @returns The unwrapped JSON schema.
 */
const unwrapOptionals = (schema: any): any => {
  if (!schema || typeof schema !== 'object') return schema

  if (Array.isArray(schema.anyOf)) {
    const inner = schema.anyOf.find(
      (s: any) => !(s.not && Object.keys(s.not).length === 0)
    )
    if (inner) return unwrapOptionals(inner)
  }

  return schema
}

/**
 * Normalize a DescribedSchema instance to the SchemaWithDescription shape
 *
 * @param typeDesc - The DescribedSchema to normalize.
 * @param defaultDescription - A default description to use if typeDesc is
 *                             a plain zod type
 * @returns A SchemaWithDescription object.
 */
const normalizeDescribedSchema = (
  typeDesc: DescribedSchema | undefined,
  defaultDescription: string = ''
): SchemaWithDescription => {
  if (
    typeDesc &&
    typeof typeDesc === 'object' &&
    'description' in typeDesc &&
    typeof typeDesc.description === 'string'
  ) {
    return typeDesc
  }

  return {
    description: defaultDescription,
    schema: typeDesc as AnyZodSchema,
  }
}

/**
 * Transforms a HTTP request or response body schema to an openapi schema
 * content/payload.
 *
 * @param zod - The ZodAdapter instance for schema conversion.
 * @param typeDesc - The DescribedSchema representing the body schema.
 * @param defaultDescription - A default description to use if typeDesc
 *                            lacks one.
 */
const toContent = (
  zod: ZodAdapter,
  typeDesc: DescribedSchema,
  defaultDescription: string = ''
) => {
  const schemaDesc = normalizeDescribedSchema(typeDesc, defaultDescription)

  return {
    description: schemaDesc.description,
    content: {
      'application/json': {
        schema: zod.toJsonSchema(schemaDesc.schema),
      },
    },
  }
}

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

    const requestBody: any = schema.body
      ? {
          requestBody: toContent(zod, schema.body, 'Request Body'),
        }
      : {}

    const responses = Object.entries(schema.response ?? {}).reduce(
      (acc, [status, respDef]) => {
        acc[status] = toContent(zod, respDef, STATUS_CODES[status] ?? '')
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
        ...(parameters.length > 0 ? { parameters } : {}),
        ...requestBody,
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
