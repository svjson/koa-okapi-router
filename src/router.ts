import KoaRouter from '@koa/router'

import { HTTP_METHODS } from './types'
import { mergeDefaults } from './options'

import type { DeepPartial } from './options'
import type {
  OkapiRouter,
  OkapiRouterOptions,
  HttpMethod,
  RouteSchema,
  OkapiRegisterParams,
} from './types'
import { buildOpenApiJson } from './openapi'
import z from 'zod'
import { TypedMiddleware } from './infer-schema'

export const materializeOptions = (
  opts: DeepPartial<OkapiRouterOptions>
): OkapiRouterOptions => {
  const merged = mergeDefaults(
    {
      openapi: {
        info: {
          title: 'Koa Application',
          version: '1.0.0',
        },
        jsonUrl: '/openapi.json',
      },
      schema: {
        zod: undefined,
      },
    },
    opts
  )

  if (!merged.schema.zod) merged.schema.zod = z
  return merged
}

/**
 * Creates an OkapiRouter by wrapping a KoaRouter instance and providing
 * typed methods for route registration.
 *
 * @param koaRouter - The KoaRouter instance to wrap.
 * @param opts - Options for configuring the OkapiRouter.
 * @returns An OkapiRouter with typed route registration methods.
 */
export const makeOkapiRouter = (
  koaRouter: KoaRouter,
  opts: DeepPartial<OkapiRouterOptions> = {}
): OkapiRouter => {
  /**
   * Produce a concrete OkapiRouteOptions object from the provided
   * partial.
   */
  const _opts = materializeOptions(opts)
  /**
   * Globally registered schemas
   */
  const schemas: Record<string, RouteSchema> = {}

  /**
   * Bare-ones register function.
   *
   * All method-specific methods work as syntactic sugar over this
   * one function for registering routes.
   */
  function register<Schema extends RouteSchema>(
    { path, method, schema }: OkapiRegisterParams<Schema>,
    middleware: any
  ) {
    koaRouter.register(path, [method], middleware)
    if (schema) {
      schemas[`${method} ${path}`] = schema
    }
  }

  /**
   * Construct OkapiRouter base by generating convenience methods for
   * registering routes by method, according to the router configuration
   *
   */
  const router = HTTP_METHODS.reduce(
    (_router: Partial<Record<HttpMethod, any>>, method: HttpMethod) => {
      _router[method] = <Schema extends RouteSchema>(
        urlPattern: string,
        schema: Schema,
        middleware: TypedMiddleware<Schema>
      ) => {
        register(
          {
            method,
            path: urlPattern,
            schema,
          },
          middleware
        )
      }
      return _router
    },
    {}
  )

  /**
   * Bind together and return an object fulfilling the OkapiRouter interface
   */
  return {
    ...router,
    register,
    routes: function () {
      return koaRouter.routes()
    },
    openapiJsonUrl: _opts.openapi.jsonUrl,
    openapiJson: () => {
      return buildOpenApiJson(schemas, _opts)
    },
    allowedMethods: function () {
      return koaRouter.allowedMethods()
    },
  } as OkapiRouter
}
