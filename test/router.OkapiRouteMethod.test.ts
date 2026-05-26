import { describe, it, expectTypeOf } from 'vitest'
import z from 'zod'
import Koa from 'koa'
import KoaRouter from '@koa/router'
import { makeOkapiRouter } from '@src/index'
import { OkapiRouteMethod } from '@src/types'

describe('OkapiRouteMethod overloads', () => {
  it('should accept a single typed handler (0 pre-middlewares)', () => {
    const router = makeOkapiRouter(new KoaRouter())

    expectTypeOf(router.get).toExtend<OkapiRouteMethod>()

    // Verify the call compiles with just a handler
    router.get('/test', {}, async (_ctx) => {})
  })

  it('should accept one pre-middleware followed by a typed handler', () => {
    const router = makeOkapiRouter(new KoaRouter())
    const pre: Koa.Middleware = async (_ctx, next) => {
      await next()
    }

    router.get('/test', {}, pre, async (_ctx) => {})
  })

  it('should preserve typed handler ctx inference when pre-middlewares are present', () => {
    const router = makeOkapiRouter(new KoaRouter())
    const schema = {
      query: { name: z.string() },
      response: { 200: z.object({ greeting: z.string() }) },
    }
    const pre: Koa.Middleware = async (_ctx, next) => {
      await next()
    }

    router.get('/test', schema, pre, (ctx) => {
      // ctx.query.name should be typed as string
      expectTypeOf(ctx.query.name).toEqualTypeOf<string>()
      // ctx.body should be typed as the response body
      expectTypeOf(ctx.body).toEqualTypeOf<{ greeting: string }>()
    })
  })

  it('should support all HTTP methods with pre-middlewares', () => {
    const router = makeOkapiRouter(new KoaRouter())
    const pre: Koa.Middleware = async (_ctx, next) => {
      await next()
    }

    router.get('/test', {}, pre, async (_ctx) => {})
    router.post('/test', {}, pre, async (_ctx) => {})
    router.put('/test', {}, pre, async (_ctx) => {})
    router.patch('/test', {}, pre, async (_ctx) => {})
    router.delete('/test', {}, pre, async (_ctx) => {})
    router.head('/test', {}, pre, async (_ctx) => {})
    router.options('/test', {}, pre, async (_ctx) => {})
  })
})
