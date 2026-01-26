import { STATUS_CODES } from 'node:http'
import {
  DescribedSchema,
  EntitySchema,
  OkapiRouterOptions,
  PathParameterMap,
  RouteSchema,
  SchemaWithDescription,
} from './types'
import { makeZodAdapter } from './zod-adapter'
import type { AnyZodSchema, ZodAdapter } from './zod-adapter'

import type {
  OpenAPIObject,
  ParameterLocation,
  ParameterObject,
  PathItemObject,
  ReferenceObject,
  SchemaObject,
} from 'openapi3-ts/oas31'

/**
 * Translate a uri path pattern as expressed for KoaRouter to the
 * format expected by openapi.json.
 *
 * In practice, this means replacing path-parameters expressed as ':param'
 * with the equivalent '{param}' form.
 *
 * @param path - The KoaRouter path pattern.
 *
 * @returns The OpenAPI-compatible path pattern.
 */
export const translatePathPattern = (path: string) => {
  return path.replace(/:([A-Za-z0-9_]+)/g, '{$1}')
}

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
  typeDesc: DescribedSchema | EntitySchema | undefined,
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
 * @param entities - A record of component/entity schemas keyed by canonical name.
 * @param opts - Options for the OpenAPI document, including API info and
 *               Zod configuration.
 * @returns An OpenAPIObject representing the API documentation.
 */
export const buildOpenApiJson = (
  schemas: Record<string, RouteSchema>,
  entities: Record<string, EntitySchema>,
  opts: OkapiRouterOptions
): OpenAPIObject => {
  const zod: ZodAdapter = makeZodAdapter(opts.schema.zod)
  const paths: Record<string, PathItemObject> = {}
  const componentSchemas: Record<string, SchemaObject | ReferenceObject> = {}

  for (const key of Object.keys(schemas)) {
    const [method, path] = key.split(' ')
    const schema = schemas[key]

    const requestBody: any =
      schema.body &&
      !zod.isNull('schema' in schema.body ? schema.body.schema : schema.body)
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

    const openApiPath = translatePathPattern(path)

    paths[openApiPath] = {
      ...(paths[openApiPath] || {}),
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

  for (const key of Object.keys(entities)) {
    componentSchemas[key] = zod.toJsonSchema(
      normalizeDescribedSchema(entities[key], '').schema
    )
  }

  return {
    openapi: '3.1.0',
    info: opts.openapi.info,
    paths,
    ...(Object.keys(componentSchemas).length
      ? { components: { schemas: componentSchemas } }
      : {}),
  }
}
