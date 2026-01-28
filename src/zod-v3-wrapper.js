import path from 'node:path'
import { createRequire } from 'node:module'
import Module from 'node:module'

/**
 * Loads zod-to-json-schema so that it uses the provided Zod instance.
 * Works with both ESM and CJS builds of the converter.
 */
export function bindConverter(z) {
  const req = createRequire(path.join(process.cwd(), '__fake__.js'))

  const converterPath = req.resolve('zod-to-json-schema')
  const realRequire = createRequire(converterPath)

  // Temporarily override Module._load just for this single import
  const originalLoad = Module._load
  Module._load = function (request, parent, isMain) {
    if (request === 'zod') return z
    return originalLoad(request, parent, isMain)
  }

  try {
    const converter = realRequire('zod-to-json-schema')
    const fn =
      converter.zodToJsonSchema || converter.default?.zodToJsonSchema || converter.default
    if (typeof fn !== 'function') {
      throw new Error('Cannot find zodToJsonSchema export')
    }

    // Return a closure bound to the correct zod instance
    return (schema, opts = {}) => fn(schema, { zod: z, ...opts })
  } finally {
    Module._load = originalLoad
  }
}
