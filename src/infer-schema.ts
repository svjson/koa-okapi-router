import z from 'zod'
import {
  DefaultKoaContext,
  ResponseSchemaMap,
  RouteSchema,
  SchemaWithDescription,
} from './types'
import { IsEmptyRecord, IsUndefined } from './type-utilities'
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
export type ConcreteRouteSchema<T> = {
  [K in keyof RouteSchema]-?: K extends keyof T ? T[K] : undefined
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
export type InferSchemaMap<R, ElseDefault = never> =
  IsUndefined<R> extends true
    ? ElseDefault
    : IsEmptyRecord<R> extends true
      ? ElseDefault
      : {
          [Name in keyof R & string]: z.infer<ExtractSchema<R[Name]>>
        }

/**
 * Infer a union type of all possible response body schema types
 *
 * The response schema map may be undefined or an empty map/object,
 * in which case the type is `never`.
 *
 * @template Schema - The route schema declaration to infer response
 *                    bodies from.
 *
 * @returns The inferred union of response body types
 */
export type InferResponseBodyUnion<
  Schema,
  Responses = ConcreteRouteSchema<Schema>['response'],
> =
  IsUndefined<Responses> extends true
    ? DefaultKoaContext['body']
    : IsEmptyRecord<Responses> extends true
      ? never
      : {
          [Status in keyof Responses & number]: z.infer<ExtractSchema<Responses[Status]>>
        }[keyof Responses & number]

/**
 * Infers the declared, and therefore allowed, response status codes from
 * Schema.
 *
 * If no responses are defined, the type is widened to `number`.
 *
 * @template Schema - The RouteSchema from which to infer status codes.
 * @returns The inferred response status codes as a union of literal
 *          numbers, or `number`
 */
export type InferResponseStatusCodes<Schema extends RouteSchema> =
  Schema['response'] extends ResponseSchemaMap ? keyof Schema['response'] : number

/**
 * Type utility for inferring the input and output types described by a
 * RouteSchema.
 *
 * This is used by TypedMiddleware to produce a parameterized type that
 * coerces the koa context to express the expected types for input and
 * output.
 *
 * @template Schema - The RouteSchema from which to infer types.
 *
 * @returns The inferred schema types.
 */
export type InferSchema<Schema extends RouteSchema> = {
  body: Schema['body'] extends AnyZodSchema
    ? z.infer<Schema['body']>
    : DefaultKoaContext['request']['body']
  params: InferSchemaMap<Schema['params'], DefaultKoaContext['params']>
  query: InferSchemaMap<Schema['query'], DefaultKoaContext['query']>
  status: InferResponseStatusCodes<Schema>
  responseBodies: InferResponseBodyUnion<Schema>
}
