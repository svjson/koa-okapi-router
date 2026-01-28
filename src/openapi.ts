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
      const { schema, description } = normalizeSchema(typeDesc)
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
 * Test and narrow Described schema to SchemaWithDescription if applicable
 *
 * @param desc - The DescribedSchema to test.
 */
const isSchemaDescription = (desc: DescribedSchema): desc is SchemaWithDescription => {
  return typeof desc === 'object' && desc !== null && 'schema' in desc
}

/**
 * Normalize a DescribedSchema instance to the SchemaWithDescription shape
 *
 * @param desc - The DescribedSchema to normalize.
 * @param defaultDescription - A default description to use if typeDesc is
 *                             a plain zod type
 * @returns A SchemaWithDescription object.
 */
const normalizeSchema = (desc?: DescribedSchema, defaultDescription?: string) => {
  if (!desc) return undefined
  if (isSchemaDescription(desc)) {
    return desc
  }

  return {
    ...(defaultDescription ? { description: defaultDescription } : {}),
    schema: desc as AnyZodSchema,
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
  schema: SchemaWithDescription,
  defaultDescription: string = ''
) => {
  const description = schema.description ?? defaultDescription

  return {
    description: description,
    content: {
      'application/json': {
        schema: schema.name
          ? {
              $ref: `#/components/schemas/${schema.name}`,
            }
          : zod.toJsonSchema(schema.schema),
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

  const buildContent = (schema: SchemaWithDescription) => {
    if (schema.name) {
      componentSchemas[schema.name] = zod.toJsonSchema(schema.schema)
    }

    return toContent(zod, schema)
  }

  for (const key of Object.keys(schemas)) {
    const [method, path] = key.split(' ')
    const schema = schemas[key]
    const { summary, description, tags } = schema
    const openApiPath = translatePathPattern(path)

    const pathItem = (paths[openApiPath] ??= {})
    const routeItem = (pathItem[method.toLowerCase()] ??= {
      ...(schema.summary ? { summary } : {}),
      ...(schema.description ? { description } : {}),
      ...(schema.tags ? { tags } : {}),
    })

    const bodySchema = normalizeSchema(schema.body, 'Request Body')
    if (bodySchema && !zod.isNull(bodySchema.schema)) {
      routeItem.requestBody = buildContent(bodySchema)
    }

    routeItem.responses = Object.entries(schema.response ?? {}).reduce(
      (acc, [status, respDef]) => {
        const responseSchema = normalizeSchema(respDef, STATUS_CODES[status])
        acc[status] = buildContent(responseSchema)

        return acc
      },
      {} as Record<string, any>
    )

    const parameters = [
      ...collectParameters(zod, schema.params, 'path'),
      ...collectParameters(zod, schema.query, 'query'),
    ]
    if (parameters.length) {
      routeItem.parameters = parameters
    }
  }

  for (const key of Object.keys(entities)) {
    componentSchemas[key] = zod.toJsonSchema(entities[key])
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

/**
 * Extends a base OpenAPI JSON document with additional paths and components.
 *
 * @param base - The base OpenAPI document, either as an object or a JSON string.
 * @param additional - The additional OpenAPI document to merge into the base.
 *
 * @returns The merged OpenAPIObject.
 */
export const extendOpenApiJson = (
  base: OpenAPIObject | string,
  additional: OpenAPIObject
): OpenAPIObject => {
  const _base = typeof base === 'string' ? (JSON.parse(base) as OpenAPIObject) : base

  const result: OpenAPIObject = {
    ..._base,
    openapi: _base.openapi ?? additional.openapi,
    info: _base.info ?? additional.info,
    paths: {
      ...(_base.paths ?? {}),
      ...(additional.paths ?? {}),
    },
    components: {
      ...(_base.components ?? {}),
    },
  }

  const cmpSchemas = {
    ...(result.components.schemas ?? {}),
    ...(additional.components?.schemas ?? {}),
  }

  if (Object.keys(cmpSchemas).length) {
    result.components.schemas = cmpSchemas
  }

  return result
}
