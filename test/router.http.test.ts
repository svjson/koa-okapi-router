import { describe, it, expect } from 'vitest'
import z from 'zod'

import { koaFixture } from './http-fixtures'

describe('OkapiRouter', () => {
  describe('Method Registration', () => {
    it('should expose GET endpoint with empty schema', async () => {
      // Given
      const fixture = koaFixture(z)
      const { okapiRouter } = fixture

      // When
      okapiRouter.get('/api/hello', {}, async (ctx) => {
        ctx.status = 200
        ctx.body = { hello: 'world' }
      })
      fixture.start()

      // Then
      const response = await fixture.client().get('/api/hello')
      const body = await response.json()

      expect(body).toEqual({ hello: 'world' })
    })

    it('should expose GET endpoint with empty schema', async () => {
      // Given
      const fixture = koaFixture(z)
      const { okapiRouter } = fixture

      // When
      okapiRouter.get(
        '/api/hello',
        { body: z.object({ hello: z.string() }) },
        async (ctx) => {
          ctx.status = 200
        }
      )
      fixture.start()

      // Then
      const response = await fixture.client().get('/api/hello')
      const body = await response.text()

      expect(body).toEqual('OK')
    })

    it('should expose GET endpoint with response body schema', async () => {
      // Given
      const fixture = koaFixture(z)
      const { okapiRouter } = fixture

      // When
      okapiRouter.get(
        '/api/hello',
        { response: { 200: z.object({ hello: z.string() }) } },
        async (ctx) => {
          ctx.status = 200
          ctx.response.body = { hello: 'world' }
        }
      )
      fixture.start()

      // Then
      const response = await fixture.client().get('/api/hello')
      const body = await response.json()

      expect(body).toEqual({ hello: 'world' })
    })

    it('should expose POST endpoint with response body schema', async () => {
      // Given
      const fixture = koaFixture(z)
      const { okapiRouter } = fixture

      // When
      okapiRouter.post(
        '/api/hello',
        { response: { 200: z.object({ hello: z.string() }) } },
        async (ctx) => {
          ctx.status = 200
          ctx.body = { hello: 'world' }
        }
      )
      fixture.start()

      // Then
      const response = await fixture.client().post('/api/hello', {})
      const body = await response.json()

      expect(body).toEqual({ hello: 'world' })
    })

    it('should expose GET endpoint with path parameter', async () => {
      // Given
      const fixture = koaFixture(z)
      const { okapiRouter } = fixture

      // When
      okapiRouter.get(
        '/api/hello/:someone',
        {
          params: {
            someone: z.string(),
          },
        },
        async (ctx) => {
          const { someone } = ctx.params
          ctx.status = 200
          ctx.body = { hello: someone }
        }
      )
      fixture.start()

      // Then
      const response = await fixture.client().get('/api/hello/kitty')
      const body = await response.json()

      expect(body).toEqual({ hello: 'kitty' })
    })

    it('should expose GET endpoint with query parameters', async () => {
      // Given
      const fixture = koaFixture(z)
      const { okapiRouter } = fixture

      // When
      okapiRouter.get(
        '/api/hello',
        {
          query: {
            greeting: z.string(),
            who: z.array(z.string()),
          },
        },
        async (ctx) => {
          const { greeting, who } = ctx.query
          ctx.status = 200
          ctx.body = { [greeting]: who.join(' and ') }
        }
      )
      fixture.start()

      // Then
      const response = await fixture
        .client()
        .get('/api/hello?greeting=howdy&who=cowboy&who=cowgirl')
      const body = await response.json()

      expect(body).toEqual({ howdy: 'cowboy and cowgirl' })
    })
  })

  describe('Pre-handler middlewares', () => {
    it('should execute a pre-middleware before the route handler', async () => {
      // Given
      const fixture = koaFixture(z)
      const { okapiRouter } = fixture
      const callOrder: string[] = []

      // When
      okapiRouter.get(
        '/api/hello',
        {},
        async (_ctx, next) => {
          callOrder.push('pre')
          await next()
        },
        async (ctx) => {
          callOrder.push('handler')
          ctx.status = 200
          ctx.body = { hello: 'world' }
        }
      )
      fixture.start()

      // Then
      const response = await fixture.client().get('/api/hello')
      expect(response.status).toBe(200)
      expect(await response.json()).toEqual({ hello: 'world' })
      expect(callOrder).toEqual(['pre', 'handler'])
    })

    it('should support pre-middlewares via the register() method', async () => {
      // Given
      const fixture = koaFixture(z)
      const { okapiRouter } = fixture
      const callOrder: string[] = []

      // When
      okapiRouter.register(
        { method: 'get', path: '/api/hello', schema: {} },
        async (_ctx, next) => {
          callOrder.push('pre')
          await next()
        },
        async (ctx) => {
          callOrder.push('handler')
          ctx.status = 200
          ctx.body = {}
        }
      )
      fixture.start()

      // Then
      await fixture.client().get('/api/hello')
      expect(callOrder).toEqual(['pre', 'handler'])
    })
  })
})
