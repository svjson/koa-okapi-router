import { describe, expect, it } from 'vitest'
import z4 from 'zod'
import z3 from 'zod/v3'
import KoaRouter from '@koa/router'
import { koaSwagger } from 'koa2-swagger-ui'

import type { RouteSchema, ZodLike } from '@src/types'
import { buildOpenApiJson } from '@src/openapi'

import { koaFixture } from './http-fixtures'
import {
  modelSchemas,
  OpenAPISchemaFixture,
  openapiSchemasZodV3,
  openapiSchemasZodV4,
  routeSchemas,
} from './thing-api-fixtures'

describe.for([
  ['zod v4', z4, openapiSchemasZodV4],
  ['zod v3', z3, openapiSchemasZodV3],
] as [string, ZodLike, OpenAPISchemaFixture][])('%s', ([_, z, openapiSchemas]) => {
  const schemas = modelSchemas(z)
  const routes = routeSchemas(schemas)

  describe('OpenAPI', () => {
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
          paths: { '/api/things': openapiSchemas['/api/things'] },
        })
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
          paths: { '/api/things': openapiSchemas['/api/things'] },
        })
      })

      it('should build an openapi.json from routes with different methods on same url', () => {
        // Given
        const getSchema: RouteSchema = routes.GetThingByIdRouteSchema
        const putSchema: RouteSchema = routes.PutThingAtIdRouteSchema

        // When
        const openapiDocs = buildOpenApiJson(
          {
            'get /api/things/:id': getSchema,
            'put /api/things/:id': putSchema,
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
  })
})
