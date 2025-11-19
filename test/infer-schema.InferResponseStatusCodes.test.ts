import { describe, it, expectTypeOf } from 'vitest'
import z from 'zod'
import { InferResponseStatusCodes } from '@src/infer-schema'
import { RouteSchema } from './types'

describe('Infer Schema', () => {
  describe('InferResponseStatusCodes', () => {
    /**
     * No Defined Responses
     * -------------------------------------------------------------------------
     */
    it('should resolve to `number` if no response are defined', () => {
      const _routeSchema = {
        description: 'No types',
      } satisfies RouteSchema

      type Status = InferResponseStatusCodes<typeof _routeSchema>

      expectTypeOf<Status>().toBeNumber()
    })

    /**
     * Single Defined Response
     * -------------------------------------------------------------------------
     */
    it('should resolve to `number` if no response are defined', () => {
      const _routeSchema = {
        response: {
          200: z.string(),
        },
      } satisfies RouteSchema

      type Status = InferResponseStatusCodes<typeof _routeSchema>

      expectTypeOf<Status>().toEqualTypeOf<200>()
    })

    /**
     * Multiple Defined Responses
     * -------------------------------------------------------------------------
     */
    it('should resolve to union of declared status code numbers', () => {
      const _routeSchema = {
        response: {
          200: z.string(),
          404: z.null(),
          500: z.object({
            error: z.string(),
          }),
        },
      } satisfies RouteSchema

      type Status = InferResponseStatusCodes<typeof _routeSchema>

      expectTypeOf<Status>().toEqualTypeOf<200 | 404 | 500>()
    })
  })
})
