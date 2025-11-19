import { describe, expectTypeOf, it } from 'vitest'
import { IsUndefined, Not } from '@src/type-utilities'

describe('Type Utilities', () => {
  describe('Not', () => {
    it('should resolve literal true to false', () => {
      expectTypeOf<Not<true>>().toEqualTypeOf(false)
    })

    it('should resolve literal false to true', () => {
      expectTypeOf<Not<true>>().toEqualTypeOf(false)
    })

    it('should reverse truthy IsUndefined-check', () => {
      expectTypeOf<Not<IsUndefined<undefined>>>().toEqualTypeOf(false)
    })
  })
})
