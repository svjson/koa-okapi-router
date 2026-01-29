import z from 'zod/v4'
import { describe, expect, it } from 'vitest'
import KoaRouter from '@koa/router'

import { makeOkapiRouter } from '@src/index'

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
})
