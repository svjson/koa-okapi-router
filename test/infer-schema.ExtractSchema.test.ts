import z from 'zod'
import { describe, it, expectTypeOf } from 'vitest'
import { ConcreteRouteSchema, ExtractSchema } from '@src/infer-schema'
import { RouteSchema } from './types'

describe('Infer Schema', () => {
  describe('ExtractSchema', () => {
    /**
     * Only Literal Body
     * -------------------------------------------------------------------------
     */
    it('should extract literal body', () => {
      const onlyLiteralBody = {
        body: z.object({ bakedGoods: z.enum(['cheesemuffin', 'cake']) }),
      } satisfies RouteSchema

      type OnlyLiteralBody = ExtractSchema<
        ConcreteRouteSchema<typeof onlyLiteralBody>['body']
      >

      expectTypeOf<OnlyLiteralBody>().toEqualTypeOf(onlyLiteralBody.body)
    })
    /**
     * Only Body With Description
     * -------------------------------------------------------------------------
     */
    const onlyBodyWithDescription = {
      body: {
        description: 'These are what we have on offer. Take it or leave it.',
        schema: z.object({ bakedGoods: z.enum(['cheesemuffin', 'cake']) }),
      },
    } satisfies RouteSchema

    type OnlyBodyWithDescription = ConcreteRouteSchema<typeof onlyBodyWithDescription>
    type OnlyBodyWithDescriptionBody = ExtractSchema<OnlyBodyWithDescription['body']>

    // Then
    expectTypeOf<OnlyBodyWithDescriptionBody>().toEqualTypeOf(
      onlyBodyWithDescription.body.schema
    )
  })
})
