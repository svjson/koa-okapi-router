import { describe, it, expectTypeOf } from 'vitest'
import { InferSchemaMap } from './infer-schema'

describe('Infer Schema', () => {
  describe('InferSchemaMap', () => {
    it('should resolve to ElseDefault option if not defined', () => {
      expectTypeOf<InferSchemaMap<undefined, 'not there'>>().toEqualTypeOf<'not there'>()
    })
  })
})
