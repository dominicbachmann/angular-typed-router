import { Route } from '@angular/router';

export type IsNavigable<R extends Route> = R extends { component: any }
  ? true
  : R extends { loadComponent: any }
    ? true
    : R extends { redirectTo: any }
      ? true
      : false;
