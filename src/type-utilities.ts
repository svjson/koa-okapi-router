/**
 * Type-utility for evaluating logical AND over multiple boolean
 * type statements.
 *
 * Supports up to 5 operands.
 *
 * @returns true if all operand types resolve to true, otherwise false
 */
export type And<
  A extends boolean,
  B extends boolean,
  C extends boolean = true,
  D extends boolean = true,
  E extends boolean = true,
> = A extends true
  ? B extends true
    ? C extends true
      ? D extends true
        ? E extends true
          ? true
          : false
        : false
      : false
    : false
  : false

/**
 * Simple Not-utility that inverts boolean types
 */
export type Not<T> = T extends true ? false : true

/**
 * Type utility for determining if a type is explicitly `any`.
 *
 * This is "best effort" since any is compatible with everything
 * in the TypeScript type system.
 *
 * The technique used here is based on the fact that `any`
 * absorbs intersections, so `1 & any` is `any`, and
 * `0 extends any` is `true`, whereas for other types
 * `1 & T` produces a more specific type that `0` is not
 * assignable to.
 *
 * @template T - The type to check
 *
 * @returns `true` if T is `any`, `false` otherwise
 */
export type IsAny<T> = 0 extends 1 & T ? true : false

/**
 * Type utility for determining if two types are exactly the same.
 *
 * This differs from a simple `extends` check by ensuring that
 * both types are mutually assignable to each other, which
 * prevents cases where one type is a supertype of the other
 * from evaluating to true.
 *
 * Additionally, it handles the special case of `any` types
 * by using the IsAny utility to ensure that both types
 * are `any` in order to evaluate to true.
 *
 * @template T - The first type to compare
 * @template U - The second type to compare
 */
export type IsExactly<T, U> =
  IsAny<T> extends true
    ? IsAny<U> extends true
      ? true
      : false
    : IsAny<U> extends true
      ? false
      : [T] extends [U]
        ? [U] extends [T]
          ? true
          : false
        : false

/**
 * Type utility that widens/remaps T to W if T is `never`
 *
 * @template T - The type to check
 * @template W - The type to widen to if T is never
 *
 * @returns W if T is never, otherwise T
 */
export type WidenNever<T, W> = [T] extends [never] ? W : T

/**
 * Type utility that determines if a concrete type is undefined or not.
 *
 * Because of how TypeScript handles assignability of null and undefined,
 * we need to verify a possible undefined by reversing the `extends` query
 * according to prevent false positivies for null values.
 *
 * type A = null extends undefined ? true : false    // true
 * type B = undefined extends null ? true : false    // false
 */
export type IsUndefined<T> = [T] extends [undefined]
  ? [undefined] extends [T]
    ? true
    : false
  : false

/**
 * Type utility that determines if a concrete type is an empty map/object.
 *
 * @template R - The record type to check
 */
export type IsEmptyRecord<R> = keyof R extends never ? true : false
