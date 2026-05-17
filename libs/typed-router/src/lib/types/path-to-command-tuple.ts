import { RouteParamTypes } from './replace-params';

type _Normalize<S extends string> = string extends S ? string : S;

type ResolveSegment<S extends string> = S extends `:${infer Name}`
  ? Name extends keyof RouteParamTypes
    ? RouteParamTypes[Name]
    : string
  : _Normalize<S>;

/**
 * Splits a raw route path (`:paramName` markers intact) into a Commands tuple,
 * resolving each `:paramName` segment to its {@link RouteParamTypes} value type
 * directly — preserving brand types that a template-literal substitution would
 * erase. Distributes over union param types to produce a Cartesian product of
 * tuple variants (matching the existing literal-union behavior).
 */
export type PathToCommandTuple<P extends string> = P extends string
  ? P extends `${infer Head}/${infer Rest}`
    ? ResolveSegment<Head> extends infer H
      ? H extends string
        ? [H, ...PathToCommandTuple<Rest>]
        : never
      : never
    : P extends ''
      ? []
      : ResolveSegment<P> extends infer H
        ? H extends string
          ? [H]
          : never
        : never
  : never;
