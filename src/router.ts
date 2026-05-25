import KoaRouter from '@koa/router'
import Koa from 'koa'

import { HTTP_METHODS } from './types'
import { mergeDefaults } from './options'

import type { DeepPartial } from './options'
import type {
  OkapiRouter,
  OkapiRouterOptions,
  HttpMethod,
  RouteSchema,
  OkapiRegisterParams,
  TypedMiddleware,
  EntitySchema,
} from './types'
import { buildOpenApiJson, extendOpenApiJson } from './openapi'
import z from 'zod'
import { OpenAPIObject } from 'openapi3-ts/oas31'

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
   * Globally registered entity definitions
   */
  const entities: Record<string, EntitySchema> = {}

  /**
   * Add an entity/component schema for inclusion in openapi.json
   * generation.
   *
   * @param name - The canonical name of the entity.
   * @param entity - The EntitySchema defining the entity.
   */
  const addEntity = (name: string, entity: EntitySchema) => {
    entities[name] = entity
  }

  const addEntities = (entityMap: Record<string, EntitySchema>) => {
    Object.assign(entities, entityMap)
  }

  /**
   * Bare-bones register function.
   *
   * All method-specific methods work as syntactic sugar over this
   * one function for registering routes.
   *
   * Accepts an optional pre-handler middleware before the typed route handler.
   */
  const register = <Schema extends RouteSchema>(
    { path, method, schema }: OkapiRegisterParams<Schema>,
    ...middlewares: [...Koa.Middleware[], TypedMiddleware<Schema>]
  ) => {
    koaRouter.register(path, [method], middlewares as any[])
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
        ...middlewares: [...Koa.Middleware[], TypedMiddleware<Schema>]
      ) => {
        register({ method, path: urlPattern, schema }, ...middlewares)
      }
      return _router
    },
    {}
  )

  /**
   * Bind together and return an object fulfilling the OkapiRouter interface
   */
  return {
    addEntity,
    addEntities,
    ...router,
    register,
    routes() {
      return koaRouter.routes()
    },
    openapiJsonUrl: _opts.openapi.jsonUrl,
    openapiJson() {
      return buildOpenApiJson(schemas, entities, _opts)
    },
    extendOpenApiJson(input: OpenAPIObject | string) {
      return extendOpenApiJson(input, this.openapiJson())
    },
    allowedMethods() {
      return koaRouter.allowedMethods()
    },
  } as OkapiRouter
}
