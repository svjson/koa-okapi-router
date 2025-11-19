import { describe, expectTypeOf, it, test } from 'vitest'
import { IsAny } from '@src/type-utilities'
import { DefaultKoaContext } from './types'

describe('Type Utilities', () => {
  describe('IsExactly', () => {
    it('should evaluate to `true` for literal any', () => {
      expectTypeOf<IsAny<any>>().toExtend<true>()
    })

    it('should evalutate to `true` any-typed field on other type', () => {
      type Type = {
        id: number
        name: any
      }
      expectTypeOf<IsAny<Type['name']>>().toExtend<true>()
    })

    it('should evaluate to `false` for literal string', () => {
      expectTypeOf<IsAny<string>>().toExtend<false>()
    })

    it('should evalutate to `false` number-typed field on other type', () => {
      type Type = {
        id: number
        name: any
      }
      expectTypeOf<IsAny<Type['id']>>().toExtend<false>()
    })

    it('should evalutate to `false` a generic dict', () => {
      expectTypeOf<IsAny<{ id: number; name: any }>>().toExtend<false>()
    })

    test('Default Koa params is `any`', () => {
      expectTypeOf<DefaultKoaContext['params']>().toEqualTypeOf<any>()
      expectTypeOf<IsAny<DefaultKoaContext['params']>>().toExtend<true>()
    })
  })
})
