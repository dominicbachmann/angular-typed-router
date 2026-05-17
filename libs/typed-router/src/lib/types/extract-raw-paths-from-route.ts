import { Route } from '@angular/router';
import { IsNavigable } from './is-navigatable';
import { PathOrEmptyString } from './path-or-empty-string';
import { ExtractLazyChildRoutes } from './extract-lazy-child-routes';
import { JoinPathSegments } from './join-path-segments';

/**
 * Like {@link ExtractPathsFromRoute} but does NOT replace `:paramName` markers
 * with their {@link RouteParamTypes} values. Produces paths in their raw,
 * colon-marker form so a tuple splitter can resolve each param slot to its
 * brand type directly (preserving nominal types that template-literal
 * substitution would otherwise erase).
 */

type ExtractRawChildren<
  Routes extends readonly Route[],
  Prefix extends string
> = Routes[number] extends infer R
  ? R extends Route
    ? ExtractRawPathsFromRoute<R, Prefix>
    : never
  : never;

export type ExtractRawPathsFromRoute<
  R extends Route,
  Prefix extends string = ''
> =
  | (IsNavigable<R> extends true
  ? JoinPathSegments<Prefix, PathOrEmptyString<R>>
  : never)
  | (R['children'] extends readonly Route[]
  ? ExtractRawChildren<
    R['children'],
    JoinPathSegments<Prefix, PathOrEmptyString<R>>
  >
  : never)
  | (R['loadChildren'] extends () => Promise<any>
  ? ExtractRawChildren<
    ExtractLazyChildRoutes<R>,
    JoinPathSegments<Prefix, PathOrEmptyString<R>>
  >
  : never);
