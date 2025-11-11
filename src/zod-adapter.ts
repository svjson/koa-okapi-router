import z, { ZodTypeAny } from 'zod'

export interface ZodAdapter {
  /** The user's provided zod instance */
  z: any
  /** Numeric major version (3 or 4) */
  major: number
  /** True if it supports the v4 API surface */
  isV4: boolean
  /** Convert a Zod schema to JSON Schema */
  toJsonSchema(schema: ZodTypeAny): any
}

/**
 * Creates a runtime adapter around the provided Zod instance.
 * Works with zod v3, zod/v4 preview, and zod >=4.0 (which re-exports v3).
 */
export function makeZodAdapter(z: any): ZodAdapter {
  if (!z || typeof z !== 'object') {
    throw new Error('makeZodAdapter: expected a Zod instance')
  }

  // detect version
  let major = 3
  const ver = (z.version || z.ZodObject?.version || '') as string
  const m = ver.match(/^(\d+)/)
  if (m) major = parseInt(m[1], 10)
  else if (z.ZodReadonly) major = 4 // quick heuristic for preview builds

  const isV4 = major >= 4

  // use the correct converter
  const { zodToJsonSchema } = require('zod-to-json-schema')

  return {
    z,
    major,
    isV4,
    toJsonSchema(schema) {
      return zodToJsonSchema(schema)
    },
  }
}

// Convenience type alias usable in route schemas
export type AnyZodSchema = ZodTypeAny
