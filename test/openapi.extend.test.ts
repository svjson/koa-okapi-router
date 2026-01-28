import { describe, it, expect } from 'vitest'
import { extendOpenApiJson } from '@src/openapi'

describe('extendOpenApiJson', () => {
  it('should use info and openapi sections from base if provided', () => {
    expect(
      extendOpenApiJson(
        {
          openapi: '3.1.0',
          info: { title: 'A Dapper API', version: '1.4.0' },
        },
        {
          openapi: '3.0.0',
          info: { title: 'Supplementary Routes', version: '1.0.0' },
        }
      )
    ).toEqual({
      openapi: '3.1.0',
      info: { title: 'A Dapper API', version: '1.4.0' },
      paths: {},
      components: {},
    })
  })

  it('should use info and openapi sections from additonal api when not present in base', () => {
    expect(
      extendOpenApiJson('{}', {
        openapi: '3.0.0',
        info: { title: 'Supplementary Routes', version: '1.0.0' },
      })
    ).toEqual({
      openapi: '3.0.0',
      info: { title: 'Supplementary Routes', version: '1.0.0' },
      paths: {},
      components: {},
    })
  })

  it('should merge components section from both documents', () => {
    expect(
      extendOpenApiJson(
        {
          openapi: '3.1.0',
          info: { title: 'A Dapper API', version: '1.4.0' },
          components: {
            schemas: {
              NiceString: {
                type: 'string',
              },
            },
          },
        },
        {
          openapi: '3.0.0',
          info: { title: 'Supplementary Routes', version: '1.0.0' },
          components: {
            schemas: {
              PrettyNumber: {
                type: 'integer',
              },
            },
          },
        }
      )
    ).toEqual({
      openapi: '3.1.0',
      info: { title: 'A Dapper API', version: '1.4.0' },
      paths: {},
      components: {
        schemas: {
          NiceString: {
            type: 'string',
          },
          PrettyNumber: {
            type: 'integer',
          },
        },
      },
    })
  })
})
