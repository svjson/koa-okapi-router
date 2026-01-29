import { OperationObject, SchemaObject } from 'openapi3-ts/oas31'
import { describe, expect, it } from 'vitest'
import { createComponentLink, CmpTuple, linkComponentReferences } from '@src/openapi'
import { makeComponentRef, makeOpenApiObject } from './openapi-fixtures'

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

describe('crateComponentLink', () => {
  it('should replace array item with ref to registered component', () => {
    // Given
    const schemas = [['UserRole', userSchema]] satisfies CmpTuple[]

    const object = {
      type: 'array',
      items: userSchema,
    } satisfies SchemaObject

    // When
    const result = createComponentLink(object, schemas)

    // Then
    expect(result).toEqual({
      type: 'array',
      items: {
        $ref: '#/components/schemas/UserRole',
      },
    })
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
})
