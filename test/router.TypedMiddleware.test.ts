import { describe, it, expectTypeOf } from 'vitest'
import z from 'zod'
import Koa from 'koa'
import { DefaultKoaContext, TypedMiddleware } from '@src/types'

describe('TypedMiddleware inference', () => {
  describe('No type information', () => {
    it('should not affect Koa Context when only decription is declared', () => {
      type RouteType = TypedMiddleware<{
        description: 'No type information for YOU!'
      }>

      expectTypeOf<RouteType>().toEqualTypeOf<
        (
          ctx: Koa.ParameterizedContext<Koa.DefaultState, Koa.DefaultContext, unknown>
        ) => Promise<void> | void
      >()
    })

    it('should narrow query parameter to expressed query parameter names and types', () => {
      const schema = {
        query: {
          q: z.array(z.string()),
          page: z.string(),
        },
      }

      type RouteType = TypedMiddleware<typeof schema>

      type ExpectedType = (
        ctx: Koa.ParameterizedContext<
          Koa.DefaultState,
          Koa.DefaultContext & {
            status: number
            query: {
              q: string[]
              page: string
            }
            params: DefaultKoaContext['params']
            request: {
              body: DefaultKoaContext['request']['body']
              query: {
                q: string[]
                page: string
              }
            }
            response: DefaultKoaContext['response'] & {
              body: DefaultKoaContext['response']['body']
              status: DefaultKoaContext['response']['status']
            }
            body: DefaultKoaContext['body']
          },
          unknown
        >
      ) => Promise<void> | void

      expectTypeOf<RouteType>().toEqualTypeOf<ExpectedType>()
    })

    it('should narrow path parameters to expressed path parameter names and types', () => {
      const schema = {
        params: {
          location: z.string(),
          unit: z.string(),
        },
      }

      type RouteType = TypedMiddleware<typeof schema>

      type ExpectedType = (
        ctx: Koa.ParameterizedContext<
          Koa.DefaultState,
          Koa.DefaultContext & {
            status: number
            query: DefaultKoaContext['query']
            params: {
              location: string
              unit: string
            }
            request: {
              body: DefaultKoaContext['request']['body']
              query: DefaultKoaContext['query']
            }
            response: DefaultKoaContext['response'] & {
              body: DefaultKoaContext['response']['body']
              status: DefaultKoaContext['response']['status']
            }
            body: DefaultKoaContext['body']
          },
          unknown
        >
      ) => Promise<void> | void

      expectTypeOf<RouteType>().toEqualTypeOf<ExpectedType>()
    })

    it('should narrow request body', () => {
      const schema = {
        body: z.object({
          id: z.number(),
          name: z.string(),
          roles: z.array(z.string()),
          department: z.object({
            id: z.number(),
            name: z.string(),
          }),
        }),
      }

      type RouteType = TypedMiddleware<typeof schema>

      type ExpectedType = (
        ctx: Koa.ParameterizedContext<
          Koa.DefaultState,
          Koa.DefaultContext & {
            status: number
            query: DefaultKoaContext['query']
            params: DefaultKoaContext['params']
            request: {
              body: {
                id: number
                name: string
                roles: string[]
                department: {
                  id: number
                  name: string
                }
              }
              query: DefaultKoaContext['query']
            }
            response: DefaultKoaContext['response'] & {
              body: DefaultKoaContext['response']['body']
              status: DefaultKoaContext['response']['status']
            }
            body: DefaultKoaContext['body']
          },
          unknown
        >
      ) => Promise<void> | void

      expectTypeOf<RouteType>().toEqualTypeOf<ExpectedType>()
    })
  })
})
