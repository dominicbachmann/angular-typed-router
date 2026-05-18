import { Route } from '@angular/router';

/**
 * Unwraps a Route's `loadChildren` to its underlying `Route[]`.
 *
 * Returns `[]` if `loadChildren` is missing or returns an unrecognized shape.
 *
 * @example
 *   ExtractLazyChildRoutes<{
 *     path: 'lazy',
 *     loadChildren: () => Promise<[{ path: 'sub', component: C }]>
 *   }>
 *   // [{ path: 'sub', component: C }]
 */
export type ExtractLazyChildRoutes<R extends Route> = R['loadChildren'] extends (
  ...args: any
) => Promise<infer M>
  ? M extends readonly Route[]
    ? M
    : M extends { routes: readonly Route[] }
      ? M['routes']
      : []
  : [];
