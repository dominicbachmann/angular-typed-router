import { RouteParamTypes } from './route-param-types';

/**
 * Resolves a single `:paramName` to its declared value type.
 *
 * Returns `never` for undeclared params, so a route with an undeclared
 * `:param` disappears from both Path and Commands.
 *
 * @example
 *   declare module './route-param-types' {
 *     interface RouteParamTypes { id: UserId }
 *   }
 *   type X = ResolveParam<'id'>      // UserId
 *   type Y = ResolveParam<'unknown'> // never
 */
export type ResolveParam<Name extends string> =
  Name extends keyof RouteParamTypes ? RouteParamTypes[Name] : never;
