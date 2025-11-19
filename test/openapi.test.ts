import { describe, expect, it } from 'vitest'
import z4 from 'zod'
import z3 from 'zod/v3'
import KoaRouter from '@koa/router'
import { koaSwagger } from 'koa2-swagger-ui'

import type { RouteSchema, ZodLike } from '@src/types'
import { buildOpenApiJson, collectParameters } from '@src/openapi'
import { makeZodAdapter } from '@src/zod-adapter'

import { koaFixture } from './http-fixtures'
import {
  ModelSchemas,
  OpenAPISchemaFixture,
  openapiSchemasZodV3,
  openapiSchemasZodV4,
  routeSchemas,
} from './thing-api-fixtures'

const ThingSchemaV3 = z3.object({ id: z3.number(), name: z3.string(), type: z3.string() })
const ThingSearchResponseSchemaV3 = z3.array(ThingSchemaV3)
const RockPaperScissorsEnumV3 = z3.enum(['rock', 'paper', 'scissors'])

const ThingSchemaV4 = z4.object({ id: z4.number(), name: z4.string(), type: z4.string() })
const ThingSearchResponseSchemaV4 = z4.array(ThingSchemaV4)
const RockPaperScissorsEnumV4 = z4.enum(['rock', 'paper', 'scissors'])

type RoutesBase = {
  GetThingsRouteSchema: any
  PostThingRouteSchema: any
  GetThingByIdRouteSchema: any
  PutThingAtIdRouteSchema: any
  DeleteThingWithIdRouteSchema: any
}

const makeSwaggerUISuite = <Z extends ZodLike, Routes extends RoutesBase>(
  z: Z,
  openapiSchemas: OpenAPISchemaFixture,
  routes: Routes
) => {
  describe('Swagger UI', () => {
    it('should serve openapi.json at default location', async () => {
      // Given
      const fixture = koaFixture(z)
      const { koa, okapiRouter } = fixture

      okapiRouter.get('/api/things', routes.GetThingsRouteSchema, async (ctx) => {
        ctx.status = 200
        ctx.body = [
          {
            id: 4,
            name: 'A Blue-ish Thing',
            type: 'Standard',
          },
        ]
      })

      koa.use(
        new KoaRouter()
          .get(okapiRouter.openapiJsonUrl, async (ctx) => {
            ctx.body = okapiRouter.openapiJson()
          })
          .routes()
      )

      koa.use(
        koaSwagger({
          routePrefix: '/swagger',
          swaggerOptions: { url: okapiRouter.openapiJsonUrl },
        })
      )

      fixture.start()

      // When
      const jsonResponse = await (
        await fixture.client().get(okapiRouter.openapiJsonUrl)
      ).json()

      // Then
      expect(jsonResponse).toEqual({
        openapi: '3.1.0',
        info: { title: 'Koa Application', version: '1.0.0' },
        paths: { '/api/things': { get: openapiSchemas['/api/things'].get } },
      })
    })
  })
}

const makeOpenAPIJsonSuite = <Z extends ZodLike, Routes extends RoutesBase>(
  z: Z,
  openapiSchemas: OpenAPISchemaFixture,
  schemas: ModelSchemas,
  routes: Routes
) => {
  describe('collectParameters', () => {
    it('should produce schema with enum values for enum type query parameter', () => {
      // When
      const queryParams = collectParameters(
        makeZodAdapter(z),
        {
          move: schemas.RockPaperScissorsEnum,
        },
        'query'
      )

      // Then
      expect(queryParams).toMatchObject([
        {
          name: 'move',
          in: 'query',
          required: true,
          schema: {
            type: 'string',
            enum: ['rock', 'paper', 'scissors'],
          },
        },
      ])
    })
  })

  describe('buildOpenApiJson', () => {
    it('should build an openapi.json from a single route schema', () => {
      // Given
      const schema: RouteSchema = routes.GetThingsRouteSchema

      // When
      const openapiDocs = buildOpenApiJson(
        { 'get /api/things': schema },
        {
          openapi: {
            info: { title: 'API', version: '1.0.0' },
            jsonUrl: '/openapi.json',
          },
          schema: { zod: z },
        }
      )

      // Then
      expect(openapiDocs).toEqual({
        openapi: '3.1.0',
        info: { title: 'API', version: '1.0.0' },
        paths: { '/api/things': { get: openapiSchemas['/api/things'].get } },
      })
    })

    it('should build an openapi.json with a post body', () => {
      // Given
      const schema: RouteSchema = routes.PostThingRouteSchema

      // When
      const openapiDocs = buildOpenApiJson(
        { 'post /api/things': schema },
        {
          openapi: {
            info: { title: 'API', version: '1.0.0' },
            jsonUrl: '/openapi.json',
          },
          schema: { zod: z },
        }
      )

      // Then
      expect(openapiDocs).toEqual({
        openapi: '3.1.0',
        info: { title: 'API', version: '1.0.0' },
        paths: { '/api/things': { post: openapiSchemas['/api/things'].post } },
      })
    })

    it('should build an openapi.json from routes with different methods on same url', () => {
      // Given
      const getSchema: RouteSchema = routes.GetThingByIdRouteSchema
      const putSchema: RouteSchema = routes.PutThingAtIdRouteSchema
      const deleteSchema: RouteSchema = routes.DeleteThingWithIdRouteSchema

      // When
      const openapiDocs = buildOpenApiJson(
        {
          'get /api/things/:id': getSchema,
          'put /api/things/:id': putSchema,
          'delete /api/things/:id': deleteSchema,
        },
        {
          openapi: {
            info: { title: 'Thing API', version: '1.1.0' },
            jsonUrl: '/openapi.json',
          },
          schema: { zod: z },
        }
      )

      // Then
      expect(openapiDocs).toEqual({
        openapi: '3.1.0',
        info: { title: 'Thing API', version: '1.1.0' },
        paths: {
          '/api/things/:id': openapiSchemas['/api/things/:id'],
        },
      })
    })
  })
}

describe('OpenAPI', () => {
  describe('zod 3', () => {
    const schemas = {
      z: z3,
      ThingSchema: ThingSchemaV3,
      ThingSchemaWithoutId: ThingSchemaV3.omit({ id: true }),
      ThingSearchResponseSchema: ThingSearchResponseSchemaV3,
      RockPaperScissorsEnum: RockPaperScissorsEnumV3,
    }
    makeSwaggerUISuite(z3, openapiSchemasZodV3, routeSchemas(schemas))
    makeOpenAPIJsonSuite(z3, openapiSchemasZodV3, schemas, routeSchemas(schemas))
  })
  describe('zod 4', () => {
    const schemas = {
      z: z4,
      ThingSchema: ThingSchemaV4,
      ThingSchemaWithoutId: ThingSchemaV4.omit({ id: true }),
      ThingSearchResponseSchema: ThingSearchResponseSchemaV4,
      RockPaperScissorsEnum: RockPaperScissorsEnumV4,
    }
    makeSwaggerUISuite(z4, openapiSchemasZodV4, routeSchemas(schemas))
    makeOpenAPIJsonSuite(z4, openapiSchemasZodV4, schemas, routeSchemas(schemas))
  })
})
