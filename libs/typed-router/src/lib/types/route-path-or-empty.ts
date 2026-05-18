import { Route } from '@angular/router';

/**
 * Reads a Route's `path` property if it's a string, otherwise returns the
 * empty string. Used so a path-less Route (allowed by Angular) contributes
 * no segment when joined with its parents or children.
 *
 * @example
 *   RoutePathOrEmpty<{ path: 'home' }>   // 'home'
 *   RoutePathOrEmpty<{ component: C }>   // ''
 */
export type RoutePathOrEmpty<R extends Route> = R['path'] extends string
  ? R['path']
  : '';
