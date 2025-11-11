import { describe, expect, it } from 'vitest'
import z from 'zod'
import KoaRouter from '@koa/router'
import { koaSwagger } from 'koa2-swagger-ui'

import { RouteSchema } from './types'
import { buildOpenApiJson } from '@src/openapi'
import { koaFixture } from './fixtures'

const ThingSchema = z.object({ id: z.number(), name: z.string(), type: z.string() })
const ThingSearchResponseSchema = z.array(ThingSchema)

const GetThingsRouteSchema = {
  summary: 'The thing',
  description: 'Returns the THING',
  tags: ['Thing API'],
  query: z.object({
    type: z.string(),
  }),
  response: {
    200: ThingSearchResponseSchema,
  },
}

const OpenAPIJson_getApiThings = {
  '/api/things': {
    get: {
      summary: 'The thing',
      description: 'Returns the THING',
      tags: ['Thing API'],
      responses: {
        '200': {
          description: 'Response',
          content: {
            'application/json': {
              schema: {
                type: 'string',
                $schema: 'http://json-schema.org/draft-07/schema#',
              },
            },
          },
        },
      },
    },
  },
}

describe('OpenAPI', () => {
  describe('Swagger UI', () => {
    it('should serve openapi.json at default location', async () => {
      // Given
      const fixture = koaFixture()
      const { koa, okapiRouter } = fixture

      okapiRouter.get('/api/things', GetThingsRouteSchema, async (ctx) => {
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
        paths: { ...OpenAPIJson_getApiThings },
      })
    })
  })

  describe('buildOpenApiJson', () => {
    it('should build an openapi.json from a single route schema', () => {
      // Given
      const schema: RouteSchema = GetThingsRouteSchema

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
        paths: { ...OpenAPIJson_getApiThings },
      })
    })
  })
})
