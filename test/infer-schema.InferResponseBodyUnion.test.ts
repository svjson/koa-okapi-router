import z from 'zod'
import { describe, it, expectTypeOf } from 'vitest'
import { InferResponseBodyUnion } from '@src/infer-schema'

describe('Infer Schema', () => {
  describe('InferResponseBodyUnion', () => {
    /**
     * No defined response types
     * ---------------------------------------------------------------------------
     */
    it('should not narrow body type and keep it as `any`', () => {
      // Given
      const _routeSchema = {
        description: 'No types here',
      }

      // When
      type Schema = InferResponseBodyUnion<typeof _routeSchema>

      // Then
      expectTypeOf<Schema>().toBeUnknown()
    })

    /**
     * Responses defined as empty map
     * ---------------------------------------------------------------------------
     */
    it('should treat this as "No response body" and narrow to `never`', () => {
      // Given
      const _routeSchema = {
        response: {},
      }

      // When
      type Schema = InferResponseBodyUnion<typeof _routeSchema>

      // Then
      expectTypeOf<Schema>().toBeNever()
    })

    /**
     * Single response type
     * ---------------------------------------------------------------------------
     */
    it('should materialize the type as the only valid response body', () => {
      const _routeSchema = {
        response: {
          200: z.object({
            items: z.array(z.string()),
          }),
        },
      }

      type Schema = InferResponseBodyUnion<typeof _routeSchema>

      expectTypeOf<Schema>().toEqualTypeOf<{
        items: string[]
      }>()
    })

    /**
     * Multiple response types
     * ---------------------------------------------------------------------------
     */
    it('should materialize the type as union of possible response bodies', () => {
      const _routeSchema = {
        response: {
          200: z.object({
            items: z.array(z.string()),
          }),
          404: z.null(),
          500: z.object({
            title: z.string(),
            message: z.string(),
            errorId: z.number(),
          }),
        },
      }

      type Schema = InferResponseBodyUnion<typeof _routeSchema>

      expectTypeOf<Schema>().toEqualTypeOf<
        | {
            items: string[]
          }
        | null
        | {
            title: string
            message: string
            errorId: number
          }
      >()
    })
  })
})
