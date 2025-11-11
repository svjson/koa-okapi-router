import { describe, it, expect } from 'vitest'

import { koaFixture } from './fixtures'

describe('OkapiRouter', () => {
  describe('Method Registration', () => {
    it('should expose GET endpoint', async () => {
      // Given
      const fixture = koaFixture()
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
  })
})
