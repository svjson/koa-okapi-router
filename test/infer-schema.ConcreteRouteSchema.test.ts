import { describe, it, expectTypeOf } from 'vitest'
import { ConcreteRouteSchema } from '@src/infer-schema'
import { RouteSchema } from './types'

describe('Infer Schema', () => {
  describe('ConcreteRouteSchema', () => {
    it('should infer all properties to undefined except the provided description', () => {
      const _onlyDescription = {
        description: 'No types',
      } satisfies RouteSchema

      type OnlyDescription = ConcreteRouteSchema<typeof _onlyDescription>

      expectTypeOf<OnlyDescription>().toEqualTypeOf<{
        summary: undefined
        description: string
        tags: undefined
        params: undefined
        query: undefined
        body: undefined
        response: undefined
      }>()
    })
  })
})
