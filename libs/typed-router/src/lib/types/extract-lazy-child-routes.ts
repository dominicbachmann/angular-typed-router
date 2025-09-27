import { Route } from '@angular/router';

export type ExtractLazyChildRoutes<R extends Route> = R['loadChildren'] extends (
    ...args: any
  ) => Promise<infer M>
  ? M extends readonly Route[]
    ? M
    : M extends { routes: readonly Route[] }
      ? M['routes']
      : []
  : [];
