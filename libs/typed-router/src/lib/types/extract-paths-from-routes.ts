import { Route } from '@angular/router';
import { ExtractPathsFromRoute } from './extract-paths-from-route';

export type ExtractPathsFromRoutes<
  Routes extends readonly Route[],
  Prefix extends string = ''
> = Routes[number] extends infer R
  ? R extends Route
    ? ExtractPathsFromRoute<R, Prefix>
    : never
  : never;
