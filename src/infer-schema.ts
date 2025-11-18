import z from 'zod'
import Koa from 'koa'
import { ResponseSchemaMap, RouteSchema, SchemaWithDescription } from './types'
import { IsEmptyRecord, IsUndefined, WidenNever } from './type-utilities'
import { AnyZodSchema } from './zod-adapter'

/**
 * Narrow a RouteSchema to its exact type, filling all non-defined
 * keys with undefined.
 *
 * This is done to be able to reliably infer types for properties
 * that are otherwise optionally defined due to the flexibility
 * of RouteSchema
 *
 * @template T - The RouteSchema to narrow
 *
 * @returns The concrete RouteSchema with all keys defined
 */
export type ConcreteRouteSchema<T extends RouteSchema> = {
  [K in keyof RouteSchema]: K extends keyof T ? T[K] : undefined
}

/**
 * Type utility that extracts the actual schema from DescribedSchema,
 * which is either the schema itself or SchemeWithDescription which
 * has the schema as the nested property `schema`.
 *
 * @template T - The DescribedSchema from which to extract the schema.
 *
 * @returns The extracted Zod schema type, or `never` if none.
 */
export type ExtractSchema<T> =
  IsUndefined<T> extends true
    ? never
    : T extends AnyZodSchema
      ? T
      : T extends SchemaWithDescription
        ? T['schema']
        : never

/**
 * Infer the schema types of a map of parameter name to schema or
 * schema with description.
 *
 * The parameter map may be undefined or an empty map/object, in which
 * case the type for the map is `never`.
 *
 * @template R - The record mapping parameter names to schemas
 *
 * @returns The inferred schema map
 */
export type InferSchemaMap<R> =
  IsUndefined<R> extends true
    ? never
    : IsEmptyRecord<R> extends true
      ? never
      : {
          [Name in keyof R & string]: z.infer<ExtractSchema<R[Name]>>
        }

/**
 * Type utility for inferring the input types described by a RouteSchema.
 *
 * This is used by TypedMiddleware to produce a parameterized type that
 * coerces the koa context the express the expected types for input and
 * output.
 *
 * @template Schema - The RouteSchema from which to infer types.
 */
export type InferSchema<Schema extends RouteSchema> = {
  status: Schema['response'] extends ResponseSchemaMap ? keyof Schema['response'] : number
}

/**
 * Describes a parameterized and type-enhanced middleware function
 * according to RouteSchema.
 *
 * The middleware function receives a context object that includes
 * typed properties for params, query, body, request body, response body,
 * state, and cookies, along with the standard DefaultKoaMiddleware
 * properties.
 *
 * @template S - The RouteSchema defining the types for params, query,
 *               body, and response.
 */
export type TypedMiddleware<
  Schema extends RouteSchema,
  CR = ConcreteRouteSchema<Schema>,
> = (
  ctx: Koa.ParameterizedContext<
    Koa.DefaultState,
    Koa.DefaultContext & {
      status: WidenNever<InferSchema<CR>['status'], number>
      query: InferSchemaMap<Schema['query']>
      params: InferSchemaMap<Schema['params']>
    }
  >
) => Promise<void> | void
