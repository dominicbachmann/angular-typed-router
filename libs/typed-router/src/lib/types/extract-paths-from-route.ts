import { Route } from '@angular/router';
import { IsNavigable } from './is-navigatable';
import { ReplaceParams } from './replace-params';
import { PathOrEmptyString } from './path-or-empty-string';
import { ExtractLazyChildRoutes } from './extract-lazy-child-routes';
import { JoinPathSegments } from './join-path-segments';

type ExtractChildren<
  Routes extends readonly Route[],
  Prefix extends string
> = Routes[number] extends infer R
  ? R extends Route
    ? ExtractPathsFromRoute<R, Prefix>
    : never
  : never;

export type ExtractPathsFromRoute<R extends Route, Prefix extends string = ''> =
  | (IsNavigable<R> extends true
  ? ReplaceParams<JoinPathSegments<Prefix, PathOrEmptyString<R>>>
  : never)
  | (R['children'] extends readonly Route[]
  ? ExtractChildren<
    R['children'],
    ReplaceParams<JoinPathSegments<Prefix, PathOrEmptyString<R>>>
  >
  : never)
  | (R['loadChildren'] extends () => Promise<any>
  ? ExtractChildren<
    ExtractLazyChildRoutes<R>,
    ReplaceParams<JoinPathSegments<Prefix, PathOrEmptyString<R>>>
  >
  : never);
