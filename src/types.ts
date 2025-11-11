import KoaRouter from '@koa/router'
import { DefaultContext, DefaultState } from 'koa'

import { AnyZodSchema } from './zod-adapter'

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
 * De-noisified Koa middleware type
 */
export type Middleware = KoaRouter.Middleware<DefaultState, DefaultContext, unknown>
/**
 * De-noisified one-or-many koa middleware type
 */
export type MiddlewareArg = Middleware | Middleware[]

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
    zod?: any
  }
}

/**
 * Function signature for registering a route with a specific HTTP method, schema
 * and middleware handler(s)
 */
export type OkapiRegisterMethodFunction = (
  path: string | RegExp,
  schema: RouteSchema,
  middleware: MiddlewareArg
) => void

/**
 * OkapiRouter type extending KoaRouter with typed methods for each HTTP method
 * and route registration.
 */
export type OkapiRouter = {
  [M in HttpMethod]: OkapiRegisterMethodFunction
} & {
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
  register: (params: OkapiRegisterParams, middelware: MiddlewareArg) => void
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
 * Parameters for registering a route, including path, method, and optional schema.
 */
export interface OkapiRegisterParams {
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
  schema?: RouteSchema
}

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
   * Zod schemas for validating route parameters
   */
  params?: AnyZodSchema
  /**
   * Zod schemas for validating query string parameters
   */
  query?: AnyZodSchema
  /**
   * Zod schemas for validating query strings
   */
  body?: AnyZodSchema
  /**
   * Zod schemas for validating responses, keyed by HTTP status code.
   */
  response?: Record<number, AnyZodSchema>
}
