import { OpenAPIObject } from 'openapi3-ts/oas31'

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
