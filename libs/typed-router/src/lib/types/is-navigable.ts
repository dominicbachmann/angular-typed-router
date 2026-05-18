import { Route } from '@angular/router';

/**
 * True if a Route is navigable on its own — i.e. it can be reached by a URL
 * because it renders a component or redirects.
 *
 * @example
 *   IsNavigable<{ path: 'a', component: C }>                    // true
 *   IsNavigable<{ path: 'a', loadComponent: () => Promise<C> }> // true
 *   IsNavigable<{ path: 'a', redirectTo: 'b' }>                 // true
 *   IsNavigable<{ path: 'a', children: [...] }>                 // false
 */
export type IsNavigable<R extends Route> = R extends { component: any }
  ? true
  : R extends { loadComponent: any }
    ? true
    : R extends { redirectTo: any }
      ? true
      : false;
