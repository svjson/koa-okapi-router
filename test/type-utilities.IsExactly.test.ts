import { describe, expectTypeOf, it } from 'vitest'
import { IsExactly } from '@src/type-utilities'
import { DefaultKoaContext } from './types'

describe('Type Utilities', () => {
  describe('IsExactly', () => {
    it('should evaluate to `true` for number and number', () => {
      expectTypeOf<IsExactly<number, number>>().toExtend<true>()
    })

    it('should evaluate to `false` for number and narrowed number', () => {
      expectTypeOf<IsExactly<number, 200>>().toExtend<false>()
      expectTypeOf<IsExactly<200, number>>().toExtend<false>()
    })

    it('should evaluate to `false` from specific type and Koa Default params type', () => {
      expectTypeOf<IsExactly<{ location: string; unit: string }, any>>().toExtend<false>()
    })

    it('should evaluate to `false` from specific type and Koa Default params type', () => {
      expectTypeOf<
        IsExactly<{ location: string; unit: string }, DefaultKoaContext['params']>
      >().toExtend<false>()
    })
  })
})
