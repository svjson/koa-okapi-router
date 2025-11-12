import z from 'zod/v3'
import { describe, expect, it } from 'vitest'
import { makeZodAdapter } from '@src/zod-adapter'

describe('ZodAdapter', () => {
  describe('makeZodAdapter', () => {
    describe('zod v3', () => {
      it('should identify zod/v3', () => {
        // When
        const zodAdapter = makeZodAdapter(z)

        // Then
        expect(zodAdapter).toMatchObject({
          isV4: false,
          major: 3,
        })
      })

      it('should convert zod schema to JsonSchema', () => {
        // Given
        const zodAdapter = makeZodAdapter(z)
        const schema = z.object({
          id: z.number().int(),
          name: z.string(),
          details: z.object({
            size: z.number(),
            weight: z.number(),
          }),
        })

        // When
        const jsonSchema = zodAdapter.toJsonSchema(schema)

        // Then
        expect(jsonSchema).toEqual({
          type: 'object',
          properties: {
            id: {
              type: 'integer',
            },
            name: { type: 'string' },
            details: {
              type: 'object',
              properties: { size: { type: 'number' }, weight: { type: 'number' } },
              required: ['size', 'weight'],
              additionalProperties: false,
            },
          },
          required: ['id', 'name', 'details'],
          additionalProperties: false,
        })
      })
    })
  })
})
