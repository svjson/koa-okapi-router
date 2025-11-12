import Koa from 'koa'
import { Server } from 'node:http'
import KoaRouter from '@koa/router'
import { makeOkapiRouter } from '@src/index'
import { ZodLike } from './types'

export const testClient = (port: number) => {
  return {
    get: async (url: string) => {
      return await fetch(`http://localhost:${port}${url}`)
    },
  }
}

export const koaFixture = (z: ZodLike) => {
  const koa = new Koa()
  const koaRouter = new KoaRouter()
  const okapiRouter = makeOkapiRouter(koaRouter, { schema: { zod: z } })
  let server: Server | null

  return {
    koa,
    koaRouter,
    okapiRouter,
    port: () => {
      return (server.address() as any).port
    },
    client: function () {
      return testClient(this.port())
    },
    start: () => {
      koa.use(okapiRouter.routes())
      koa.use(okapiRouter.allowedMethods())
      server = koa.listen(0)
    },
    stop: () => {
      server.close()
    },
  }
}
