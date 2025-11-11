/**
 * Recursively makes all properties of T optional
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object
    ? T[P] extends Function
      ? T[P]
      : DeepPartial<T[P]>
    : T[P]
}

/**
 * Deeply merges user-provided options with defaults.
 * Arrays and non-plain objects are replaced, not merged.
 */
export function mergeDefaults<T>(defaults: T, partial?: DeepPartial<T>): T {
  if (!partial) return structuredClone(defaults)

  const output: any = Array.isArray(defaults) ? [...defaults] : { ...defaults }

  for (const key in partial) {
    const value = (partial as any)[key]
    if (value === undefined) continue

    const defValue = (defaults as any)[key]

    if (
      value &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      defValue &&
      typeof defValue === 'object' &&
      !Array.isArray(defValue)
    ) {
      output[key] = mergeDefaults(defValue, value)
    } else {
      output[key] = value
    }
  }

  return output
}
