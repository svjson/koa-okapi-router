import type { PathsObject } from 'openapi3-ts/oas31'
import { ZodLike } from './types'

export const modelSchemas = (z: ZodLike) => {
  const ThingSchema = z.object({ id: z.number(), name: z.string(), type: z.string() })
  const ThingSearchResponseSchema = z.array(ThingSchema)

  return {
    z,
    ThingSchema,
    ThingSearchResponseSchema,
  }
}

export type ModelSchemas = ReturnType<typeof modelSchemas>

export const routeSchemas = (schemas: ModelSchemas) => {
  const { z, ThingSchema, ThingSearchResponseSchema } = schemas

  return {
    GetThingsRouteSchema: {
      summary: 'The thing',
      description: 'Returns the THING',
      tags: ['Thing API'],
      query: {
        type: z.string(),
      },
      response: {
        200: ThingSearchResponseSchema,
      },
    },
    GetThingByIdRouteSchema: {
      summary: 'Get Thing by ID',
      description: 'Returns the thing with the ID',
      tags: ['Thing API'],
      params: {
        id: z.string(),
      },
      response: {
        200: ThingSchema,
      },
    },
    PutThingAtIdRouteSchema: {
      summary: 'Update Thing with ID',
      description: 'Overwrites the Thing with ID',
      tags: ['Thing API'],
      params: {
        id: z.string(),
      },
      response: {
        204: z.null(),
      },
    },
  }
}

export type OpenAPISchemaFixture = PathsObject

export const openapiSchemasZodV3: OpenAPISchemaFixture = {
  '/api/things': {
    get: {
      summary: 'The thing',
      description: 'Returns the THING',
      tags: ['Thing API'],
      responses: {
        '200': {
          description: 'Response',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'number' },
                    name: { type: 'string' },
                    type: { type: 'string' },
                  },
                  required: ['id', 'name', 'type'],
                  additionalProperties: false,
                },
              },
            },
          },
        },
      },
    },
  },
  '/api/things/:id': {
    get: {
      summary: 'Get Thing by ID',
      description: 'Returns the thing with the ID',
      tags: ['Thing API'],
      parameters: [
        {
          in: 'path',
          name: 'id',
          required: true,
          schema: {
            type: 'string',
          },
        },
      ],
      responses: {
        '200': {
          //description: "Here's the thing...",
          description: 'Response',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  id: { type: 'number' },
                  name: { type: 'string' },
                  type: { type: 'string' },
                },
                required: ['id', 'name', 'type'],
                additionalProperties: false,
              },
            },
          },
        },
      },
    },
    put: {
      summary: 'Update Thing with ID',
      description: 'Overwrites the Thing with ID',
      tags: ['Thing API'],
      parameters: [
        {
          in: 'path',
          name: 'id',
          required: true,
          schema: {
            type: 'string',
          },
        },
      ],
      responses: {
        '204': {
          //        description: 'The Thing has been updated',
          description: 'Response',
          content: {
            'application/json': {
              schema: {
                enum: ['null'],
                nullable: true,
              },
            },
          },
        },
      },
    },
  },
}

export const openapiSchemasZodV4 = {
  '/api/things': {
    get: {
      summary: 'The thing',
      description: 'Returns the THING',
      tags: ['Thing API'],
      responses: {
        '200': {
          description: 'Response',
          content: {
            'application/json': {
              schema: {
                $schema: 'https://json-schema.org/draft/2020-12/schema',
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'number' },
                    name: { type: 'string' },
                    type: { type: 'string' },
                  },
                  required: ['id', 'name', 'type'],
                  additionalProperties: false,
                },
              },
            },
          },
        },
      },
    },
  },
  '/api/things/:id': {
    get: {
      summary: 'Get Thing by ID',
      description: 'Returns the thing with the ID',
      tags: ['Thing API'],
      parameters: [
        {
          in: 'path',
          name: 'id',
          required: true,
          schema: {
            $schema: 'https://json-schema.org/draft/2020-12/schema',
            type: 'string',
          },
        },
      ],
      responses: {
        '200': {
          //description: "Here's the thing...",
          description: 'Response',
          content: {
            'application/json': {
              schema: {
                $schema: 'https://json-schema.org/draft/2020-12/schema',
                type: 'object',
                properties: {
                  id: { type: 'number' },
                  name: { type: 'string' },
                  type: { type: 'string' },
                },
                required: ['id', 'name', 'type'],
                additionalProperties: false,
              },
            },
          },
        },
      },
    },
    put: {
      summary: 'Update Thing with ID',
      description: 'Overwrites the Thing with ID',
      tags: ['Thing API'],
      parameters: [
        {
          in: 'path',
          name: 'id',
          required: true,
          schema: {
            $schema: 'https://json-schema.org/draft/2020-12/schema',
            type: 'string',
          },
        },
      ],
      responses: {
        '204': {
          //        description: 'The Thing has been updated',
          description: 'Response',
          content: {
            'application/json': {
              schema: {
                $schema: 'https://json-schema.org/draft/2020-12/schema',
                type: 'null',
              },
            },
          },
        },
      },
    },
  },
}
