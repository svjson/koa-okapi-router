/**
 * Type utility that determines if a concrete type is undefined or not.
 */
export type IsUndefined<T> = [T] extends [undefined] ? true : false

/**
 * Type utility that determines if a concrete type is an empty map/object.
 */
export type IsEmptyRecord<R> = keyof R extends never ? true : false
