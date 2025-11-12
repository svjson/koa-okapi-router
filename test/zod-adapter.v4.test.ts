import z from 'zod/v4'
import { describe, expect, it } from 'vitest'
import { makeZodAdapter } from '@src/zod-adapter'

describe('ZodAdapter', () => {
  describe('makeZodAdapter', () => {
    describe('zod v4', () => {
      it('should identify zod/v4', () => {
        // When
        const zodAdapter = makeZodAdapter(z)

        // Then
        expect(zodAdapter).toMatchObject({
          isV4: true,
          major: 4,
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
          $schema: 'https://json-schema.org/draft/2020-12/schema',
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              minimum: -9007199254740991,
              maximum: 9007199254740991,
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
