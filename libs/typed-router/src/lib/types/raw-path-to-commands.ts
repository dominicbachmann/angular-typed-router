import { ResolveParam } from './resolve-param';

/** Collapses a non-literal `string` input to `string` to prevent recursion artifacts. */
type Normalize<S extends string> = string extends S ? string : S;

/** Resolves one segment: `:param` → ResolveParam<Param>, literal → itself. */
type ResolveSegment<S extends string> =
  S extends `:${infer Name}` ? ResolveParam<Name> : Normalize<S>;

/**
 * Splits a raw path on `/` and resolves each `:paramName` segment directly.
 *
 * @example
 *   RawPathToCommands<'user/:id'>   // ['user', UserId]
 *   RawPathToCommands<'home'>       // ['home']
 *   RawPathToCommands<''>           // []
 */
export type RawPathToCommands<P extends string> = P extends string
  ? P extends `${infer Head}/${infer Rest}`
    ? ResolveSegment<Head> extends infer H
      ? H extends string | number
        ? [H, ...RawPathToCommands<Rest>]
        : never
      : never
    : P extends ''
      ? []
      : ResolveSegment<P> extends infer H
        ? H extends string | number
          ? [H]
          : never
        : never
  : never;
