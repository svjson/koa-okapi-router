import { OperationObject, SchemaObject } from 'openapi3-ts/oas31'
import { describe, expect, it } from 'vitest'
import { linkSchema, CmpTuple, linkComponentReferences } from '@src/openapi'
import {
  makeComponentRef,
  makeOpenApiObject,
  makePathParameter,
  makeRequestBody,
  makeResponseObject,
} from './openapi-fixtures'

const userSchema: SchemaObject = {
  type: 'object',
  additionalProperties: false,
  properties: {
    roleId: {
      type: 'string',
    },
  },
  required: ['roleId'],
}

const genreSchema: SchemaObject = {
  enum: ['crime', 'mystery', 'sci-fi', 'fantasy', 'self-help', 'blatant propaganda'],
  type: 'string',
}

const authorSchema: SchemaObject = {
  additionalProperties: false,
  properties: {
    genres: {
      items: genreSchema,
      type: 'array',
    },
    id: {
      maximum: 9007199254740991,
      minimum: -9007199254740991,
      type: 'integer',
    },
    name: {
      type: 'string',
    },
    type: {
      const: 'author',
      type: 'string',
    },
  },
  required: ['id', 'name', 'type', 'genres'],
  type: 'object',
}

const publisherSchema: SchemaObject = {
  additionalProperties: false,
  properties: {
    id: {
      maximum: 9007199254740991,
      minimum: -9007199254740991,
      type: 'integer',
    },
    name: {
      type: 'string',
    },
    region: {
      type: 'string',
    },
    type: {
      const: 'publisher',
      type: 'string',
    },
  },
  required: ['id', 'name', 'type', 'region'],
  type: 'object',
}

const actorSchema: SchemaObject = {
  anyOf: [authorSchema, publisherSchema],
}

describe('linkSchema', () => {
  it('should link array items schema', () => {
    // Given
    const schemas = [['UserRole', userSchema]] satisfies CmpTuple[]

    const object = {
      type: 'array',
      items: userSchema,
    } satisfies SchemaObject

    // When
    const result = linkSchema(object, schemas)

    // Then
    expect(result).toEqual({
      type: 'array',
      items: {
        $ref: '#/components/schemas/UserRole',
      },
    })
  })

  it.each([
    {
      case: 'array of string',
      items: {
        type: 'string',
      },
    },
    {
      case: 'array of integer',
      items: {
        type: 'integer',
      },
    },
    {
      case: 'array of integer with default min/max',
      items: {
        type: 'integer',
        maximum: 9007199254740991,
        minimum: -9007199254740991,
      },
    },
  ] as { case: string; items: SchemaObject }[])('should not link $case', ({ items }) => {
    // Given
    const schemas: CmpTuple[] = [
      ['String', { type: 'string' }],
      ['Integer', { type: 'integer' }],
      [
        'IntegerWithSafeMinMax',
        { type: 'integer', maximum: 9007199254740991, minimum: -9007199254740991 },
      ],
    ]
    const arraySchema: SchemaObject = {
      type: 'array',
      items: items,
    }

    // When
    const result = linkSchema(structuredClone(arraySchema), schemas)

    // Then
    expect(result).toEqual(arraySchema)
  })
})

describe('linkComponentReferences', () => {
  const createdSchema: SchemaObject = {
    type: 'object',
    additionalProperties: false,
    properties: {
      status: {
        type: 'string',
        const: 'CREATED',
      },
    },
  }

  const forbiddenSchema: SchemaObject = {
    type: 'object',
    additionalProperties: false,
    properties: {
      status: {
        type: 'string',
        const: 'FORBIDDEN',
      },
    },
  }

  const rejectedSchema: SchemaObject = {
    type: 'object',
    additionalProperties: false,
    properties: {
      status: {
        type: 'string',
        const: 'REJECTED',
      },
    },
  }

  const dataSchema: SchemaObject = {
    type: 'object',
    additionalProperties: false,
    properties: {
      priority: {
        type: 'integer',
      },
      category: {
        type: 'string',
      },
      data: {
        type: 'string',
      },
    },
  }

  const postOp = {
    requestBody: {
      content: {
        'application/json': {
          schema: dataSchema,
        },
      },
    },
    responses: {
      201: {
        content: {
          'application/json': {
            schema: createdSchema,
          },
        },
      },
      403: {
        content: {
          'application/json': {
            schema: forbiddenSchema,
          },
        },
      },
    },
  } satisfies OperationObject

  it('should do nothing when no component matches path response or requestBody schemas', () => {
    // Given
    const openApiObject = makeOpenApiObject({
      paths: {
        '/endpoint': {
          post: postOp,
        },
      },
      components: {
        schemas: {
          RejectedResponse: rejectedSchema,
          User: userSchema,
        },
      },
    })

    // When
    const result = linkComponentReferences(openApiObject)

    // Then
    expect(result).toEqual(openApiObject)
  })

  it('should replace path requestBody schema with component reference', () => {
    // Given
    const openApiObject = makeOpenApiObject({
      paths: {
        '/endpoint': {
          post: postOp,
        },
      },
      components: {
        schemas: {
          DataObject: dataSchema,
          User: userSchema,
        },
      },
    })

    // When
    const result = linkComponentReferences(openApiObject)

    // Then
    expect(result).toEqual({
      ...openApiObject,
      paths: {
        '/endpoint': {
          post: {
            requestBody: {
              content: {
                'application/json': {
                  schema: makeComponentRef('DataObject'),
                },
              },
            },

            responses: {
              ...openApiObject.paths['/endpoint'].post.responses,
            },
          },
        },
      },
    })
  })

  it('should replace path response and requestBody schemas with component references', () => {
    // Given
    const openApiObject = makeOpenApiObject({
      paths: {
        '/endpoint': {
          post: postOp,
        },
      },
      components: {
        schemas: {
          DataObject: dataSchema,
          RejectedResponse: rejectedSchema,
          CreatedResponse: createdSchema,
          ForbiddenResponse: forbiddenSchema,
          User: userSchema,
        },
      },
    })

    // When
    const result = linkComponentReferences(openApiObject)

    // Then
    expect(result).toEqual({
      ...openApiObject,
      paths: {
        '/endpoint': {
          post: {
            requestBody: {
              content: {
                'application/json': {
                  schema: makeComponentRef('DataObject'),
                },
              },
            },
            responses: {
              201: {
                content: {
                  'application/json': {
                    schema: makeComponentRef('CreatedResponse'),
                  },
                },
              },
              403: {
                content: {
                  'application/json': {
                    schema: makeComponentRef('ForbiddenResponse'),
                  },
                },
              },
            },
          },
        },
      },
    })
  })

  it('should replace nested requestBody property with component reference', () => {
    // Given
    const openApiObject = makeOpenApiObject({
      paths: {
        '/endpoint': {
          post: {
            requestBody: {
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      _links: makeComponentRef('Links'),
                      content: dataSchema,
                    },
                  },
                },
              },
            },
            responses: {
              201: {
                content: {
                  'application/json': {
                    schema: makeComponentRef('CreatedResponse'),
                  },
                },
              },
              403: {
                content: {
                  'application/json': {
                    schema: makeComponentRef('ForbiddenResponse'),
                  },
                },
              },
            },
          },
        },
      },
      components: {
        schemas: {
          DataObject: dataSchema,
          User: userSchema,
        },
      },
    })

    // When
    const result = linkComponentReferences(openApiObject)

    // Then
    expect(result).toEqual({
      ...openApiObject,
      paths: {
        '/endpoint': {
          post: {
            requestBody: makeRequestBody({
              type: 'object',
              properties: {
                _links: makeComponentRef('Links'),
                content: makeComponentRef('DataObject'),
              },
            }),
            responses: {
              ...openApiObject.paths['/endpoint'].post.responses,
            },
          },
        },
      },
    })
  })

  it('should replace response schema with reference to `anyOf` object', () => {
    const openApiObject = makeOpenApiObject({
      paths: {
        '/actors/{id}': {
          get: {
            parameters: [makePathParameter('id', 'integer')],
            responses: {
              200: makeResponseObject(actorSchema),
            },
          },
        },
      },
      components: {
        schemas: {
          Actor: actorSchema,
        },
      },
    })

    // When
    const result = linkComponentReferences(openApiObject)

    // Then
    expect(result).toEqual(
      makeOpenApiObject({
        paths: {
          '/actors/{id}': {
            get: {
              parameters: [makePathParameter('id', 'integer')],
              responses: {
                200: makeResponseObject(makeComponentRef('Actor')),
              },
            },
          },
        },
        components: openApiObject.components,
      })
    )
  })

  it('should replace anyOf option schemas with component references', () => {
    const openApiObject = makeOpenApiObject({
      paths: {
        '/actors/{id}': {
          get: {
            parameters: [makePathParameter('id', 'integer')],
            responses: {
              200: makeResponseObject(actorSchema),
            },
          },
        },
      },
      components: {
        schemas: {
          Author: authorSchema,
          Publisher: publisherSchema,
        },
      },
    })

    // When
    const result = linkComponentReferences(openApiObject)

    // Then
    expect(result).toEqual(
      makeOpenApiObject({
        paths: {
          '/actors/{id}': {
            get: {
              parameters: [makePathParameter('id', 'integer')],
              responses: {
                200: makeResponseObject({
                  anyOf: [makeComponentRef('Author'), makeComponentRef('Publisher')],
                }),
              },
            },
          },
        },
        components: openApiObject.components,
      })
    )
  })
})
