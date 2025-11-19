import Koa from 'koa'
import KoaRouter from '@koa/router'

import { And, IsExactly } from './type-utilities'

/**
 * Simplistic baseline Zod schema type aimed to be compatible with both
 * zod 3 and 4
 *
 * Represented members are limited to those required by koa-okapi-router
 * during either runtime or tests.
 */
export type ZodLike = {
  object(shape: Record<string, any>): any
  string(): any
  number(): any
  array(item: any): any
  null(): any
}

import { AnyZodSchema } from './zod-adapter'
import { InferSchema } from './infer-schema'

/**
 * HTTP methods supported by the router
 */
export type HttpMethod = 'options' | 'head' | 'get' | 'put' | 'post' | 'delete' | 'patch'

/**
 * List of HTTP methods containing all valid methods from `HttpMethod`
 */
export const HTTP_METHODS: HttpMethod[] = [
  'options',
  'head',
  'get',
  'put',
  'post',
  'delete',
  'patch',
]

/**
 * Type alias for the default ctx providere by koa/koa-router
 */
export type DefaultKoaContext = Koa.ParameterizedContext<
  Koa.DefaultState,
  Koa.DefaultContext,
  unknown
>

/**
 * Options for configuring the OkapiRouter
 *
 * Applications using Zod schemas are expected to provide their Zod/z implementation,
 * from which Okapi will determine whether to expect zod v3 or zod v4 schemas.
 */
export interface OkapiRouterOptions {
  openapi: {
    info: { title: string; version: string }
    jsonUrl: string
  }
  schema: {
    zod?: ZodLike
  }
}

/**
 * OkapiRouter type extending KoaRouter with typed methods for each HTTP method
 * and route registration.
 */
export type OkapiRouter = Record<
  HttpMethod,
  <S extends RouteSchema>(
    path: string | RegExp,
    schema: S,
    middleware: TypedMiddleware<S>
  ) => void
> & {
  /**
   * Returns router middleware which dispatches a route matching the request.
   *
   * Equivalent to `KoaRouterInstance.routes()`
   *
   * @returns Koa middleware function
   */
  routes: () => ReturnType<KoaRouter['routes']>
  /**
   * Returns router middleware which responds to OPTIONS requests and sets `Allow` header.
   *
   * Equivalent to `KoaRouterInstance.allowedMethods()`
   *
   * @returns Koa middleware function
   */
  allowedMethods: () => ReturnType<KoaRouter['allowedMethods']>
  /**
   * Registers a route with the given parameters and middleware.
   * @param params - Parameters for the route including path, method, and optional schema.
   */
  register: (
    params: OkapiRegisterParams<RouteSchema>,
    middleware: TypedMiddleware<RouteSchema>
  ) => void
  /**
   * Generates an OpenAPI JSON document for the registered routes.
   *
   * @returns An object representing the OpenAPI JSON document.
   */
  openapiJson: () => Object
  /**
   * The URL path where the OpenAPI JSON document can be accessed.
   *
   * @see {@link OkapiRouterOptions.openapi.jsonUrl}
   */
  openapiJsonUrl: string
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
 * @template Schema - The RouteSchema defining the types for params, query,
 *                    body, and response.
 * @template Concrete - The concrete inferred schema. Not intended for
 *                      parameterization from the outside.
 */
export type TypedMiddleware<
  Schema extends RouteSchema,
  Concrete extends InferSchema<Schema> = InferSchema<Schema>,
> =
  And<
    IsExactly<Concrete['status'], number>,
    IsExactly<Concrete['query'], DefaultKoaContext['query']>,
    IsExactly<Concrete['params'], DefaultKoaContext['params']>,
    IsExactly<Concrete['body'], DefaultKoaContext['body']>,
    IsExactly<Concrete['responseBodies'], DefaultKoaContext['body']>
  > extends true
    ? (ctx: DefaultKoaContext) => Promise<void> | void
    : (
        ctx: Koa.ParameterizedContext<
          Koa.DefaultState,
          Koa.DefaultContext & {
            status: Concrete['status']
            query: Concrete['query']
            params: Concrete['params']
            request: {
              body: Concrete['body']
              query: Concrete['query']
            }
            response: DefaultKoaContext['response'] & {
              status: Concrete['status']
              body: Concrete['responseBodies']
            }
            body: Concrete['responseBodies']
          }
        >
      ) => Promise<void> | void

/**
 * Parameters for registering a route, including path, method, and optional schema.
 */
export interface OkapiRegisterParams<Schema extends RouteSchema> {
  /**
   * The route path (e.g., "/users/:id").
   */
  path: string
  /**
   * The HTTP method for the route (e.g., "get", "post").
   */
  method: HttpMethod
  /**
   * Optional schema definition for the route.
   */
  schema?: Schema
}

/**
 * Schema with an associated description for documentation purposes
 */
export interface SchemaWithDescription {
  description: string
  schema: AnyZodSchema
}

/**
 * Schema that may include a description alongside the Zod schema.
 */
export type DescribedSchema = SchemaWithDescription | AnyZodSchema

/**
 * Schema that describes the path parameters of a route.
 *
 * Each path parameter name maps to a DescribedSchema representing
 * the expected type of that path parameter, optionally providing
 * a `description` for OpenAPI/documentation purposes
 */
export type PathParameterMap = { [Name in string]?: DescribedSchema }

/**
 * Schema that describes the query parameters of a route.
 *
 * Each query parameter name maps to a DescribedSchema representing
 * the expected type of that query parameter, optionally providing
 * a `description` for OpenAPI/documentation purposes
 */
export type QueryParameterMap = { [Name in string]?: DescribedSchema }

/**
 * Schema that describes the possible response statuses and the response
 * body type(s) associated with them.
 *
 * Each status code maps to a DescribedSchema representing the response body
 * for that status, optionally providing a `description` for
 * OpenAPI/documentation purposes
 */
export type ResponseSchemaMap = { [Status in number]?: DescribedSchema }

/**
 * Schema definition for a route, including optional summary, description, tags,
 * and Zod schemas for params, query, body, and responses.
 *
 * Supports zod v3 and zod v4
 *
 * @see {@link AnyZodSchema}
 */
export interface RouteSchema {
  /**
   * A brief summary of the route's purpose.
   */
  summary?: string
  /**
   * A detailed description of the route.
   */
  description?: string
  /**
   * Tags categorizing the route.
   */
  tags?: string[]
  /**
   * Optional map of Zod schemas for inferring and validating route
   * parameters
   */
  params?: PathParameterMap
  /**
   * Optional map of Zod schemas for inferring and validating query
   * string parameters
   */
  query?: PathParameterMap
  /**
   * Zod schema for request body, optionally with description
   */
  body?: DescribedSchema
  /**
   * Zod schemas for validating responses, keyed by HTTP status code.
   */
  response?: Record<number, DescribedSchema>
}
