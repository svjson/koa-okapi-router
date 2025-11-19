import { describe, expectTypeOf, it } from 'vitest'
import { IsUndefined } from '@src/type-utilities'
import { ConcreteRouteSchema } from '@src/infer-schema'

describe('Type Utilities', () => {
  describe('IsUndefined', () => {
    /**
     * `undefined` literal is undefined
     * -------------------------------------------------------------------------
     */
    it('should evaluate to `true` for literal undefined', () => {
      expectTypeOf<IsUndefined<undefined>>().toExtend<true>()
    })

    /**
     * `undefined` literal is undefined
     * -------------------------------------------------------------------------
     */
    it('should evaluate to `true` for object member defined as undefined', () => {
      const _routeSchema = {
        response: undefined,
      }

      type Type = IsUndefined<(typeof _routeSchema)['response']>

      expectTypeOf<Type>().toExtend<true>()
    })

    /**
     * Materialized field on ConcreteSchema from object with missing property
     * -------------------------------------------------------------------------
     */
    it('should evaluate to `true` for concretized missing property', () => {
      const _routeSchema = {
        response: undefined,
      }

      type Type = IsUndefined<ConcreteRouteSchema<typeof _routeSchema>['response']>

      expectTypeOf<Type>().toExtend<true>()
    })
  })
})
