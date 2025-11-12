
# koa-okapi-router

> Zod-aware router abstraction for Koa, providing a declarative Fastify-style
> schema declaration and (not yet) type-safe middleware input/output

[![npm version](https://img.shields.io/npm/v/koa-okapi-router.svg)](https://www.npmjs.com/package/koa-okapi-router)
[![GitHub](https://img.shields.io/badge/GitHub-svjson%2Fkoa--okapi--router-blue?logo=github)](https://github.com/svjson/koa-okapi-router)
[![License: ISC](https://img.shields.io/badge/license-ISC-green.svg)](LICENSE)
[![Node](https://img.shields.io/node/v/koa-okapi-router)](https://www.npmjs.com/package/koa-okapi-router)

## Features

- Declare routes with Zod schemas
- Support for zod v3 and v4
- Generate openapi.json

## Usage

### Creating an OkapiRouter

Create a router without asking any questions or taking down any names.

```typescript
const router = makeOkapiRouter(new KoaRouter(), {
  openapi: {
    info: { title: `ONECore ${config.applicationName}` },
  },
})
```

Create a router with openapi metadata

```typescript
const router = makeOkapiRouter(new KoaRouter(), {
  openapi: {
    info: { 
      title: `Exotic Animal Spotting API` 
      version: '1.2.3'
    },
  },
})
```

Create a router by bringing your own zod instance. Useful when you rely on importing `zod/v3` or `zod/v4` and cannot
use the default `zod` import.

```typescript
const router = makeOkapiRouter(new KoaRouter(), {
  schema: {
    zod: z
  },
})
```

### Declaring routes with schemas

```typescript
  router.get(
    '/contacts/by-phone-number/:phoneNumber',
    {
      summary: 'Get a single contact by phone number',
      description: 'A somewhat more long-winded description',
      tags: ['Contacts'],
      params: {
        phoneNumber: {
          description: 'Phone number to search for',
          schema: z.string(),
      },
      response: {
        200: z.object({
          content: ContactSchema,
          meta: z.object({}),
        }),
        404: z.null(),
      },
    },
    async (ctx) => {
      // ...
    }
  )
  
  app.use(router.routes())
```

### Serving Swagger with koa2-swagger-ui

```typescript
app.use(
  new KoaRouter()
    .get(okapiRouter.openapiJsonUrl, async (ctx) => {
      ctx.body = api.openapiJson()
    })
    .routes()
)

app.use(
  koaSwagger({
    routePrefix: '/swagger',
    swaggerOptions: { url: api.openapiJsonUrl },
  })
)
```

## Version History

### 0.1.0 - Initial Release - 2025-11-12

- Basic Router abstraction
- Schema declaration in router methods
- `openapi.json` generation


## License

© 2025 Sven Johansson. [ISC Licensed](./LICENSE)
