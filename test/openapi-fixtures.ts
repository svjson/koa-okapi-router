import {
  OpenAPIObject,
  ParameterObject,
  ReferenceObject,
  SchemaObject,
  SchemaObjectType,
} from 'openapi3-ts/oas31'

export const makeOpenApiObject = (schema: Partial<OpenAPIObject>): OpenAPIObject => {
  return {
    openapi: '3.1.0',
    info: {
      title: 'Koa Application',
      version: '1.0.0',
    },
    ...schema,
  }
}

export const makeComponentRef = (componentName: string) => {
  return {
    $ref: `#/components/schemas/${componentName}`,
  }
}

export const makePathParameter = (
  name: string,
  type: SchemaObjectType
): ParameterObject => ({
  name,
  in: 'path',
  required: true,
  schema: {
    type,
  },
})

export const makeRequestBody = (obj: SchemaObject | ReferenceObject) => ({
  content: {
    'application/json': {
      schema: obj,
    },
  },
})

export const makeResponseObject = (obj: SchemaObject | ReferenceObject) => ({
  content: {
    'application/json': {
      schema: obj,
    },
  },
})
