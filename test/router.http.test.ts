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
})
