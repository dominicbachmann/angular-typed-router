import { Route } from '@angular/router';
import { IsNavigable } from './is-navigable';
import { RoutePathOrEmpty } from './route-path-or-empty';
import { ExtractLazyChildRoutes } from './extract-lazy-child-routes';
import { JoinPathSegments } from './join-path-segments';
import { ExtractRawPaths } from './extract-raw-paths';

/**
 * Emits every navigable path reachable from a single Route, with `:paramName`
 * markers preserved. A Route contributes:
 *   - itself, if navigable (has component / loadComponent / redirectTo)
 *   - each of its children, prefixed with its own path
 *   - each of its lazy-loaded children, prefixed with its own path
 *
 * @example
 *   ExtractRawPathsFromRoute<{
 *     path: 'parent', component: C,
 *     children: [{ path: 'child', component: C }]
 *   }>
 *   // 'parent' | 'parent/child'
 */
export type ExtractRawPathsFromRoute<R extends Route, Prefix extends string = ''> =
  | (IsNavigable<R> extends true
      ? JoinPathSegments<Prefix, RoutePathOrEmpty<R>>
      : never)
  | (R['children'] extends readonly Route[]
      ? ExtractRawPaths<R['children'], JoinPathSegments<Prefix, RoutePathOrEmpty<R>>>
      : never)
  | (R['loadChildren'] extends () => Promise<any>
      ? ExtractRawPaths<ExtractLazyChildRoutes<R>, JoinPathSegments<Prefix, RoutePathOrEmpty<R>>>
      : never);
