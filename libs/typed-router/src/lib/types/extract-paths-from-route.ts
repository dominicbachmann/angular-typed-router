import { Route } from '@angular/router';
import { IsNavigable } from './is-navigatable';
import { PathOrEmptyString } from './path-or-empty-string';
import { ExtractLazyChildRoutes } from './extract-lazy-child-routes';
import { JoinPathSegments } from './join-path-segments';

/**
 * Recursively extracts every navigable path from a single Route, preserving
 * `:paramName` markers in their raw colon form. Substituting markers against
 * `RouteParamTypes` is the consumer's job: see `ReplaceParams` for the string
 * rendering and `PathToCommandTuple` for the tuple rendering.
 */
type ExtractChildren<
  Routes extends readonly Route[],
  Prefix extends string
> = Routes[number] extends infer R
  ? R extends Route
    ? ExtractPathsFromRoute<R, Prefix>
    : never
  : never;

export type ExtractPathsFromRoute<
  R extends Route,
  Prefix extends string = ''
> =
  | (IsNavigable<R> extends true
      ? JoinPathSegments<Prefix, PathOrEmptyString<R>>
      : never)
  | (R['children'] extends readonly Route[]
      ? ExtractChildren<
          R['children'],
          JoinPathSegments<Prefix, PathOrEmptyString<R>>
        >
      : never)
  | (R['loadChildren'] extends () => Promise<any>
      ? ExtractChildren<
          ExtractLazyChildRoutes<R>,
          JoinPathSegments<Prefix, PathOrEmptyString<R>>
        >
      : never);
