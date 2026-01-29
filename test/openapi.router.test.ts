import z from 'zod/v4'
import { describe, expect, it } from 'vitest'
import KoaRouter from '@koa/router'

import { makeOkapiRouter } from '@src/index'
import { ActorSchema } from './zod-schema-fixtures'

describe('OkapiRouter', () => {
  const UserSchema = z.object({
    id: z.number(),
    username: z.string(),
    roles: z.array(
      z.object({
        roleId: z.string(),
      })
    ),
  })

  const userJsonSchema = {
    type: 'object',
    additionalProperties: false,
    properties: {
      id: {
        type: 'number',
      },
      username: {
        type: 'string',
      },
      roles: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          properties: {
            roleId: {
              type: 'string',
            },
          },
          required: ['roleId'],
        },
      },
    },
    required: ['id', 'username', 'roles'],
  }

  describe('Schema declaration', () => {
    it('should generate schema with component registered inline in route schema', () => {
      const router = makeOkapiRouter(new KoaRouter(), {})

      router.get(
        '/user',
        {
          response: {
            200: {
              name: 'User',
              description: 'User details of the active user',
              schema: UserSchema,
            },
          },
        },
        (ctx) => {
          ctx.body = {
            id: 2,
            username: 'root',
            roles: [{ roleId: 'all-of-them' }],
          }
        }
      )

      const openApiJson = router.openapiJson()

      expect(openApiJson).toEqual({
        info: {
          title: 'Koa Application',
          version: '1.0.0',
        },
        openapi: '3.1.0',
        paths: {
          '/user': {
            get: {
              responses: {
                200: {
                  description: 'User details of the active user',
                  content: {
                    'application/json': {
                      schema: {
                        $ref: '#/components/schemas/User',
                      },
                    },
                  },
                },
              },
            },
          },
        },
        components: {
          schemas: {
            User: userJsonSchema,
          },
        },
      })
    })
  })

  it('should generate schema containing a discriminated union type', () => {
    const router = makeOkapiRouter(new KoaRouter(), {})

    router.get(
      '/user/:id',
      {
        response: {
          200: {
            description: 'Get an Actor entity by ID',
            schema: ActorSchema,
          },
        },
      },
      (ctx) => {
        ctx.body = {
          id: 2,
          type: 'author',
          name: 'Benny Boxare',
          genres: ['self-help', 'crime'],
        }
      }
    )

    const openApiJson = router.openapiJson()

    expect(openApiJson).toEqual({
      info: {
        title: 'Koa Application',
        version: '1.0.0',
      },
      openapi: '3.1.0',
      paths: {
        '/user/{id}': {
          get: {
            responses: {
              200: {
                content: {
                  'application/json': {
                    schema: {
                      anyOf: [
                        {
                          additionalProperties: false,
                          properties: {
                            genres: {
                              items: {
                                enum: [
                                  'crime',
                                  'mystery',
                                  'sci-fi',
                                  'fantasy',
                                  'self-help',
                                  'blatant propaganda',
                                ],
                                type: 'string',
                              },
                              type: 'array',
                            },
                            id: {
                              maximum: 9007199254740991,
                              minimum: -9007199254740991,
                              type: 'integer',
                            },
                            name: {
                              type: 'string',
                            },
                            type: {
                              const: 'author',
                              type: 'string',
                            },
                          },
                          required: ['id', 'name', 'type', 'genres'],
                          type: 'object',
                        },
                        {
                          additionalProperties: false,
                          properties: {
                            id: {
                              maximum: 9007199254740991,
                              minimum: -9007199254740991,
                              type: 'integer',
                            },
                            name: {
                              type: 'string',
                            },
                            region: {
                              type: 'string',
                            },
                            type: {
                              const: 'publisher',
                              type: 'string',
                            },
                          },
                          required: ['id', 'name', 'type', 'region'],
                          type: 'object',
                        },
                      ],
                    },
                  },
                },
                description: 'Get an Actor entity by ID',
              },
            },
          },
        },
      },
    })
  })
})
