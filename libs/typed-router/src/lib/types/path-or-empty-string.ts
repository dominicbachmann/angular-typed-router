import { Route } from '@angular/router';

export type PathOrEmptyString<R extends Route> = R['path'] extends string
  ? R['path']
  : '';
