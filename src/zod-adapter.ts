export interface ZodTypeAny {
  nullable: Function
  optional: Function
  isOptional?: Function
  _def: any
}

/**
 * Adapter-interface allowing okapi to work with both zod v3 and
 * v4.
 */
export interface ZodAdapter {
  /**
   * The zod instance used by this adapter. Can be either
   * zod version 3 or version 4.
   */
  z: any
  /**
   * Numeric major version (3 or 4)
   */
  major: number
  /**
   * True if the zod instance supports the v4 API surface
   */
  isV4: boolean
  /**
   * Convert a Zod schema to JSON Schema
   */
  toJsonSchema(schema: ZodTypeAny, name?: string): any
}

/**
 * Determine the zod major version from a zod instance by
 * inspecting the object structure.
 *
 * Not fool-proof by any means, but reliable enough.
 */
export const determineZodMajorVersion = (z: any): number => {
  // Try version first (works when present)
  const v = z?.version
  if (typeof v === 'string') {
    const m = /^(\d+)/.exec(v)
    if (m) return Number(m[1]) >= 4 ? 4 : 3
  }
  // zod v4 schemas have toJSONSchema(). If it's not present, we
  // safely assume v3
  if (typeof (z as any).toJSONSchema === 'function') return 4
  return 3
}

/**
 * Creates a runtime adapter around the provided Zod instance.
 * Works with zod v3, zod/v4 preview, and zod >=4.0 (which re-exports v3).
 */
export const makeZodAdapter = (z: any): ZodAdapter => {
  if (!z || typeof z !== 'object') {
    throw new Error('makeZodAdapter: expected a Zod instance')
  }

  const zodVersion = determineZodMajorVersion(z)

  return {
    z,
    major: zodVersion,
    isV4: zodVersion >= 4,
    toJsonSchema: (schema: ZodTypeAny, name?: string): any => {
      if (!schema || typeof schema !== 'object' || !('parse' in schema)) {
        console.warn('Invalid Zod schema: ', schema)
        return {}
      }

      /**
       * Attempt to use the built-in toJSONSchema of zod 4, if present
       */
      if (typeof z.toJSONSchema === 'function') {
        const jsonSchema = z.toJSONSchema(schema, {
          name,
          $refStrategy: 'none',
        })
        // Get rid of the $schema field produced by zod v4, but that is
        // not part of the openapi schema
        delete jsonSchema.$schema
        return jsonSchema
      }

      /**
       * Fall back to a wrapped zod-to-json-schema, with the actual zod
       * instance bound.
       *
       * zod-to-json-schema internally imports 'zod', and if the instance
       * checks of the schema objects do not match its imported versions
       * it will bail out and generate empty schemas.
       */
      const bindConverter = require('./zod-v3-wrapper').bindConverter
      const toJson = bindConverter(z)
      return toJson(schema, {
        name,
        target: 'openApi3',
        $refStrategy: 'none',
      })
    },
  }
}

// Convenience type alias usable in route schemas
export type AnyZodSchema = ZodTypeAny
