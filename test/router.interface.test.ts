import KoaRouter from '@koa/router'
import { describe, it, expect } from 'vitest'

import { makeOkapiRouter } from '@src/index'

describe('OkapiRouter', () => {
  describe('Method Registration', () => {
    it('should expose function for all http methods', () => {
      // Given
      const koaRouter = new KoaRouter()
      const okapiRouter = makeOkapiRouter(koaRouter)

      // Then
      expect(okapiRouter.get).toBeInstanceOf(Function)
      expect(okapiRouter.post).toBeInstanceOf(Function)
      expect(okapiRouter.put).toBeInstanceOf(Function)
      expect(okapiRouter.head).toBeInstanceOf(Function)
      expect(okapiRouter.options).toBeInstanceOf(Function)
      expect(okapiRouter.delete).toBeInstanceOf(Function)
      expect(okapiRouter.patch).toBeInstanceOf(Function)
    })
  })
})
