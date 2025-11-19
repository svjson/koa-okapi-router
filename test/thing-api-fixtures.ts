import { AnyZodSchema } from '@src/zod-adapter'
import { ZodLike } from '@src/types'

export interface ModelSchemas {
  z: ZodLike
  ThingSchemaWithoutId: AnyZodSchema
  ThingSchema: AnyZodSchema
  ThingSearchResponseSchema: any
  RockPaperScissorsEnum: AnyZodSchema
}

export const routeSchemas = <MS extends ModelSchemas>(schemas: MS) => {
  const { z, ThingSchema, ThingSchemaWithoutId, ThingSearchResponseSchema } = schemas

  return {
    GetThingsRouteSchema: {
      summary: 'The thing',
      description: 'Returns the THING',
      tags: ['Thing API'],
      query: {
        type: {
          description: 'Filter by type',
          schema: z.string().optional(),
        },
      },
      response: {
        200: ThingSearchResponseSchema,
      },
    },
    PostThingRouteSchema: {
      summary: 'Create a new Thing',
      description: 'Create a new Thing and assign it a new identity',
      tags: ['Thing API'],
      body: ThingSchemaWithoutId,
      response: {
        201: ThingSchema,
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
        200: { description: "Here's the thing...", schema: ThingSchema },
        404: z.null(),
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
        204: {
          description: 'The Thing has been updated',
          schema: z.null(),
        },
      },
    },
    DeleteThingWithIdRouteSchema: {
      summary: 'Delete Thing with ID',
      description: 'Wipe the Thing with ID from existence',
      tags: ['Thing API'],
      params: {
        id: {
          description: 'ID of the Thing to delete',
          schema: z.string(),
        },
      },
      response: {
        204: { description: 'Thing Deleted', schema: z.null() },
        404: z.null(),
      },
    },
  }
}

export const openapiSchemasZodV3 = {
  '/api/things': {
    get: {
      summary: 'The thing',
      description: 'Returns the THING',
      tags: ['Thing API'],
      parameters: [
        {
          name: 'type',
          description: 'Filter by type',
          in: 'query',
          required: false,
          schema: {
            anyOf: [
              {
                not: {},
              },
              {
                type: 'string',
              },
            ],
          },
        },
      ],
      responses: {
        '200': {
          description: 'OK',
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
    post: {
      summary: 'Create a new Thing',
      description: 'Create a new Thing and assign it a new identity',
      tags: ['Thing API'],
      requestBody: {
        description: 'Request Body',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                type: { type: 'string' },
              },
              required: ['name', 'type'],
              additionalProperties: false,
            },
          },
        },
      },
      responses: {
        201: {
          description: 'Created',
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
          description: "Here's the thing...",
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
        '404': {
          description: 'Not Found',
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
          description: 'The Thing has been updated',
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
    delete: {
      summary: 'Delete Thing with ID',
      description: 'Wipe the Thing with ID from existence',
      tags: ['Thing API'],
      parameters: [
        {
          name: 'id',
          description: 'ID of the Thing to delete',
          in: 'path',
          required: true,
          schema: {
            type: 'string',
          },
        },
      ],
      responses: {
        '204': {
          description: 'Thing Deleted',
          content: {
            'application/json': {
              schema: {
                enum: ['null'],
                nullable: true,
              },
            },
          },
        },
        '404': {
          description: 'Not Found',
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
      parameters: [
        {
          name: 'type',
          description: 'Filter by type',
          in: 'query',
          required: false,
          schema: {
            type: 'string',
          },
        },
      ],
      responses: {
        '200': {
          description: 'OK',
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
    post: {
      summary: 'Create a new Thing',
      description: 'Create a new Thing and assign it a new identity',
      tags: ['Thing API'],
      requestBody: {
        description: 'Request Body',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                type: { type: 'string' },
              },
              required: ['name', 'type'],
              additionalProperties: false,
            },
          },
        },
      },
      responses: {
        201: {
          description: 'Created',
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
          description: "Here's the thing...",
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
        '404': {
          description: 'Not Found',
          content: {
            'application/json': {
              schema: {
                type: 'null',
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
          description: 'The Thing has been updated',
          content: {
            'application/json': {
              schema: {
                type: 'null',
              },
            },
          },
        },
      },
    },
    delete: {
      summary: 'Delete Thing with ID',
      description: 'Wipe the Thing with ID from existence',
      tags: ['Thing API'],
      parameters: [
        {
          name: 'id',
          description: 'ID of the Thing to delete',
          in: 'path',
          required: true,
          schema: {
            type: 'string',
          },
        },
      ],
      responses: {
        '204': {
          description: 'Thing Deleted',
          content: {
            'application/json': {
              schema: {
                type: 'null',
              },
            },
          },
        },
        '404': {
          description: 'Not Found',
          content: {
            'application/json': {
              schema: {
                type: 'null',
              },
            },
          },
        },
      },
    },
  },
}

export type OpenAPISchemaFixture = typeof openapiSchemasZodV3 | typeof openapiSchemasZodV4
